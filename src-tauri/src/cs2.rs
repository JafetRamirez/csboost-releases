//! Localiza Steam e CS2 e lê/escreve apenas arquivos de CONFIGURAÇÃO do
//! usuário. Nunca toca em binários/VPKs do jogo nem no processo cs2.exe —
//! compatível com o Trusted Mode da Valve.

use crate::catalog::{Hive, RegData};
use crate::platform;
use crate::vdf;
use serde::Serialize;
use std::path::{Path, PathBuf};

pub const CS2_APP_ID: &str = "730";
const STEAMID64_BASE: u64 = 76561197960265728;

#[derive(Debug, Clone, Serialize)]
pub struct SteamUser {
    pub id3: String,
    pub persona: Option<String>,
    pub launch_options: Option<String>,
    pub most_recent: bool,
}

#[derive(Debug, Clone, Serialize, Default)]
pub struct Cs2Info {
    pub steam_found: bool,
    pub steam_path: Option<String>,
    pub found: bool,
    pub install_dir: Option<String>,
    pub exe_path: Option<String>,
    pub cfg_dir: Option<String>,
    pub autoexec: Option<String>,
    pub users: Vec<SteamUser>,
    pub steam_running: bool,
    pub cs2_running: bool,
}

pub fn steam_path() -> Option<PathBuf> {
    let candidates = [
        (Hive::Hkcu, r"Software\Valve\Steam", "SteamPath"),
        (Hive::Hklm, r"SOFTWARE\WOW6432Node\Valve\Steam", "InstallPath"),
        (Hive::Hklm, r"SOFTWARE\Valve\Steam", "InstallPath"),
    ];
    candidates.iter().find_map(|(h, p, n)| match platform::reg_read(*h, p, n) {
        Ok(Some(RegData::Sz(s))) => {
            let pb = PathBuf::from(s.replace('/', "\\"));
            pb.exists().then_some(pb)
        }
        _ => None,
    })
}

fn library_with_cs2(steam: &Path) -> Option<PathBuf> {
    let file = steam.join("steamapps").join("libraryfolders.vdf");
    let mut libs: Vec<PathBuf> = vec![steam.to_path_buf()];
    if let Ok(src) = std::fs::read_to_string(&file) {
        let root = vdf::parse(&src);
        if let Some(lf) = root.get("libraryfolders") {
            for (_, lib) in lf.children() {
                if let Some(p) = lib.get("path").and_then(|v| v.as_str()) {
                    libs.push(PathBuf::from(p));
                }
            }
        }
    }
    libs.into_iter()
        .find(|l| l.join("steamapps").join(format!("appmanifest_{CS2_APP_ID}.acf")).exists())
}

pub fn install_dir() -> Option<PathBuf> {
    let steam = steam_path()?;
    let lib = library_with_cs2(&steam)?;
    let dir = lib
        .join("steamapps")
        .join("common")
        .join("Counter-Strike Global Offensive");
    dir.exists().then_some(dir)
}

pub fn exe_path() -> Option<PathBuf> {
    let p = install_dir()?.join("game").join("bin").join("win64").join("cs2.exe");
    p.exists().then_some(p)
}

pub fn cfg_dir() -> Option<PathBuf> {
    Some(install_dir()?.join("game").join("csgo").join("cfg"))
}

fn users(steam: &Path) -> Vec<SteamUser> {
    // nomes e "último logado" vêm do loginusers.vdf (chave = SteamID64)
    let mut personas: Vec<(String, String, bool)> = Vec::new();
    if let Ok(src) = std::fs::read_to_string(steam.join("config").join("loginusers.vdf")) {
        let root = vdf::parse(&src);
        if let Some(us) = root.get("users") {
            for (id64, u) in us.children() {
                if let Ok(n) = id64.parse::<u64>() {
                    let id3 = n.saturating_sub(STEAMID64_BASE).to_string();
                    let name = u.get("PersonaName").and_then(|v| v.as_str()).unwrap_or("").to_string();
                    let recent = u.get("MostRecent").and_then(|v| v.as_str()) == Some("1");
                    personas.push((id3, name, recent));
                }
            }
        }
    }

    let mut out = Vec::new();
    if let Ok(rd) = std::fs::read_dir(steam.join("userdata")) {
        for e in rd.flatten() {
            let id3 = e.file_name().to_string_lossy().to_string();
            if id3 == "0" || !id3.chars().all(|c| c.is_ascii_digit()) {
                continue;
            }
            let launch_options = std::fs::read_to_string(e.path().join("config").join("localconfig.vdf"))
                .ok()
                .and_then(|src| {
                    let root = vdf::parse(&src);
                    root.path(&["UserLocalConfigStore", "Software", "Valve", "Steam", "apps", CS2_APP_ID, "LaunchOptions"])
                        .and_then(|v| v.as_str())
                        .map(|s| s.to_string())
                });
            let p = personas.iter().find(|(i, _, _)| *i == id3);
            out.push(SteamUser {
                persona: p.map(|(_, n, _)| n.clone()).filter(|n| !n.is_empty()),
                most_recent: p.map(|(_, _, r)| *r).unwrap_or(false),
                id3,
                launch_options,
            });
        }
    }
    out.sort_by_key(|u| !u.most_recent);
    out
}

pub fn info() -> Cs2Info {
    let mut info = Cs2Info::default();
    let running = platform::processes_running(&["steam.exe", "cs2.exe"]);
    info.steam_running = running[0];
    info.cs2_running = running[1];

    let Some(steam) = steam_path() else { return info };
    info.steam_found = true;
    info.steam_path = Some(steam.display().to_string());
    info.users = users(&steam);

    if let Some(dir) = install_dir() {
        info.found = true;
        info.install_dir = Some(dir.display().to_string());
        info.exe_path = exe_path().map(|p| p.display().to_string());
        if let Some(cfg) = cfg_dir() {
            info.autoexec = std::fs::read_to_string(cfg.join("autoexec.cfg")).ok();
            info.cfg_dir = Some(cfg.display().to_string());
        }
    }
    info
}
