//! Journal de alterações: antes de mudar qualquer coisa no sistema, o valor
//! anterior é gravado aqui. Reverter = desfazer as mudanças na ordem inversa.
//!
//! Arquivo: %LOCALAPPDATA%\CSBoost\journal.json (escrita atômica).

use crate::catalog::{Hive, RegData};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Change {
    Registry {
        hive: Hive,
        path: String,
        name: String,
        /// `None` = o valor não existia antes.
        previous: Option<RegData>,
        /// Valor gravado pelo CSBoost (journals antigos não têm: usa o catálogo).
        #[serde(default, skip_serializing_if = "Option::is_none")]
        applied: Option<RegData>,
    },
    PowerPlan {
        previous: String,
        applied: String,
    },
    File {
        path: String,
        /// `None` = o arquivo não existia antes.
        previous: Option<String>,
    },
    DisplayRefresh {
        device: String,
        previous_hz: u32,
        applied_hz: u32,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Entry {
    pub id: u64,
    pub tweak_id: String,
    pub title: String,
    pub applied_at: u64,
    pub reverted_at: Option<u64>,
    pub changes: Vec<Change>,
}

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct Journal {
    pub entries: Vec<Entry>,
}

pub fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

pub fn data_dir() -> PathBuf {
    let base = std::env::var_os("LOCALAPPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(std::env::temp_dir);
    base.join("CSBoost")
}

fn journal_path() -> PathBuf {
    data_dir().join("journal.json")
}

impl Journal {
    pub fn load() -> Journal {
        std::fs::read_to_string(journal_path())
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default()
    }

    pub fn save(&self) -> anyhow::Result<()> {
        let dir = data_dir();
        std::fs::create_dir_all(&dir)?;
        let tmp = dir.join("journal.json.tmp");
        std::fs::write(&tmp, serde_json::to_vec_pretty(self)?)?;
        std::fs::rename(&tmp, journal_path())?;
        Ok(())
    }

    /// Última entrada ainda ativa (não revertida) para um tweak.
    pub fn active(&self, tweak_id: &str) -> Option<&Entry> {
        self.entries
            .iter()
            .rev()
            .find(|e| e.tweak_id == tweak_id && e.reverted_at.is_none())
    }

    pub fn active_mut(&mut self, tweak_id: &str) -> Option<&mut Entry> {
        self.entries
            .iter_mut()
            .rev()
            .find(|e| e.tweak_id == tweak_id && e.reverted_at.is_none())
    }

    pub fn active_ids(&self) -> Vec<String> {
        let mut ids: Vec<String> = self
            .entries
            .iter()
            .filter(|e| e.reverted_at.is_none())
            .map(|e| e.tweak_id.clone())
            .collect();
        ids.dedup();
        ids
    }

    pub fn push(&mut self, tweak_id: &str, title: &str, changes: Vec<Change>) {
        let ts = now_ms();
        let id = self.entries.last().map(|e| e.id.max(ts) + 1).unwrap_or(ts);
        self.entries.push(Entry {
            id,
            tweak_id: tweak_id.to_string(),
            title: title.to_string(),
            applied_at: ts,
            reverted_at: None,
            changes,
        });
    }
}
