//! Implementação vazia para compilar fora do Windows.
#![allow(dead_code)]

use super::*;
use crate::catalog::{Hive, RegData};
use anyhow::{bail, Result};

const MSG: &str = "Disponível apenas no Windows";

pub fn reg_read(_: Hive, _: &str, _: &str) -> Result<Option<RegData>> { bail!(MSG) }
pub fn reg_write(_: Hive, _: &str, _: &str, _: &RegData) -> Result<()> { bail!(MSG) }
pub fn reg_delete(_: Hive, _: &str, _: &str) -> Result<()> { bail!(MSG) }
pub fn power_active() -> Result<String> { bail!(MSG) }
pub fn power_set(_: &str) -> Result<()> { bail!(MSG) }
pub fn power_ensure_high_performance() -> Result<String> { bail!(MSG) }
pub fn power_status() -> PowerStatus { PowerStatus { has_battery: false, on_ac: true } }
pub fn displays() -> Result<Vec<DisplayInfo>> { bail!(MSG) }
pub fn set_display_refresh(_: &str, _: u32) -> Result<()> { bail!(MSG) }
pub fn hardware_info() -> Result<HardwareInfo> { bail!(MSG) }
pub fn processes_running(names: &[&str]) -> Vec<bool> { vec![false; names.len()] }
pub fn is_elevated() -> bool { false }
pub fn create_restore_point(_: &str) -> Result<()> { bail!(MSG) }
pub fn boot_time_ms() -> Option<u64> { None }
