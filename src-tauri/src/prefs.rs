//! Preferências do usuário guardadas em %LOCALAPPDATA%\CSBoost\prefs.json.
//! Hoje: avisos do Raio-X que o usuário marcou como "já conferi".

use crate::journal::data_dir;
use serde::{Deserialize, Serialize};

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct Prefs {
    #[serde(default)]
    pub dismissed_issues: Vec<String>,
    /// Modo Sessão ligado pelo usuário.
    #[serde(default)]
    pub session_enabled: bool,
    /// Sessão em andamento (o que trocar de volta quando o CS2 fechar).
    #[serde(default)]
    pub session: Option<SessionState>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionState {
    pub started_at: u64,
    /// Plano de energia de antes e o que o Modo Sessão ativou (None = não trocou).
    pub previous_plan: Option<String>,
    pub applied_plan: Option<String>,
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
