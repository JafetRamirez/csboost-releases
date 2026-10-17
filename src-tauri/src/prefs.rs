//! Preferências do usuário guardadas em %LOCALAPPDATA%\CSBoost\prefs.json.
//! Hoje: avisos do Raio-X que o usuário marcou como "já conferi".

use crate::journal::data_dir;
use serde::{Deserialize, Serialize};

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct Prefs {
    #[serde(default)]
    pub dismissed_issues: Vec<String>,
}

fn path() -> std::path::PathBuf {
    data_dir().join("prefs.json")
}

impl Prefs {
    pub fn load() -> Prefs {
        std::fs::read_to_string(path()).ok().and_then(|s| serde_json::from_str(&s).ok()).unwrap_or_default()
    }

    pub fn save(&self) -> anyhow::Result<()> {
        let dir = data_dir();
        std::fs::create_dir_all(&dir)?;
        let tmp = dir.join("prefs.json.tmp");
        std::fs::write(&tmp, serde_json::to_vec_pretty(self)?)?;
        std::fs::rename(&tmp, path())?;
        Ok(())
    }
}

/// Marca (ou desmarca) um aviso do Raio-X como conferido pelo usuário.
pub fn set_dismissed(id: &str, dismissed: bool) -> anyhow::Result<()> {
    let mut p = Prefs::load();
    p.dismissed_issues.retain(|x| x != id);
    if dismissed {
        p.dismissed_issues.push(id.to_string());
    }
    p.save()
}
