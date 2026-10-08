//! Catálogo de otimizações (tweaks).
//!
//! Os tweaks vivem em `catalog/tweaks.json` e são embutidos no executável.
//! Mais tarde o catálogo poderá ser atualizado remotamente (JSON assinado)
//! sem precisar lançar uma nova versão do app.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Risk {
    Safe,
    Moderate,
    Advanced,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Evidence {
    Proven,
    Situational,
    Weak,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum Hive {
    Hkcu,
    Hklm,
}

/// Valor de registro. No JSON: número = REG_DWORD, texto = REG_SZ.
/// `Raw` existe para guardar valores antigos de outros tipos no journal.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum RegData {
    Dword(u32),
    Sz(String),
    Raw { vtype: u32, bytes: Vec<u8> },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PowerPlanTarget {
    HighPerformance,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Action {
    Registry {
        hive: Hive,
        path: String,
        name: String,
        value: RegData,
    },
    PowerPlan {
        plan: PowerPlanTarget,
    },
    /// Preferência de GPU de alto desempenho para o cs2.exe (caminho detectado em tempo de execução).
    Cs2GpuPreference,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tweak {
    pub id: String,
    pub category: String,
    pub title: String,
    pub description: String,
    pub risk: Risk,
    pub evidence: Evidence,
    pub requires_reboot: bool,
    #[serde(default)]
    pub laptop_warning: bool,
    #[serde(default)]
    pub min_build: Option<u32>,
    /// Onde o usuário confere o ajuste no próprio Windows.
    #[serde(default)]
    pub how_to_check: Option<String>,
    pub presets: Vec<String>,
    pub actions: Vec<Action>,
}

#[derive(Debug, Deserialize)]
struct CatalogFile {
    #[allow(dead_code)]
    version: u32,
    tweaks: Vec<Tweak>,
}

pub fn load() -> Vec<Tweak> {
    let file: CatalogFile = serde_json::from_str(include_str!("../../catalog/tweaks.json"))
        .expect("catalog/tweaks.json inválido");
    file.tweaks
}

pub fn find(id: &str) -> Option<Tweak> {
    load().into_iter().find(|t| t.id == id)
}

#[cfg(test)]
mod tests {
    #[test]
    fn catalog_parses_and_ids_are_unique() {
        let tweaks = super::load();
        assert!(!tweaks.is_empty());
        let mut ids: Vec<_> = tweaks.iter().map(|t| t.id.clone()).collect();
        ids.sort();
        ids.dedup();
        assert_eq!(ids.len(), tweaks.len());
    }
}
