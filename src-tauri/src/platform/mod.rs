//! Camada que fala com o Windows. Todo acesso a registro, energia, monitor,
//! WMI etc. passa por aqui. Fora do Windows (para compilar/testar a lógica),
//! um stub devolve "não suportado".

use serde::Serialize;

#[cfg(windows)]
mod win;
#[cfg(windows)]
pub use win::*;

#[cfg(not(windows))]
mod stub;
#[cfg(not(windows))]
pub use stub::*;

pub const PLAN_POWER_SAVER: &str = "a1841308-3541-4fab-bc81-f71556f20b4a";
pub const PLAN_BALANCED: &str = "381b4222-f694-41f0-9685-ff5bb260df2e";
pub const PLAN_HIGH: &str = "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c";
pub const PLAN_ULTIMATE: &str = "e9a42b02-d5df-448d-aa00-03f14749eb61";

pub fn plan_name(guid: &str) -> &'static str {
    match guid.to_ascii_lowercase().as_str() {
        PLAN_POWER_SAVER => "Economia de energia",
        PLAN_BALANCED => "Equilibrado",
        PLAN_HIGH => "Alto desempenho",
        PLAN_ULTIMATE => "Desempenho máximo",
        _ => "Personalizado",
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct DisplayInfo {
    pub device: String,
    pub name: String,
    pub primary: bool,
    pub width: u32,
    pub height: u32,
    pub current_hz: u32,
    pub max_hz: u32,
}

#[derive(Debug, Clone, Copy, Serialize)]
pub struct PowerStatus {
    pub has_battery: bool,
    pub on_ac: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct GpuInfo {
    pub name: String,
    pub driver_version: Option<String>,
    /// AAAA-MM-DD
    pub driver_date: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct RamModule {
    pub capacity_gb: f64,
    pub rated_mts: Option<u32>,
    pub configured_mts: Option<u32>,
    /// SMBIOSMemoryType: 26 = DDR4, 34 = DDR5
    pub smbios_type: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Default)]
pub struct HardwareInfo {
    pub os_name: String,
    pub os_build: u32,
    pub cpu: String,
    pub cpu_cores: u32,
    pub cpu_threads: u32,
    pub gpus: Vec<GpuInfo>,
    pub ram_modules: Vec<RamModule>,
    pub disk_free_gb: Option<f64>,
    pub disk_total_gb: Option<f64>,
}

pub(crate) fn guid_to_string(d1: u32, d2: u16, d3: u16, d4: [u8; 8]) -> String {
    format!(
        "{:08x}-{:04x}-{:04x}-{:02x}{:02x}-{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}",
        d1, d2, d3, d4[0], d4[1], d4[2], d4[3], d4[4], d4[5], d4[6], d4[7]
    )
}

#[allow(dead_code)]
pub(crate) fn parse_guid(s: &str) -> Option<u128> {
    let hex: String = s.chars().filter(|c| *c != '-' && *c != '{' && *c != '}').collect();
    if hex.len() != 32 {
        return None;
    }
    u128::from_str_radix(&hex, 16).ok()
}

/// "20240315000000.000000-000" (WMI CIM_DATETIME) -> "2024-03-15"
#[allow(dead_code)]
pub(crate) fn cim_date(s: &str) -> Option<String> {
    if s.len() < 8 || !s[..8].chars().all(|c| c.is_ascii_digit()) {
        return None;
    }
    Some(format!("{}-{}-{}", &s[0..4], &s[4..6], &s[6..8]))
}
