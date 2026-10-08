//! Comandos expostos para a interface (invoke do lado do React).
//! Tudo que é lento roda em thread separada para não travar a janela.

use crate::journal::{Change, Entry, Journal};
use crate::{cs2, diagnostics, engine, platform, verify};

type CmdResult<T> = Result<T, String>;

fn err(e: impl std::fmt::Display) -> String {
    e.to_string()
}

async fn blocking<T: Send + 'static>(f: impl FnOnce() -> anyhow::Result<T> + Send + 'static) -> CmdResult<T> {
    tauri::async_runtime::spawn_blocking(f).await.map_err(err)?.map_err(err)
}

#[tauri::command]
pub async fn run_diagnostics() -> CmdResult<diagnostics::Report> {
    blocking(|| Ok(diagnostics::run())).await
}

#[tauri::command]
pub async fn list_tweaks() -> CmdResult<Vec<engine::TweakView>> {
    blocking(|| Ok(engine::list())).await
}

#[tauri::command]
pub async fn apply_tweaks(ids: Vec<String>) -> CmdResult<engine::BatchResult> {
    blocking(move || engine::apply(&ids)).await
}

#[tauri::command]
pub async fn revert_tweaks(ids: Vec<String>) -> CmdResult<engine::BatchResult> {
    blocking(move || engine::revert(&ids)).await
}

#[tauri::command]
pub async fn revert_all() -> CmdResult<engine::BatchResult> {
    blocking(engine::revert_all).await
}

#[tauri::command]
pub fn history() -> Vec<Entry> {
    let mut e = Journal::load().entries;
    e.reverse();
    e
}

#[tauri::command]
pub async fn create_restore_point() -> CmdResult<()> {
    blocking(|| platform::create_restore_point("CSBoost - antes das otimizacoes")).await
}

#[tauri::command]
pub async fn set_display_refresh(device: String, hz: u32) -> CmdResult<()> {
    blocking(move || {
        let current = platform::displays()?
            .into_iter()
            .find(|d| d.device == device)
            .ok_or_else(|| anyhow::anyhow!("monitor não encontrado"))?;
        platform::set_display_refresh(&device, hz)?;
        engine::record_external(
            "display.refresh",
            &format!("Monitor em {hz} Hz"),
            Change::DisplayRefresh { device, previous_hz: current.current_hz, applied_hz: hz },
        )
    })
    .await
}

#[tauri::command]
pub async fn cs2_info() -> CmdResult<cs2::Cs2Info> {
    blocking(|| Ok(cs2::info())).await
}

#[tauri::command]
pub async fn write_autoexec(content: String) -> CmdResult<String> {
    blocking(move || {
        let dir = cs2::cfg_dir().ok_or_else(|| anyhow::anyhow!("CS2 não encontrado"))?;
        std::fs::create_dir_all(&dir)?;
        let path = dir.join("autoexec.cfg");
        let previous = std::fs::read_to_string(&path).ok();
        std::fs::write(&path, content)?;
        let p = path.display().to_string();
        engine::record_external("cs2.autoexec", "Autoexec do CS2", Change::File { path: p.clone(), previous })?;
        Ok(p)
    })
    .await
}

#[tauri::command]
pub fn is_elevated() -> bool {
    platform::is_elevated()
}

#[tauri::command]
pub async fn verify_changes() -> CmdResult<Vec<verify::EntryCheck>> {
    blocking(|| Ok(verify::run())).await
}

// ---------------------------------------------------------------- benchmark

fn presentmon_path(app: &tauri::AppHandle) -> anyhow::Result<std::path::PathBuf> {
    use tauri::Manager;
    Ok(app.path().resource_dir()?.join("presentmon").join("PresentMon.exe"))
}

#[tauri::command]
pub async fn bench_run(app: tauri::AppHandle, seconds: u32, label: String) -> CmdResult<crate::bench::BenchRun> {
    let pm = presentmon_path(&app).map_err(err)?;
    blocking(move || crate::bench::run(&pm, seconds, &label)).await
}

#[tauri::command]
pub fn bench_list() -> Vec<crate::bench::BenchRun> {
    crate::bench::list()
}

#[tauri::command]
pub fn bench_delete(id: u64) -> CmdResult<()> {
    crate::bench::delete(id).map_err(err)
}

#[tauri::command]
pub fn cs2_running() -> bool {
    platform::processes_running(&["cs2.exe"])[0]
}

// ---------------------------------------------------------------- limpeza

#[tauri::command]
pub async fn cleanup_scan() -> CmdResult<Vec<crate::cleanup::CleanTarget>> {
    blocking(|| Ok(crate::cleanup::scan())).await
}

#[tauri::command]
pub async fn cleanup_run(ids: Vec<String>) -> CmdResult<crate::cleanup::CleanResult> {
    blocking(move || Ok(crate::cleanup::run(&ids))).await
}
