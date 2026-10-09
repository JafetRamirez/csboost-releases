//! Implementação Windows. Usa só APIs oficiais (registro, powrprof, GDI,
//! WMI, System Restore). Nada de PowerShell/CMD e nada que toque no cs2.exe.

use super::*;
use crate::catalog::{Hive, RegData};
use anyhow::{anyhow, bail, Context, Result};
use serde::Deserialize;
use std::borrow::Cow;
use std::io::ErrorKind;
use winreg::enums::*;
use winreg::{RegKey, RegValue};

use windows::core::{GUID, PCWSTR};
use windows::Win32::Foundation::{CloseHandle, LocalFree, HLOCAL, WIN32_ERROR};

// ---------------------------------------------------------------- registro

fn root(h: Hive) -> RegKey {
    match h {
        Hive::Hkcu => RegKey::predef(HKEY_CURRENT_USER),
        Hive::Hklm => RegKey::predef(HKEY_LOCAL_MACHINE),
    }
}

fn regtype_from_u32(v: u32) -> RegType {
    match v {
        1 => REG_SZ,
        2 => REG_EXPAND_SZ,
        3 => REG_BINARY,
        4 => REG_DWORD,
        5 => REG_DWORD_BIG_ENDIAN,
        6 => REG_LINK,
        7 => REG_MULTI_SZ,
        8 => REG_RESOURCE_LIST,
        9 => REG_FULL_RESOURCE_DESCRIPTOR,
        10 => REG_RESOURCE_REQUIREMENTS_LIST,
        11 => REG_QWORD,
        _ => REG_NONE,
    }
}

pub fn reg_read(hive: Hive, path: &str, name: &str) -> Result<Option<RegData>> {
    let key = match root(hive).open_subkey_with_flags(path, KEY_READ) {
        Ok(k) => k,
        Err(e) if e.kind() == ErrorKind::NotFound => return Ok(None),
        Err(e) => return Err(e).with_context(|| format!("abrir {path}")),
    };
    let raw = match key.get_raw_value(name) {
        Ok(v) => v,
        Err(e) if e.kind() == ErrorKind::NotFound => return Ok(None),
        Err(e) => return Err(e).with_context(|| format!("ler {path}\\{name}")),
    };
    Ok(Some(match raw.vtype {
        REG_DWORD if raw.bytes.len() >= 4 => {
            RegData::Dword(u32::from_le_bytes([raw.bytes[0], raw.bytes[1], raw.bytes[2], raw.bytes[3]]))
        }
        REG_SZ => {
            let s: String = key.get_value(name)?;
            RegData::Sz(s)
        }
        ref t => RegData::Raw {
            vtype: t.clone() as u32,
            bytes: raw.bytes.to_vec(),
        },
    }))
}

pub fn reg_write(hive: Hive, path: &str, name: &str, value: &RegData) -> Result<()> {
    let hive_name = match hive {
        Hive::Hkcu => "HKCU",
        Hive::Hklm => "HKLM",
    };
    let blocked = || {
        tr!(
            "o Windows bloqueou a gravação em {hive_name}\\{path}\\{name}",
            "Windows bloqueó la escritura en {hive_name}\\{path}\\{name}",
            "Windows blocked writing to {hive_name}\\{path}\\{name}"
        )
    };
    let (key, _) = root(hive).create_subkey(path).with_context(blocked)?;
    let r = match value {
        RegData::Dword(v) => key.set_value(name, v),
        RegData::Sz(s) => key.set_value(name, s),
        RegData::Raw { vtype, bytes } => key.set_raw_value(
            name,
            &RegValue {
                vtype: regtype_from_u32(*vtype),
                bytes: Cow::Borrowed(bytes),
            },
        ),
    };
    r.with_context(blocked)?;
    Ok(())
}

pub fn reg_delete(hive: Hive, path: &str, name: &str) -> Result<()> {
    let key = match root(hive).open_subkey_with_flags(path, KEY_SET_VALUE) {
        Ok(k) => k,
        Err(e) if e.kind() == ErrorKind::NotFound => return Ok(()),
        Err(e) => return Err(e.into()),
    };
    match key.delete_value(name) {
        Err(e) if e.kind() != ErrorKind::NotFound => Err(e.into()),
        _ => Ok(()),
    }
}

// ---------------------------------------------------------------- energia

