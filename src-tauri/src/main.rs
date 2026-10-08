// Esconde o console no build de release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    if std::env::args().any(|a| a == "--revert-all") {
        std::process::exit(csboost_lib::revert_all_cli());
    }
    csboost_lib::run()
}
