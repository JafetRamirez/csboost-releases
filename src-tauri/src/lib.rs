#[macro_use]
mod i18n;
mod bench;
mod catalog;
mod cleanup;
mod commands;
mod cs2;
mod diagnostics;
mod engine;
mod journal;
mod platform;
mod vdf;
mod verify;

/// Usado pelo desinstalador: `csboost.exe --revert-all` desfaz todos os
/// ajustes do CSBoost sem abrir a janela.
pub fn revert_all_cli() -> i32 {
    match engine::revert_all() {
        Ok(r) if r.results.iter().all(|x| x.ok) => 0,
        _ => 1,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            commands::run_diagnostics,
            commands::list_tweaks,
            commands::apply_tweaks,
            commands::revert_tweaks,
            commands::revert_all,
            commands::history,
            commands::create_restore_point,
            commands::set_display_refresh,
            commands::cs2_info,
            commands::write_autoexec,
            commands::is_elevated,
            commands::verify_changes,
            commands::bench_run,
            commands::bench_list,
            commands::bench_delete,
            commands::cs2_running,
            commands::cleanup_scan,
            commands::cleanup_run,
            commands::set_language,
        ])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o CSBoost");
}
