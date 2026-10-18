#[macro_use]
mod i18n;
mod bench;
mod catalog;
mod cleanup;
mod commands;
mod cs2;
mod diagnostics;
mod engine;
mod gpu;
mod prefs;
mod session;
mod video;
mod net;
mod nvidia;
mod journal;
mod platform;
mod vdf;
mod verify;

/// Usado pelo desinstalador: `csboost.exe --revert-all` desfaz todos os
/// ajustes do CSBoost sem abrir a janela.
pub fn revert_all_cli() -> i32 {
    session::end();
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
        .setup(|_| {
            session::start_watcher();
            Ok(())
        })
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
            commands::reapply_tweaks,
            commands::bench_run,
            commands::bench_list,
            commands::bench_delete,
            commands::cs2_running,
            commands::cleanup_scan,
            commands::cleanup_run,
            commands::set_language,
            commands::gpu_in_use,
            commands::set_issue_dismissed,
            commands::video_info,
            commands::nvidia_info,
            commands::nvidia_apply,
            commands::session_status,
            commands::session_set,
            commands::video_apply,
            commands::net_test,
        ])
        .build(tauri::generate_context!())
        .expect("erro ao iniciar o CSBoost")
        .run(|_, e| {
            // ao fechar o app no meio da partida, devolve o plano de energia
            if let tauri::RunEvent::Exit = e {
                session::end();
            }
        });
}
