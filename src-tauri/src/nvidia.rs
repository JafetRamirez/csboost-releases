//! Perfil do driver NVIDIA para o CS2 (ROADMAP #10).
//!
//! Grava no perfil do cs2.exe do driver (o mesmo do Painel de Controle da
//! NVIDIA) só dois ajustes de driver, que não atuam dentro do jogo:
//! "Modo de gerenciamento de energia" e "Filtragem de textura - qualidade".
//! Low Latency / Reflex ficam de fora: o próprio CS2 já tem o Reflex.
//! O valor anterior vai para o Histórico. Ver CLAUDE.md.

use crate::journal::Change;
use crate::{engine, platform};
use anyhow::Result;
use serde::Serialize;

/// Modo de gerenciamento de energia (PREFERRED_PSTATE_ID) → Preferir desempenho máximo.
pub const POWER_MODE: u32 = 0x1057_EB71;
pub const POWER_MAX: u32 = 1;
/// Filtragem de textura - qualidade (QUALITY_ENHANCEMENTS_ID) → Alto desempenho.
pub const TEX_QUALITY: u32 = 0x00CE_2691;
pub const TEX_HIGH_PERF: u32 = 0x14;

pub fn label(id: u32) -> String {
    match id {
        POWER_MODE => tr!("Modo de gerenciamento de energia", "Modo de administración de energía", "Power management mode"),
        TEX_QUALITY => tr!("Filtragem de textura - qualidade", "Filtrado de texturas - calidad", "Texture filtering - quality"),
        _ => format!("{id:#x}"),
    }
}

pub fn value_label(id: u32, v: Option<u32>) -> String {
    match (id, v) {
        (_, None) => tr!("padrão do driver", "predeterminado del driver", "driver default"),
        (POWER_MODE, Some(POWER_MAX)) => tr!("Preferir desempenho máximo", "Preferir rendimiento máximo", "Prefer maximum performance"),
        (POWER_MODE, Some(0)) => tr!("Adaptável", "Adaptable", "Adaptive"),
        (POWER_MODE, Some(5)) => tr!("Ideal", "Óptimo", "Optimal power"),
        (TEX_QUALITY, Some(TEX_HIGH_PERF)) => tr!("Alto desempenho", "Alto rendimiento", "High performance"),
        (TEX_QUALITY, Some(0)) => tr!("Qualidade", "Calidad", "Quality"),
        (TEX_QUALITY, Some(0x0A)) => tr!("Desempenho", "Rendimiento", "Performance"),
        (TEX_QUALITY, Some(0xFFFF_FFF6)) => tr!("Alta qualidade", "Alta calidad", "High quality"),
        (_, Some(v)) => format!("{v:#x}"),
    }
}

const TARGET: [(u32, u32); 2] = [(POWER_MODE, POWER_MAX), (TEX_QUALITY, TEX_HIGH_PERF)];

#[derive(Debug, Clone, Serialize)]
pub struct NvSetting {
    pub id: u32,
    pub label: String,
    pub now: String,
    pub target: String,
    pub ok: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct NvInfo {
    pub available: bool,
    pub error: Option<String>,
    pub settings: Vec<NvSetting>,
}

pub fn info() -> NvInfo {
    let has_nvidia = platform::hardware_info()
        .map(|h| h.gpus.iter().any(|g| g.name.to_lowercase().contains("nvidia")))
        .unwrap_or(false);
    if !has_nvidia {
        return NvInfo { available: false, error: None, settings: Vec::new() };
    }
    let ids: Vec<u32> = TARGET.iter().map(|(id, _)| *id).collect();
    match platform::nv_get(&ids) {
        Ok(vals) => NvInfo {
            available: true,
            error: None,
            settings: TARGET
                .iter()
                .zip(vals)
                .map(|((id, want), now)| NvSetting {
                    id: *id,
                    label: label(*id),
                    now: value_label(*id, now),
                    target: value_label(*id, Some(*want)),
                    ok: now == Some(*want),
                })
                .collect(),
        },
        Err(e) => NvInfo { available: true, error: Some(format!("{e:#}")), settings: Vec::new() },
    }
}

pub fn apply() -> Result<usize> {
    let ids: Vec<u32> = TARGET.iter().map(|(id, _)| *id).collect();
    let before = platform::nv_get(&ids)?;
    let mut n = 0;
    for ((id, want), prev) in TARGET.iter().zip(before) {
        if prev == Some(*want) {
            continue;
        }
        platform::nv_set(*id, Some(*want))?;
        engine::record_external(
            &format!("nvidia.{id:x}"),
            &format!("NVIDIA: {}", label(*id)),
            Change::NvidiaSetting { setting_id: *id, previous: prev, applied: *want },
        )?;
        n += 1;
    }
    Ok(n)
}