use windows::Win32::System::Power::{
    GetSystemPowerStatus, PowerDuplicateScheme, PowerGetActiveScheme, PowerSetActiveScheme,
    SYSTEM_POWER_STATUS,
};

fn guid_str(g: &GUID) -> String {
    guid_to_string(g.data1, g.data2, g.data3, g.data4)
}

fn guid_from(s: &str) -> Result<GUID> {
    parse_guid(s)
        .map(GUID::from_u128)
        .ok_or_else(|| anyhow!("GUID inválido: {s}"))
}

pub fn power_active() -> Result<String> {
    unsafe {
        let mut p: *mut GUID = std::ptr::null_mut();
        let r = PowerGetActiveScheme(None, &mut p);
        if r != WIN32_ERROR(0) || p.is_null() {
            bail!(tr!("não foi possível ler o plano de energia ({})", "no se pudo leer el plan de energía ({})", "could not read the power plan ({})", r.0));
        }
        let s = guid_str(&*p);
        let _ = LocalFree(Some(HLOCAL(p as _)));
        Ok(s)
    }
}

pub fn power_set(guid: &str) -> Result<()> {
    let g = guid_from(guid)?;
    let r = unsafe { PowerSetActiveScheme(None, Some(&g)) };
    if r != WIN32_ERROR(0) {
        bail!(tr!("não foi possível ativar o plano {guid} ({})", "no se pudo activar el plan {guid} ({})", "could not activate power plan {guid} ({})", r.0));
    }
    Ok(())
}

fn power_duplicate(source: &str) -> Result<String> {
    let src = guid_from(source)?;
    unsafe {
        let mut p: *mut GUID = std::ptr::null_mut();
        let r = PowerDuplicateScheme(None, &src, &mut p);
        if r != WIN32_ERROR(0) || p.is_null() {
            bail!(tr!("não foi possível criar o plano ({})", "no se pudo crear el plan ({})", "could not create the power plan ({})", r.0));
        }
        let s = guid_str(&*p);
        let _ = LocalFree(Some(HLOCAL(p as _)));
        Ok(s)
    }
}

/// Ativa o "Alto desempenho". Em PCs com Modern Standby esse plano vem
/// escondido; nesse caso cria uma cópia do "Desempenho máximo".
pub fn power_ensure_high_performance() -> Result<String> {
    if power_set(PLAN_HIGH).is_ok() {
        return Ok(PLAN_HIGH.to_string());
    }
    let created = power_duplicate(PLAN_HIGH).or_else(|_| power_duplicate(PLAN_ULTIMATE))?;
    power_set(&created)?;
    Ok(created)
}

pub fn power_status() -> PowerStatus {
    let mut s = SYSTEM_POWER_STATUS::default();
    if unsafe { GetSystemPowerStatus(&mut s) }.is_err() {
        return PowerStatus { has_battery: false, on_ac: true };
    }
    PowerStatus {
        // 128 = sem bateria; 255 = desconhecido
        has_battery: s.BatteryFlag != 128 && s.BatteryFlag != 255,
        on_ac: s.ACLineStatus != 0,
    }
}

// ---------------------------------------------------------------- monitores

use windows::Win32::Graphics::Gdi::{
    ChangeDisplaySettingsExW, EnumDisplayDevicesW, EnumDisplaySettingsW, CDS_TEST,
    CDS_UPDATEREGISTRY, DEVMODEW, DISPLAY_DEVICEW, DISPLAY_DEVICE_ATTACHED_TO_DESKTOP,
    DISPLAY_DEVICE_PRIMARY_DEVICE, DISP_CHANGE_SUCCESSFUL, DM_DISPLAYFREQUENCY,
    ENUM_CURRENT_SETTINGS, ENUM_DISPLAY_SETTINGS_MODE,
};

fn wide_to_string(w: &[u16]) -> String {
    let end = w.iter().position(|&c| c == 0).unwrap_or(w.len());
    String::from_utf16_lossy(&w[..end])
}

fn to_wide(s: &str) -> Vec<u16> {
    s.encode_utf16().chain(std::iter::once(0)).collect()
}

fn new_devmode() -> DEVMODEW {
    DEVMODEW {
        dmSize: std::mem::size_of::<DEVMODEW>() as u16,
        ..Default::default()
    }
}

