//! Modo Sessão v1 (ROADMAP #7): enquanto o CS2 está aberto, o Windows fica no
//! plano de energia de desempenho; quando o jogo fecha, volta o plano de antes.
//!
//! Só usa a lista de processos do Windows para saber se o cs2.exe está aberto
//! (sem abrir o processo) e a API de planos de energia. Ver CLAUDE.md.
//! Funciona com o CSBoost aberto (pode ficar minimizado).

use crate::platform::{self, PlanKind};
use crate::prefs::{Prefs, SessionState};
use serde::Serialize;
use std::sync::Mutex;

static LOCK: Mutex<()> = Mutex::new(());

/// Apps conhecidos que puxam internet ou disco em segundo plano.
const HEAVY: &[(&str, &str)] = &[
    ("OneDrive.exe", "OneDrive"),
    ("Dropbox.exe", "Dropbox"),
    ("GoogleDriveFS.exe", "Google Drive"),
    ("qbittorrent.exe", "qBittorrent"),
    ("uTorrent.exe", "uTorrent"),
    ("BitTorrent.exe", "BitTorrent"),
    ("EpicGamesLauncher.exe", "Epic Games"),
    ("EADesktop.exe", "EA app"),
    ("Battle.net.exe", "Battle.net"),
    ("upc.exe", "Ubisoft Connect"),
];

#[derive(Debug, Clone, Serialize)]
pub struct SessionStatus {
    pub enabled: bool,
    pub active: bool,
    pub started_at: Option<u64>,
    /// O plano foi trocado nesta sessão (false = já estava em desempenho).
    pub plan_changed: bool,
    pub background_apps: Vec<String>,
}

pub fn status() -> SessionStatus {
    let p = Prefs::load();
    let names: Vec<&str> = HEAVY.iter().map(|(exe, _)| *exe).collect();
    let running = platform::processes_running(&names);
    SessionStatus {
        enabled: p.session_enabled,
        active: p.session.is_some(),
        started_at: p.session.as_ref().map(|s| s.started_at),
        plan_changed: p.session.as_ref().map(|s| s.applied_plan.is_some()).unwrap_or(false),
        background_apps: HEAVY.iter().zip(running).filter(|(_, r)| *r).map(|((_, n), _)| n.to_string()).collect(),
    }
}

pub fn set_enabled(on: bool) -> anyhow::Result<SessionStatus> {
    {
        let _g = LOCK.lock().map_err(|_| anyhow::anyhow!("sessão ocupada"))?;
        let mut p = Prefs::load();
        p.session_enabled = on;
        p.save()?;
    }
    if !on {
        end();
    }
    tick();
    Ok(status())
}

fn begin(p: &mut Prefs) {
    let previous = platform::power_active().ok();
    let already = previous.as_deref().and_then(platform::plan_kind) == Some(PlanKind::Performance);
    let applied = if already { None } else { platform::power_ensure_high_performance().ok() };
    p.session = Some(SessionState {
        started_at: crate::journal::now_ms(),
        previous_plan: if applied.is_some() { previous } else { None },
        applied_plan: applied,
    });
}

/// Encerra a sessão: devolve o plano de antes, se o usuário não trocou no meio.
pub fn end() {
    let Ok(_g) = LOCK.lock() else { return };
    let mut p = Prefs::load();
    let Some(s) = p.session.take() else { return };
    if let (Some(prev), Some(applied)) = (&s.previous_plan, &s.applied_plan) {
        if platform::power_active().ok().as_deref() == Some(applied.as_str()) {
            let _ = platform::power_set(prev);
        }
    }
    let _ = p.save();
}

/// Uma rodada: começa a sessão quando o CS2 abre e termina quando fecha.
pub fn tick() {
    let running = !platform::pids_named("cs2.exe").is_empty();
    let active = {
        let Ok(_g) = LOCK.lock() else { return };
        let mut p = Prefs::load();
        if running && p.session_enabled && p.session.is_none() {
            begin(&mut p);
            let _ = p.save();
        }
        p.session.is_some()
    };
    if active && !running {
        end();
    }
}

/// Vigia em segundo plano enquanto o app está aberto (a cada 5 s). Na primeira
/// rodada também fecha uma sessão que ficou aberta se o app foi fechado no meio.
pub fn start_watcher() {
    std::thread::spawn(|| loop {
        tick();
        std::thread::sleep(std::time::Duration::from_secs(5));
    });
}
