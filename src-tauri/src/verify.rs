//! Conferência: relê o Windows AGORA e compara com o que o CSBoost gravou.
//! Responde "foi aplicado mesmo?" com antes → esperado → atual, e avisa
//! quando o ajuste só vale depois de reiniciar o PC.

use crate::catalog::{self, Action, Hive, RegData};
use crate::journal::{Change, Journal};
use crate::platform;
use serde::Serialize;

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum CheckStatus {
    /// O valor atual é o que o CSBoost gravou.
    Ok,
    /// Gravado, mas só vale depois de reiniciar o PC.
    PendingReboot,
    /// Alguém (Windows, outro programa, você) mudou de volta.
    Changed,
    /// Não foi possível ler.
    Unknown,
}

#[derive(Debug, Clone, Serialize)]
pub struct ChangeCheck {
    pub label: String,
    pub before: String,
    pub expected: String,
    pub now: String,
    pub status: CheckStatus,
}

#[derive(Debug, Clone, Serialize)]
pub struct EntryCheck {
    pub entry_id: u64,
    pub tweak_id: String,
    pub title: String,
    pub applied_at: u64,
    pub status: CheckStatus,
    pub how_to_check: Option<String>,
    pub checks: Vec<ChangeCheck>,
}

fn fmt_reg(v: &Option<RegData>) -> String {
    match v {
        None => "não existia".into(),
        Some(RegData::Dword(n)) => n.to_string(),
        Some(RegData::Sz(s)) if s.is_empty() => "(vazio)".into(),
        Some(RegData::Sz(s)) => s.clone(),
        Some(RegData::Raw { .. }) => "(valor binário)".into(),
    }
}

fn hive_name(h: Hive) -> &'static str {
    match h {
        Hive::Hkcu => "HKCU",
        Hive::Hklm => "HKLM",
    }
}

fn plan_label(guid: &str) -> String {
    let name = platform::plan_name(guid);
    if name == "Personalizado" {
        format!("Personalizado ({})", &guid[..8.min(guid.len())])
    } else {
        name.to_string()
    }
}

/// Valor esperado de um registro em journals antigos (sem `applied`).
fn expected_from_catalog(tweak_id: &str, path: &str, name: &str) -> Option<RegData> {
    let t = catalog::find(tweak_id)?;
    t.actions.iter().find_map(|a| match a {
        Action::Registry { path: p, name: n, value, .. } if p.eq_ignore_ascii_case(path) && n == name => Some(value.clone()),
        Action::Cs2GpuPreference => Some(RegData::Sz("GpuPreference=2;".into())),
        _ => None,
    })
}

fn check_change(tweak_id: &str, c: &Change, pending: bool) -> ChangeCheck {
    let settle = |ok: bool| match (ok, pending) {
        (true, true) => CheckStatus::PendingReboot,
        (true, false) => CheckStatus::Ok,
        (false, _) => CheckStatus::Changed,
    };
    match c {
        Change::Registry { hive, path, name, previous, applied } => {
            let expected = applied.clone().or_else(|| expected_from_catalog(tweak_id, path, name));
            let label = if name.to_ascii_lowercase().ends_with("cs2.exe") {
                format!("{}\\{}  (cs2.exe)", hive_name(*hive), path)
            } else {
                format!("{}\\{}\\{}", hive_name(*hive), path, name)
            };
            match platform::reg_read(*hive, path, name) {
                Ok(now) => {
                    let ok = expected.is_some() && now == expected;
                    ChangeCheck {
                        label,
                        before: fmt_reg(previous),
                        expected: fmt_reg(&expected),
                        now: fmt_reg(&now),
                        status: settle(ok),
                    }
                }
                Err(e) => ChangeCheck {
                    label,
                    before: fmt_reg(previous),
                    expected: fmt_reg(&expected),
                    now: format!("erro ao ler: {e}"),
                    status: CheckStatus::Unknown,
                },
            }
        }
        Change::PowerPlan { previous, applied } => {
            let now = platform::power_active().ok();
            ChangeCheck {
                label: "Plano de energia ativo".into(),
                before: plan_label(previous),
                expected: plan_label(applied),
                now: now.as_deref().map(plan_label).unwrap_or_else(|| "não foi possível ler".into()),
                status: match now {
                    Some(g) => settle(g == *applied),
                    None => CheckStatus::Unknown,
                },
            }
        }
        Change::File { path, previous } => {
            let exists = std::path::Path::new(path).exists();
            ChangeCheck {
                label: path.clone(),
                before: if previous.is_some() { "arquivo existia".into() } else { "não existia".into() },
                expected: "arquivo do CSBoost".into(),
                now: if exists { "arquivo presente".into() } else { "arquivo apagado".into() },
                status: settle(exists),
            }
        }
        Change::DisplayRefresh { device, previous_hz, applied_hz } => {
            let now = platform::displays()
                .ok()
                .and_then(|ds| ds.into_iter().find(|d| d.device == *device))
                .map(|d| d.current_hz);
            ChangeCheck {
                label: format!("Taxa de atualização ({device})"),
                before: format!("{previous_hz} Hz"),
                expected: format!("{applied_hz} Hz"),
                now: now.map(|h| format!("{h} Hz")).unwrap_or_else(|| "monitor não encontrado".into()),
                status: match now {
                    Some(h) => settle(h == *applied_hz),
                    None => CheckStatus::Unknown,
                },
            }
        }
    }
}

pub fn run() -> Vec<EntryCheck> {
    let journal = Journal::load();
    let boot = platform::boot_time_ms();
    let mut out: Vec<EntryCheck> = journal
        .entries
        .iter()
        .filter(|e| e.reverted_at.is_none())
        .map(|e| {
            let tweak = catalog::find(&e.tweak_id);
            let needs_reboot = tweak.as_ref().map(|t| t.requires_reboot).unwrap_or(false);
            // aplicado depois do último boot = ainda não está valendo
            let pending = needs_reboot && boot.map(|b| e.applied_at > b).unwrap_or(false);
            let checks: Vec<ChangeCheck> = e.changes.iter().map(|c| check_change(&e.tweak_id, c, pending)).collect();
            let status = if checks.iter().any(|c| c.status == CheckStatus::Changed) {
                CheckStatus::Changed
            } else if checks.iter().any(|c| c.status == CheckStatus::Unknown) {
                CheckStatus::Unknown
            } else if pending {
                CheckStatus::PendingReboot
            } else {
                CheckStatus::Ok
            };
            EntryCheck {
                entry_id: e.id,
                tweak_id: e.tweak_id.clone(),
                title: e.title.clone(),
                applied_at: e.applied_at,
                status,
                how_to_check: tweak.and_then(|t| t.how_to_check),
                checks,
            }
        })
        .collect();
    out.reverse();
    out
}