pub fn displays() -> Result<Vec<DisplayInfo>> {
    let mut out = Vec::new();
    let mut i = 0u32;
    loop {
        let mut dd = DISPLAY_DEVICEW {
            cb: std::mem::size_of::<DISPLAY_DEVICEW>() as u32,
            ..Default::default()
        };
        if !unsafe { EnumDisplayDevicesW(PCWSTR::null(), i, &mut dd, 0) }.as_bool() {
            break;
        }
        i += 1;
        if dd.StateFlags.0 & DISPLAY_DEVICE_ATTACHED_TO_DESKTOP.0 == 0 {
            continue;
        }
        let device = wide_to_string(&dd.DeviceName);
        let dev_w = to_wide(&device);

        // nome amigável do monitor (2ª chamada com o nome do adaptador)
        let mut mon = DISPLAY_DEVICEW {
            cb: std::mem::size_of::<DISPLAY_DEVICEW>() as u32,
            ..Default::default()
        };
        let name = if unsafe { EnumDisplayDevicesW(PCWSTR(dev_w.as_ptr()), 0, &mut mon, 0) }.as_bool() {
            wide_to_string(&mon.DeviceString)
        } else {
            wide_to_string(&dd.DeviceString)
        };

        let mut cur = new_devmode();
        if !unsafe { EnumDisplaySettingsW(PCWSTR(dev_w.as_ptr()), ENUM_CURRENT_SETTINGS, &mut cur) }.as_bool() {
            continue;
        }
        let mut max_hz = cur.dmDisplayFrequency;
        let mut m = 0u32;
        loop {
            let mut dm = new_devmode();
            if !unsafe { EnumDisplaySettingsW(PCWSTR(dev_w.as_ptr()), ENUM_DISPLAY_SETTINGS_MODE(m), &mut dm) }.as_bool() {
                break;
            }
            m += 1;
            if dm.dmPelsWidth == cur.dmPelsWidth
                && dm.dmPelsHeight == cur.dmPelsHeight
                && dm.dmBitsPerPel == cur.dmBitsPerPel
            {
                max_hz = max_hz.max(dm.dmDisplayFrequency);
            }
        }
        out.push(DisplayInfo {
            device,
            name: name.trim().to_string(),
            primary: dd.StateFlags.0 & DISPLAY_DEVICE_PRIMARY_DEVICE.0 != 0,
            width: cur.dmPelsWidth,
            height: cur.dmPelsHeight,
            current_hz: cur.dmDisplayFrequency,
            max_hz,
        });
    }
    Ok(out)
}

/// Muda só a taxa de atualização (mantém resolução). Testa antes de aplicar.
pub fn set_display_refresh(device: &str, hz: u32) -> Result<()> {
    let dev_w = to_wide(device);
    let mut dm = new_devmode();
    if !unsafe { EnumDisplaySettingsW(PCWSTR(dev_w.as_ptr()), ENUM_CURRENT_SETTINGS, &mut dm) }.as_bool() {
        bail!(tr!("monitor {device} não encontrado", "monitor {device} no encontrado", "monitor {device} not found"));
    }
    dm.dmDisplayFrequency = hz;
    dm.dmFields = DM_DISPLAYFREQUENCY;
    let test = unsafe { ChangeDisplaySettingsExW(PCWSTR(dev_w.as_ptr()), Some(&dm), None, CDS_TEST, None) };
    if test != DISP_CHANGE_SUCCESSFUL {
        bail!(tr!("o monitor recusou {hz} Hz (código {})", "el monitor rechazó {hz} Hz (código {})", "the monitor rejected {hz} Hz (code {})", test.0));
    }
    let r = unsafe { ChangeDisplaySettingsExW(PCWSTR(dev_w.as_ptr()), Some(&dm), None, CDS_UPDATEREGISTRY, None) };
    if r != DISP_CHANGE_SUCCESSFUL {
        bail!(tr!("falha ao aplicar {hz} Hz (código {})", "error al aplicar {hz} Hz (código {})", "failed to apply {hz} Hz (code {})", r.0));
    }
    Ok(())
}

// ---------------------------------------------------------------- WMI

#[derive(Deserialize)]
#[serde(rename = "Win32_OperatingSystem", rename_all = "PascalCase")]
struct WmiOs {
    caption: Option<String>,
    build_number: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename = "Win32_ComputerSystem", rename_all = "PascalCase")]
struct WmiCs {
    manufacturer: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename = "Win32_Processor", rename_all = "PascalCase")]
struct WmiCpu {
    name: Option<String>,
    number_of_cores: Option<u32>,
    number_of_logical_processors: Option<u32>,
}

