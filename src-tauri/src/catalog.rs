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
    /// Textos em outros idiomas (es, en). O português fica nos campos acima.
    #[serde(default, skip_serializing)]
    pub i18n: std::collections::HashMap<String, TweakText>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TweakText {
    pub title: Option<String>,
    pub description: Option<String>,
    pub how_to_check: Option<String>,
}

impl Tweak {
    /// Troca título, descrição e "onde conferir" pelo idioma atual.
    fn localize(mut self) -> Tweak {
        let code = crate::i18n::code();
        if let Some(tx) = self.i18n.get(code).cloned() {
            if let Some(v) = tx.title {
                self.title = v;
            }
            if let Some(v) = tx.description {
                self.description = v;
            }
            if tx.how_to_check.is_some() {
                self.how_to_check = tx.how_to_check;
            }
        }
        self
    }
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
    file.tweaks.into_iter().map(Tweak::localize).collect()
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

    #[test]
    fn every_tweak_has_es_and_en() {
        for t in super::load() {
            for lang in ["es", "en"] {
                let tx = t.i18n.get(lang).unwrap_or_else(|| panic!("{} sem {lang}", t.id));
                assert!(tx.title.is_some() && tx.description.is_some(), "{} incompleto em {lang}", t.id);
            }
        }
    }
}
