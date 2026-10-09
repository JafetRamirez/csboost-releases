//! Motor de tweaks: detectar → aplicar (gravando o estado anterior) → reverter.
//!
//! Regras:
//! - nunca aplica o que já está aplicado (idempotente);
//! - grava o valor anterior no journal ANTES de escrever;
//! - se uma ação falhar no meio, desfaz as que já foram feitas naquele tweak.

use crate::catalog::{self, Action, Hive, PowerPlanTarget, RegData, Tweak};
use crate::cs2;
use crate::journal::{Change, Journal};
use crate::platform;
use anyhow::{anyhow, Result};
use serde::Serialize;
use std::sync::Mutex;

static LOCK: Mutex<()> = Mutex::new(());

const GPU_PREF_PATH: &str = r"Software\Microsoft\DirectX\UserGpuPreferences";
const GPU_PREF_HIGH: &str = "GpuPreference=2;";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum TweakState {
    Applied,
    NotApplied,
    Partial,
    Unknown,
}

#[derive(Debug, Clone, Serialize)]
pub struct TweakView {
    #[serde(flatten)]
    pub tweak: Tweak,
    pub state: TweakState,
    /// Aplicado pelo CSBoost (pode ser revertido por aqui).
    pub managed: bool,
    pub supported: bool,
    pub unsupported_reason: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct OpResult {
    pub tweak_id: String,
    pub ok: bool,
    pub skipped: bool,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct BatchResult {
    pub results: Vec<OpResult>,
    pub needs_reboot: bool,
}

pub struct Ctx {
    pub os_build: u32,
    pub cs2_exe: Option<String>,
}

impl Ctx {
    pub fn detect() -> Ctx {
        let os_build = match platform::reg_read(
            Hive::Hklm,
            r"SOFTWARE\Microsoft\Windows NT\CurrentVersion",
            "CurrentBuildNumber",
        ) {
            Ok(Some(RegData::Sz(s))) => s.parse().unwrap_or(0),
            _ => 0,
        };
        Ctx {
            os_build,
            cs2_exe: cs2::exe_path().map(|p| p.display().to_string()),
        }
    }
}

fn unsupported_reason(t: &Tweak, ctx: &Ctx) -> Option<String> {
    if !cfg!(windows) {
        return Some(tr!("Disponível apenas no Windows", "Disponible solo en Windows", "Only available on Windows"));
    }
    if let Some(min) = t.min_build {
        if ctx.os_build != 0 && ctx.os_build < min {
            return Some(if min >= 22000 {
                tr!("Só funciona no Windows 11", "Solo funciona en Windows 11", "Only works on Windows 11")
            } else {
                tr!("Requer Windows build {min} ou superior", "Requiere Windows build {min} o superior", "Requires Windows build {min} or later")
            });
        }
    }
    if t.actions.iter().any(|a| matches!(a, Action::Cs2GpuPreference)) && ctx.cs2_exe.is_none() {
        return Some(tr!("CS2 não encontrado neste PC", "CS2 no encontrado en esta PC", "CS2 not found on this PC"));
    }
    None
}

fn action_applied(a: &Action, ctx: &Ctx, journal_applied_plan: Option<&str>) -> Option<bool> {
    match a {
        Action::Registry { hive, path, name, value } => {
            platform::reg_read(*hive, path, name).ok().map(|cur| cur.as_ref() == Some(value))
        }
        Action::PowerPlan { plan: PowerPlanTarget::HighPerformance } => {
            platform::power_active().ok().map(|g| {
                g == platform::PLAN_HIGH
                    || g == platform::PLAN_ULTIMATE
                    || journal_applied_plan.map(|p| p == g).unwrap_or(false)
            })
        }
        Action::Cs2GpuPreference => {
            let exe = ctx.cs2_exe.as_ref()?;
            platform::reg_read(Hive::Hkcu, GPU_PREF_PATH, exe).ok().map(|v| match v {
                Some(RegData::Sz(s)) => s.contains("GpuPreference=2"),
                _ => false,
            })
        }
    }
}

pub fn detect(t: &Tweak, ctx: &Ctx, journal: &Journal) -> TweakState {
    let applied_plan = journal.active(&t.id).and_then(|e| {
        e.changes.iter().find_map(|c| match c {
            Change::PowerPlan { applied, .. } => Some(applied.as_str()),
            _ => None,
        })
    });
    let states: Vec<Option<bool>> = t.actions.iter().map(|a| action_applied(a, ctx, applied_plan)).collect();
    if states.iter().any(|s| s.is_none()) {
        return TweakState::Unknown;
    }
    let on = states.iter().filter(|s| **s == Some(true)).count();
    match on {
        0 => TweakState::NotApplied,
        n if n == states.len() => TweakState::Applied,
        _ => TweakState::Partial,
    }
}

pub fn list() -> Vec<TweakView> {
    let ctx = Ctx::detect();
    let journal = Journal::load();
    catalog::load()
        .into_iter()
        .map(|t| {
            let reason = unsupported_reason(&t, &ctx);
            let state = if reason.is_some() { TweakState::Unknown } else { detect(&t, &ctx, &journal) };
            TweakView {
                managed: journal.active(&t.id).is_some(),
                supported: reason.is_none(),
                unsupported_reason: reason,
                state,
                tweak: t,
            }
        })
        .collect()
}

fn apply_action(a: &Action, ctx: &Ctx) -> Result<Change> {
    match a {
        Action::Registry { hive, path, name, value } => {
            let previous = platform::reg_read(*hive, path, name)?;
            platform::reg_write(*hive, path, name, value)?;
            if platform::reg_read(*hive, path, name)?.as_ref() != Some(value) {
                return Err(anyhow!(tr!("o valor não foi gravado em {path}\\{name}", "el valor no se guardó en {path}\\{name}", "the value was not written to {path}\\{name}")));
            }
            Ok(Change::Registry { hive: *hive, path: path.clone(), name: name.clone(), previous, applied: Some(value.clone()) })
        }
        Action::PowerPlan { plan: PowerPlanTarget::HighPerformance } => {
            let previous = platform::power_active()?;
            let applied = platform::power_ensure_high_performance()?;
            Ok(Change::PowerPlan { previous, applied })
        }
        Action::Cs2GpuPreference => {
            let exe = ctx.cs2_exe.clone().ok_or_else(|| anyhow!(tr!("CS2 não encontrado", "CS2 no encontrado", "CS2 not found")))?;
            let previous = platform::reg_read(Hive::Hkcu, GPU_PREF_PATH, &exe)?;
            let value = RegData::Sz(GPU_PREF_HIGH.into());
            platform::reg_write(Hive::Hkcu, GPU_PREF_PATH, &exe, &value)?;
            Ok(Change::Registry { hive: Hive::Hkcu, path: GPU_PREF_PATH.into(), name: exe, previous, applied: Some(value) })
        }
    }
}

pub fn undo_change(c: &Change) -> Result<()> {
    match c {
        Change::Registry { hive, path, name, previous, .. } => match previous {
            Some(v) => platform::reg_write(*hive, path, name, v),
            None => platform::reg_delete(*hive, path, name),
        },
        Change::PowerPlan { previous, .. } => platform::power_set(previous),
        Change::File { path, previous } => {
            match previous {
                Some(content) => std::fs::write(path, content)?,
                None => {
                    if std::path::Path::new(path).exists() {
                        std::fs::remove_file(path)?;
                    }
                }
            }
            Ok(())
        }
        Change::DisplayRefresh { device, previous_hz, .. } => platform::set_display_refresh(device, *previous_hz),
    }
}

fn apply_one(t: &Tweak, ctx: &Ctx, journal: &mut Journal) -> OpResult {
    let skip = |msg: String| OpResult { tweak_id: t.id.clone(), ok: true, skipped: true, message: Some(msg) };
    if let Some(r) = unsupported_reason(t, ctx) {
        return OpResult { tweak_id: t.id.clone(), ok: false, skipped: true, message: Some(r) };
    }
    if journal.active(&t.id).is_some() {
        return skip(tr!("Já aplicado pelo CSBoost", "Ya aplicado por CSBoost", "Already applied by CSBoost"));
    }
    if detect(t, ctx, journal) == TweakState::Applied {
        return skip(tr!("Já estava ativo no sistema", "Ya estaba activo en el sistema", "Already active on the system"));
    }

    let mut done: Vec<Change> = Vec::new();
    for a in &t.actions {
        match apply_action(a, ctx) {
            Ok(c) => done.push(c),
            Err(e) => {
                for c in done.iter().rev() {
                    let _ = undo_change(c);
                }
                return OpResult { tweak_id: t.id.clone(), ok: false, skipped: false, message: Some(e.to_string()) };
            }
        }
    }
    journal.push(&t.id, &t.title, done);
    OpResult { tweak_id: t.id.clone(), ok: true, skipped: false, message: None }
}

pub fn apply(ids: &[String]) -> Result<BatchResult> {
    let _g = LOCK.lock().map_err(|_| anyhow!("motor ocupado"))?;
    let ctx = Ctx::detect();
    let mut journal = Journal::load();
    let mut results = Vec::new();
    let mut needs_reboot = false;
    for id in ids {
        let Some(t) = catalog::find(id) else {
            results.push(OpResult { tweak_id: id.clone(), ok: false, skipped: true, message: Some(tr!("Ajuste desconhecido", "Ajuste desconocido", "Unknown tweak")) });
            continue;
        };
        let r = apply_one(&t, &ctx, &mut journal);
        if r.ok && !r.skipped && t.requires_reboot {
            needs_reboot = true;
        }
        results.push(r);
        journal.save()?;
    }
    Ok(BatchResult { results, needs_reboot })
}

pub fn revert(ids: &[String]) -> Result<BatchResult> {
    let _g = LOCK.lock().map_err(|_| anyhow!("motor ocupado"))?;
    let mut journal = Journal::load();
    let mut results = Vec::new();
    let mut needs_reboot = false;
    for id in ids {
        let Some(entry) = journal.active_mut(id) else {
            results.push(OpResult { tweak_id: id.clone(), ok: true, skipped: true, message: Some(tr!("Nada para reverter", "Nada para revertir", "Nothing to revert")) });
            continue;
        };
        let mut err = None;
        for c in entry.changes.iter().rev() {
            if let Err(e) = undo_change(c) {
                err = Some(e.to_string());
            }
        }
        if err.is_none() {
            entry.reverted_at = Some(crate::journal::now_ms());
            if catalog::find(id).map(|t| t.requires_reboot).unwrap_or(false) {
                needs_reboot = true;
            }
        }
        results.push(OpResult { tweak_id: id.clone(), ok: err.is_none(), skipped: false, message: err });
        journal.save()?;
    }
    Ok(BatchResult { results, needs_reboot })
}

pub fn revert_all() -> Result<BatchResult> {
    let mut ids = Journal::load().active_ids();
    ids.reverse(); // desfaz do mais recente para o mais antigo
    revert(&ids)
}

/// Registra uma mudança feita fora do catálogo (ex.: autoexec, Hz do monitor).
pub fn record_external(tweak_id: &str, title: &str, change: Change) -> Result<()> {
    let _g = LOCK.lock().map_err(|_| anyhow!("motor ocupado"))?;
    let mut journal = Journal::load();
    // se já havia uma entrada ativa, mantém o "anterior" original
    if let Some(prev) = journal.active_mut(tweak_id) {
        prev.reverted_at = Some(crate::journal::now_ms());
        let original = prev.changes.first().cloned();
        let merged = match (original, change) {
            (Some(Change::File { previous, .. }), Change::File { path, .. }) => Change::File { path, previous },
            (Some(Change::DisplayRefresh { previous_hz, .. }), Change::DisplayRefresh { device, applied_hz, .. }) => {
                Change::DisplayRefresh { device, previous_hz, applied_hz }
            }
            (_, c) => c,
        };
        journal.push(tweak_id, title, vec![merged]);
    } else {
        journal.push(tweak_id, title, vec![change]);
    }
    journal.save()
}