#[derive(Deserialize)]
#[serde(rename = "Win32_VideoController", rename_all = "PascalCase")]
struct WmiGpu {
    name: Option<String>,
    driver_version: Option<String>,
    driver_date: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename = "Win32_PhysicalMemory", rename_all = "PascalCase")]
struct WmiMem {
    capacity: Option<u64>,
    speed: Option<u32>,
    configured_clock_speed: Option<u32>,
    #[serde(rename = "SMBIOSMemoryType")]
    smbios_memory_type: Option<u32>,
}

#[derive(Deserialize)]
#[serde(rename = "Win32_LogicalDisk", rename_all = "PascalCase")]
struct WmiDisk {
    free_space: Option<u64>,
    size: Option<u64>,
}

/// Coleta de hardware via WMI. Roda numa thread própria porque o COM
/// precisa ser inicializado por thread.
pub fn hardware_info() -> Result<HardwareInfo> {
    std::thread::spawn(|| -> Result<HardwareInfo> {
        let wmi = wmi::WMIConnection::new().map_err(|e| anyhow!("WMI: {e}"))?;
        let mut info = HardwareInfo::default();

        if let Ok(v) = wmi.query::<WmiOs>() {
            if let Some(os) = v.into_iter().next() {
                info.os_name = os.caption.unwrap_or_default().trim().to_string();
                info.os_build = os.build_number.and_then(|b| b.parse().ok()).unwrap_or(0);
            }
        }
        if let Ok(v) = wmi.query::<WmiCs>() {
            if let Some(c) = v.into_iter().next() {
                info.manufacturer = c.manufacturer.unwrap_or_default().trim().to_string();
            }
        }
        if let Ok(v) = wmi.query::<WmiCpu>() {
            if let Some(c) = v.into_iter().next() {
                info.cpu = c.name.unwrap_or_default().trim().to_string();
                info.cpu_cores = c.number_of_cores.unwrap_or(0);
                info.cpu_threads = c.number_of_logical_processors.unwrap_or(0);
            }
        }
        if let Ok(v) = wmi.query::<WmiGpu>() {
            info.gpus = v
                .into_iter()
                .filter_map(|g| {
                    let name = g.name?.trim().to_string();
                    // ignora adaptadores virtuais/remotos
                    let lower = name.to_lowercase();
                    if lower.contains("basic display") || lower.contains("remote") || lower.contains("virtual") {
                        return None;
                    }
                    Some(GpuInfo {
                        name,
                        driver_version: g.driver_version,
                        driver_date: g.driver_date.as_deref().and_then(cim_date),
                    })
                })
                .collect();
        }
        if let Ok(v) = wmi.query::<WmiMem>() {
            info.ram_modules = v
                .into_iter()
                .map(|m| RamModule {
                    capacity_gb: m.capacity.unwrap_or(0) as f64 / 1024f64.powi(3),
                    rated_mts: m.speed,
                    configured_mts: m.configured_clock_speed,
                    smbios_type: m.smbios_memory_type,
                })
                .collect();
        }
        if let Ok(v) = wmi.raw_query::<WmiDisk>("SELECT FreeSpace, Size FROM Win32_LogicalDisk WHERE DeviceID = 'C:'") {
            if let Some(d) = v.into_iter().next() {
                info.disk_free_gb = d.free_space.map(|b| b as f64 / 1024f64.powi(3));
                info.disk_total_gb = d.size.map(|b| b as f64 / 1024f64.powi(3));
            }
        }
        Ok(info)
    })
    .join()
    .map_err(|_| anyhow!("falha na coleta de hardware"))?
}

// ---------------------------------------------------------------- processos

use windows::Win32::System::Diagnostics::ToolHelp::{
    CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W, TH32CS_SNAPPROCESS,
};

pub fn processes_running(names: &[&str]) -> Vec<bool> {
    let mut found = vec![false; names.len()];
    unsafe {
        let Ok(snap) = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0) else {
            return found;
        };
        let mut e = PROCESSENTRY32W {
            dwSize: std::mem::size_of::<PROCESSENTRY32W>() as u32,
            ..Default::default()
        };
        if Process32FirstW(snap, &mut e).is_ok() {
            loop {
                let exe = wide_to_string(&e.szExeFile);
                for (i, n) in names.iter().enumerate() {
                    if exe.eq_ignore_ascii_case(n) {
                        found[i] = true;
                    }
                }
                if Process32NextW(snap, &mut e).is_err() {
                    break;
                }
            }
        }
        let _ = CloseHandle(snap);
    }
    found
}

// ---------------------------------------------------------------- elevação

use windows::Win32::Security::{GetTokenInformation, TokenElevation, TOKEN_ELEVATION, TOKEN_QUERY};
use windows::Win32::System::Threading::{GetCurrentProcess, OpenProcessToken};

pub fn is_elevated() -> bool {
    unsafe {
        let mut token = windows::Win32::Foundation::HANDLE::default();
        if OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut token).is_err() {
            return false;
        }
        let mut elev = TOKEN_ELEVATION::default();
        let mut len = 0u32;
        let ok = GetTokenInformation(
            token,
            TokenElevation,
            Some(&mut elev as *mut _ as *mut core::ffi::c_void),
            std::mem::size_of::<TOKEN_ELEVATION>() as u32,
            &mut len,
        )
        .is_ok();
        let _ = CloseHandle(token);
        ok && elev.TokenIsElevated != 0
    }
}

// ---------------------------------------------------------------- restauração

use windows::Win32::System::Restore::{
    SRSetRestorePointW, BEGIN_SYSTEM_CHANGE, END_SYSTEM_CHANGE, MODIFY_SETTINGS, RESTOREPOINTINFOW,
    STATEMGRSTATUS,
};

/// Cria um ponto de restauração do sistema. O Windows limita a 1 por 24h
/// por padrão: nesse caso a chamada "funciona" mas reaproveita o último.
pub fn create_restore_point(description: &str) -> Result<()> {
    let mut info = RESTOREPOINTINFOW {
        dwEventType: BEGIN_SYSTEM_CHANGE,
        dwRestorePtType: MODIFY_SETTINGS,
        llSequenceNumber: 0,
        szDescription: [0; 256],
    };
    let mut desc = [0u16; 256];
    for (i, c) in description.encode_utf16().take(255).enumerate() {
        desc[i] = c;
    }
    info.szDescription = desc;
    let mut status = STATEMGRSTATUS::default();
    let ok = unsafe { SRSetRestorePointW(&info, &mut status) }.as_bool();
    let code = status.nStatus;
    if !ok {
        if code.0 == 1058 {
            bail!(tr!("a Proteção do Sistema está desligada neste PC", "la Protección del sistema está desactivada en esta PC", "System Protection is turned off on this PC"));
        }
        bail!(tr!("o Windows não criou o ponto de restauração (código {})", "Windows no creó el punto de restauración (código {})", "Windows did not create the restore point (code {})", code.0));
    }
    let seq = status.llSequenceNumber;
    let end = RESTOREPOINTINFOW {
        dwEventType: END_SYSTEM_CHANGE,
        dwRestorePtType: MODIFY_SETTINGS,
        llSequenceNumber: seq,
        szDescription: [0; 256],
    };
    let mut status2 = STATEMGRSTATUS::default();
    unsafe {
        let _ = SRSetRestorePointW(&end, &mut status2);
    }
    Ok(())
}

// ---------------------------------------------------------------- boot

/// Momento (ms desde 1970) em que o Windows ligou — para saber se um ajuste
/// que pede reinício já está valendo.
pub fn boot_time_ms() -> Option<u64> {
    let uptime = unsafe { windows::Win32::System::SystemInformation::GetTickCount64() };
    crate::journal::now_ms().checked_sub(uptime)
}

// ---------------------------------------------------------------- GPU em uso
//
// Só leitura: lista de placas pelo DXGI e contadores de desempenho do Windows
// (os mesmos do Gerenciador de Tarefas). Nada abre o processo do jogo.

use windows::Win32::Graphics::Dxgi::{CreateDXGIFactory1, IDXGIFactory1, DXGI_ADAPTER_FLAG_SOFTWARE};
use windows::Win32::System::Performance::{
    PdhAddEnglishCounterW, PdhCloseQuery, PdhCollectQueryData, PdhGetFormattedCounterArrayW, PdhOpenQueryW,
    PDH_FMT_COUNTERVALUE_ITEM_W, PDH_FMT_DOUBLE, PDH_HCOUNTER, PDH_HQUERY, PDH_MORE_DATA,
};

pub fn gpu_adapters() -> Result<Vec<GpuAdapter>> {
    let mut out = Vec::new();
    unsafe {
        let factory: IDXGIFactory1 = CreateDXGIFactory1().map_err(|e| anyhow!("DXGI: {e}"))?;
        let mut i = 0u32;
        while let Ok(a) = factory.EnumAdapters1(i) {
            i += 1;
            let Ok(d) = a.GetDesc1() else { continue };
            // ignora o "Microsoft Basic Render Driver" e outros adaptadores de software
            if d.Flags & (DXGI_ADAPTER_FLAG_SOFTWARE.0 as u32) != 0 || d.VendorId == 0x1414 {
                continue;
            }
            out.push(GpuAdapter {
                name: wide_to_string(&d.Description).trim().to_string(),
                vendor_id: d.VendorId,
                dedicated_mb: (d.DedicatedVideoMemory / (1024 * 1024)) as u64,
                luid_low: d.AdapterLuid.LowPart,
                luid_high: d.AdapterLuid.HighPart,
            });
        }
    }
    Ok(out)
}

/// PIDs dos processos com esse nome, pela lista de processos do Windows.
pub fn pids_named(exe: &str) -> Vec<u32> {
    let mut v = Vec::new();
    unsafe {
        let Ok(snap) = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0) else {
            return v;
        };
        let mut e = PROCESSENTRY32W {
            dwSize: std::mem::size_of::<PROCESSENTRY32W>() as u32,
            ..Default::default()
        };
        if Process32FirstW(snap, &mut e).is_ok() {
            loop {
                if wide_to_string(&e.szExeFile).eq_ignore_ascii_case(exe) {
                    v.push(e.th32ProcessID);
                }
                if Process32NextW(snap, &mut e).is_err() {
                    break;
                }
            }
        }
        let _ = CloseHandle(snap);
    }
    v
}

/// Uso de GPU por processo e placa, lido de `\GPU Engine(*)\Utilization Percentage`
/// em duas amostras com `sample_ms` de intervalo.
pub fn gpu_engine_usage(sample_ms: u64) -> Result<Vec<GpuEngineSample>> {
    unsafe {
        let mut q = PDH_HQUERY::default();
        let r = PdhOpenQueryW(PCWSTR::null(), 0, &mut q);
        if r != 0 {
            bail!("PDH {r:#x}");
        }
        let path = to_wide(r"\GPU Engine(*)\Utilization Percentage");
        let mut c = PDH_HCOUNTER::default();
        let r = PdhAddEnglishCounterW(q, PCWSTR(path.as_ptr()), 0, &mut c);
        if r != 0 {
            let _ = PdhCloseQuery(q);
            bail!("PDH {r:#x}");
        }
        let _ = PdhCollectQueryData(q);
        std::thread::sleep(std::time::Duration::from_millis(sample_ms));
        let _ = PdhCollectQueryData(q);

        let mut size = 0u32;
        let mut count = 0u32;
        let r = PdhGetFormattedCounterArrayW(c, PDH_FMT_DOUBLE, &mut size, &mut count, None);
        let mut out = Vec::new();
        if r == PDH_MORE_DATA && size > 0 {
            let mut buf = vec![0u8; size as usize];
            let items = buf.as_mut_ptr() as *mut PDH_FMT_COUNTERVALUE_ITEM_W;
            let r = PdhGetFormattedCounterArrayW(c, PDH_FMT_DOUBLE, &mut size, &mut count, Some(items));
            if r == 0 {
                for k in 0..count as usize {
                    let it = &*items.add(k);
                    if it.FmtValue.CStatus != 0 {
                        continue;
                    }
                    let name = it.szName.to_string().unwrap_or_default();
                    if let Some(s) = parse_gpu_instance(&name, it.FmtValue.Anonymous.doubleValue) {
                        out.push(s);
                    }
                }
            }
        }
        let _ = PdhCloseQuery(q);
        Ok(out)
    }
}

// ---------------------------------------------------------------- rede
// Só rede: ping (ICMP) até os relays da Valve, rota do Windows e um GET HTTPS
// pedido pelo usuário. Nada toca no jogo.

use windows::Win32::NetworkManagement::IpHelper::{
    GetBestInterface, GetIfEntry2, IcmpCloseHandle, IcmpCreateFile, IcmpSendEcho, ICMP_ECHO_REPLY, MIB_IF_ROW2,
};
use windows::Win32::Networking::WinHttp::*;

/// Um ping ICMP; `None` = sem resposta no tempo limite.
pub fn icmp_ping(ip: std::net::Ipv4Addr, timeout_ms: u32) -> Option<u32> {
    unsafe {
        let h = IcmpCreateFile().ok()?;
        let data = [0x43u8; 32];
        let mut reply = vec![0u8; std::mem::size_of::<ICMP_ECHO_REPLY>() + data.len() + 8];
        let n = IcmpSendEcho(
            h,
            u32::from_ne_bytes(ip.octets()),
            data.as_ptr() as *const _,
            data.len() as u16,
            None,
            reply.as_mut_ptr() as *mut _,
            reply.len() as u32,
            timeout_ms,
        );
        let _ = IcmpCloseHandle(h);
        if n == 0 {
            return None;
        }
        let r = &*(reply.as_ptr() as *const ICMP_ECHO_REPLY);
        (r.Status == 0).then_some(r.RoundTripTime)
    }
}

/// Placa de rede que o Windows usa para chegar em `ip`.
pub fn route_interface(ip: std::net::Ipv4Addr) -> Result<NetInterface> {
    unsafe {
        let mut idx = 0u32;
        let r = GetBestInterface(u32::from_ne_bytes(ip.octets()), &mut idx);
        if r != 0 {
            bail!("GetBestInterface {r}");
        }
        let mut row = MIB_IF_ROW2 { InterfaceIndex: idx, ..Default::default() };
        GetIfEntry2(&mut row).ok().map_err(|e| anyhow!("GetIfEntry2: {e}"))?;
        // 71 = IF_TYPE_IEEE80211; 9 = NdisPhysicalMediumNative802_11
        let wifi = row.Type == 71 || row.PhysicalMediumType.0 == 9;
        Ok(NetInterface {
            name: wide_to_string(&row.Alias),
            description: wide_to_string(&row.Description),
            wifi,
            link_mbps: row.ReceiveLinkSpeed.min(row.TransmitLinkSpeed) / 1_000_000,
        })
    }
}

/// GET HTTPS pelo WinHTTP do Windows (usa o proxy e os certificados do sistema).
pub fn https_get(host: &str, path: &str) -> Result<Vec<u8>> {
    unsafe {
        let agent = to_wide("CSBoost");
        let ses = WinHttpOpen(PCWSTR(agent.as_ptr()), WINHTTP_ACCESS_TYPE_AUTOMATIC_PROXY, PCWSTR::null(), PCWSTR::null(), 0);
        if ses.is_null() {
            bail!("WinHttpOpen: {}", std::io::Error::last_os_error());
        }
        let _ = WinHttpSetTimeouts(ses, 8000, 8000, 8000, 8000);
        let h = to_wide(host);
        let con = WinHttpConnect(ses, PCWSTR(h.as_ptr()), INTERNET_DEFAULT_HTTPS_PORT, 0);
        let result = (|| -> Result<Vec<u8>> {
            if con.is_null() {
                bail!("WinHttpConnect: {}", std::io::Error::last_os_error());
            }
            let verb = to_wide("GET");
            let p = to_wide(path);
            let req = WinHttpOpenRequest(con, PCWSTR(verb.as_ptr()), PCWSTR(p.as_ptr()), PCWSTR::null(), PCWSTR::null(), std::ptr::null(), WINHTTP_FLAG_SECURE);
            if req.is_null() {
                bail!("WinHttpOpenRequest: {}", std::io::Error::last_os_error());
            }
            let body = (|| -> Result<Vec<u8>> {
                WinHttpSendRequest(req, None, None, 0, 0, 0).map_err(|e| anyhow!("{e}"))?;
                WinHttpReceiveResponse(req, std::ptr::null_mut()).map_err(|e| anyhow!("{e}"))?;
                let mut out = Vec::new();
                let mut buf = vec![0u8; 64 * 1024];
                loop {
                    let mut read = 0u32;
                    WinHttpReadData(req, buf.as_mut_ptr() as *mut _, buf.len() as u32, &mut read).map_err(|e| anyhow!("{e}"))?;
                    if read == 0 {
                        break;
                    }
                    out.extend_from_slice(&buf[..read as usize]);
                    if out.len() > 8 * 1024 * 1024 {
                        bail!("resposta grande demais");
                    }
                }
                Ok(out)
            })();
            let _ = WinHttpCloseHandle(req);
            body
        })();
        if !con.is_null() {
            let _ = WinHttpCloseHandle(con);
        }
        let _ = WinHttpCloseHandle(ses);
        result
    }
}
