//! Raio-X do PC: encontra o que realmente rouba FPS (monitor em Hz errado,
//! RAM sem XMP, notebook na bateria, plano de energia, GPU errada...) e dá
//! uma nota de 0 a 100.

use crate::engine::{self, Ctx, TweakState};
use crate::journal::Journal;
use crate::platform::{self, DisplayInfo, HardwareInfo, PowerStatus};
use crate::{catalog, cs2};
use serde::Serialize;

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Severity {
    Critical,
    Warning,
    Info,
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum Fix {
    Tweak { tweak_id: String },
    DisplayRefresh { device: String, hz: u32 },
    Guide { steps: Vec<String> },
}

#[derive(Debug, Clone, Serialize)]
pub struct Issue {
    pub id: String,
    pub severity: Severity,
    pub title: String,
    pub detail: String,
    pub fix: Option<Fix>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PowerPlanInfo {
    pub guid: Option<String>,
    pub name: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct Report {
    pub score: u8,
    pub elevated: bool,
    pub hardware: HardwareInfo,
    pub displays: Vec<DisplayInfo>,
    pub power: PowerStatus,
    pub power_plan: PowerPlanInfo,
    pub cs2_found: bool,
    pub issues: Vec<Issue>,
    pub checks_passed: Vec<String>,
}

fn is_integrated(name: &str) -> bool {
    let n = name.to_lowercase();
    (n.contains("intel") && (n.contains("uhd") || n.contains("iris") || n.contains("hd graphics") || n.contains("arc graphics")))
        || (n.contains("amd") && n.contains("radeon") && !n.contains(" rx") && (n.contains("graphics") || n.contains("vega")))
}

/// (ano, mês) de hoje a partir do relógio do sistema.
fn today_ym() -> (i64, i64) {
    let days = (crate::journal::now_ms() / 86_400_000) as i64;
    // algoritmo civil_from_days (Howard Hinnant)
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = yoe + era * 400 + if m <= 2 { 1 } else { 0 };
    (y, m)
}

fn months_since(date: &str) -> Option<i64> {
    let y: i64 = date.get(0..4)?.parse().ok()?;
    let m: i64 = date.get(5..7)?.parse().ok()?;
    let (ty, tm) = today_ym();
    Some((ty - y) * 12 + (tm - m))
}

pub fn run() -> Report {
    let hardware = platform::hardware_info().unwrap_or_default();
    let displays = platform::displays().unwrap_or_default();
    let power = platform::power_status();
    let plan_guid = platform::power_active().ok();
    let power_plan = PowerPlanInfo {
        name: plan_guid.as_deref().map(platform::plan_name).unwrap_or("Desconhecido").to_string(),
        guid: plan_guid.clone(),
    };
    let ctx = Ctx::detect();
    let journal = Journal::load();
    let cs2_found = cs2::install_dir().is_some();

    let mut issues: Vec<Issue> = Vec::new();
    let mut ok: Vec<String> = Vec::new();

    // 1. Monitor abaixo da taxa máxima
    for d in &displays {
        if d.max_hz > d.current_hz + 1 {
            issues.push(Issue {
                id: format!("display.{}", d.device),
                severity: Severity::Critical,
                title: format!("Monitor em {} Hz — ele aguenta {} Hz", d.current_hz, d.max_hz),
                detail: format!(
                    "{} está rodando abaixo do que suporta. Você está vendo menos quadros do que o PC gera. É a correção com maior efeito na fluidez.",
                    if d.name.is_empty() { "Seu monitor" } else { &d.name }
                ),
                fix: Some(Fix::DisplayRefresh { device: d.device.clone(), hz: d.max_hz }),
            });
        } else if d.current_hz > 0 {
            ok.push(format!("Monitor na taxa máxima ({} Hz)", d.current_hz));
        }
    }

    // 2. Notebook na bateria
    if power.has_battery && !power.on_ac {
        issues.push(Issue {
            id: "power.on_battery".into(),
            severity: Severity::Critical,
            title: "Notebook rodando na bateria".into(),
            detail: "Na bateria, CPU e GPU limitam o clock para economizar. Para jogar, conecte o carregador.".into(),
            fix: Some(Fix::Guide { steps: vec!["Conecte o carregador original do notebook.".into(), "Rode o Raio-X de novo.".into()] }),
        });
    }

    // 3. Plano de energia
    match plan_guid.as_deref() {
        Some(platform::PLAN_POWER_SAVER) => issues.push(Issue {
            id: "power.plan".into(),
            severity: Severity::Critical,
            title: "Plano de energia em Economia".into(),
            detail: "O processador está limitado para gastar menos energia — isso derruba o FPS no CS2, que depende muito da CPU.".into(),
            fix: Some(Fix::Tweak { tweak_id: "power.high_performance".into() }),
        }),
        Some(platform::PLAN_BALANCED) => issues.push(Issue {
            id: "power.plan".into(),
            severity: Severity::Warning,
            title: "Plano de energia Equilibrado".into(),
            detail: "O Equilibrado reduz o clock quando acha que não precisa, o que pode causar quedas de FPS em momentos de ação.".into(),
            fix: Some(Fix::Tweak { tweak_id: "power.high_performance".into() }),
        }),
        Some(_) => ok.push(format!("Plano de energia: {}", power_plan.name)),
        None => {}
    }

    // 4. Memória RAM
    let mods = &hardware.ram_modules;
    if !mods.is_empty() {
        let total: f64 = mods.iter().map(|m| m.capacity_gb).sum();
        let cfg = mods.iter().filter_map(|m| m.configured_mts).min().unwrap_or(0);
        let ty = mods.iter().find_map(|m| m.smbios_type).unwrap_or(0);
        let (label, base) = match ty {
            26 => ("DDR4", 2666),
            34 => ("DDR5", 4800),
            _ => ("", 0),
        };
        if base > 0 && cfg > 0 && cfg <= base && !power.has_battery {
            issues.push(Issue {
                id: "ram.xmp".into(),
                severity: Severity::Warning,
                title: format!("Memória {label} a {cfg} MT/s — provavelmente sem XMP/EXPO"),
                detail: "Pentes de memória gamer vêm de fábrica numa velocidade básica. Ativar o perfil XMP (Intel) ou EXPO (AMD) na BIOS costuma dar ganho real no CS2.".into(),
                fix: Some(Fix::Guide {
                    steps: vec![
                        "Reinicie o PC e entre na BIOS (geralmente tecla Del ou F2 ao ligar).".into(),
                        "Procure por XMP, EXPO, D.O.C.P ou A-XMP (na aba AI Tweaker, OC ou Extreme Tweaker).".into(),
                        "Ative o Perfil 1, salve (F10) e reinicie.".into(),
                        "Se o PC não ligar, ele volta sozinho ao padrão após algumas tentativas.".into(),
                    ],
                }),
            });
        } else if cfg > 0 {
            ok.push(format!("Memória a {cfg} MT/s"));
        }
        if mods.len() == 1 && !power.has_battery {
            issues.push(Issue {
                id: "ram.single_channel".into(),
                severity: Severity::Warning,
                title: "Apenas um pente de memória (canal único)".into(),
                detail: "Com um pente só, a memória trabalha com metade da banda. Dois pentes iguais (dual channel) ajudam bastante o 1% low no CS2.".into(),
                fix: None,
            });
        }
        if total < 7.5 {
            issues.push(Issue {
                id: "ram.low".into(),
                severity: Severity::Warning,
                title: format!("{total:.0} GB de RAM"),
                detail: "O CS2 pede pelo menos 8 GB. Feche navegador e apps pesados antes de jogar.".into(),
                fix: None,
            });
        } else if total < 15.0 {
            issues.push(Issue {
                id: "ram.low".into(),
                severity: Severity::Info,
                title: format!("{total:.0} GB de RAM"),
                detail: "Dá para jogar, mas 16 GB deixa o sistema mais folgado com Discord e navegador abertos.".into(),
                fix: None,
            });
        } else {
            ok.push(format!("{total:.0} GB de RAM"));
        }
    }

    // 5. GPU dedicada para o CS2 (máquinas com 2 GPUs)
    let has_integrated = hardware.gpus.iter().any(|g| is_integrated(&g.name));
    let has_dedicated = hardware.gpus.iter().any(|g| !is_integrated(&g.name));
    if has_integrated && has_dedicated && cs2_found {
        if let Some(t) = catalog::find("cs2.gpu_high_performance") {
            if engine::detect(&t, &ctx, &journal) != TweakState::Applied {
                issues.push(Issue {
                    id: "gpu.preference".into(),
                    severity: Severity::Critical,
                    title: "CS2 pode estar abrindo na GPU integrada".into(),
                    detail: "Este PC tem vídeo integrado e dedicado. Sem a preferência configurada, o Windows pode escolher a GPU fraca.".into(),
                    fix: Some(Fix::Tweak { tweak_id: t.id }),
                });
            } else {
                ok.push("CS2 configurado para a GPU dedicada".into());
            }
        }
    }

    // 6. Driver de vídeo antigo
    for g in hardware.gpus.iter().filter(|g| !is_integrated(&g.name)) {
        if let Some(age) = g.driver_date.as_deref().and_then(months_since) {
            if age >= 12 {
                let n = g.name.to_lowercase();
                let site = if n.contains("nvidia") || n.contains("geforce") {
                    "nvidia.com.br/drivers ou pelo app NVIDIA"
                } else if n.contains("amd") || n.contains("radeon") {
                    "amd.com/pt/support ou pelo AMD Software: Adrenalin"
                } else {
                    "o site do fabricante da placa"
                };
                issues.push(Issue {
                    id: format!("gpu.driver.{}", g.name),
                    severity: Severity::Warning,
                    title: format!("Driver de vídeo com {age} meses"),
                    detail: format!("{} está com driver de {}. Drivers novos trazem correções de desempenho para o CS2.", g.name, g.driver_date.clone().unwrap_or_default()),
                    fix: Some(Fix::Guide { steps: vec![format!("Baixe o driver mais recente em {site}."), "Instale e reinicie o PC.".into()] }),
                });
            } else {
                ok.push(format!("Driver de vídeo recente ({})", g.name));
            }
        }
    }

    // 7. Gravação em segundo plano
    if let Some(t) = catalog::find("gamedvr.disable") {
        if engine::detect(&t, &ctx, &journal) == TweakState::NotApplied {
            issues.push(Issue {
                id: "gamedvr".into(),
                severity: Severity::Warning,
                title: "Gravação em segundo plano ligada".into(),
                detail: "O Windows pode estar gravando o jogo continuamente, gastando GPU e disco.".into(),
                fix: Some(Fix::Tweak { tweak_id: t.id }),
            });
        }
    }

    // 8. Disco
    if let Some(free) = hardware.disk_free_gb {
        if free < 15.0 {
            issues.push(Issue {
                id: "disk.free".into(),
                severity: Severity::Warning,
                title: format!("Pouco espaço no disco C: ({free:.0} GB livres)"),
                detail: "Com o disco quase cheio o Windows fica mais lento e o cache de shaders pode falhar. Libere espaço.".into(),
                fix: None,
            });
        }
    }

    // 9. Windows 10
    if hardware.os_build > 0 && hardware.os_build < 22000 {
        issues.push(Issue {
            id: "os.win10".into(),
            severity: Severity::Info,
            title: "Windows 10 sem suporte oficial".into(),
            detail: "A Microsoft encerrou o suporte ao Windows 10 em outubro de 2025. Ainda funciona, mas não recebe mais correções de segurança.".into(),
            fix: None,
        });
    }

    // 10. CS2
    if cs2_found {
        ok.push("CS2 encontrado".into());
    } else {
        issues.push(Issue {
            id: "cs2.missing".into(),
            severity: Severity::Info,
            title: "CS2 não encontrado".into(),
            detail: "Não achamos o Counter-Strike 2 nas bibliotecas da Steam. As otimizações do jogo ficam indisponíveis.".into(),
            fix: None,
        });
    }

    issues.sort_by_key(|i| match i.severity {
        Severity::Critical => 0,
        Severity::Warning => 1,
        Severity::Info => 2,
    });
    let penalty: i32 = issues
        .iter()
        .map(|i| match i.severity {
            Severity::Critical => 18,
            Severity::Warning => 8,
            Severity::Info => 2,
        })
        .sum();

    Report {
        score: (100 - penalty).clamp(0, 100) as u8,
        elevated: platform::is_elevated(),
        hardware,
        displays,
        power,
        power_plan,
        cs2_found,
        issues,
        checks_passed: ok,
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn integrated_detection() {
        assert!(super::is_integrated("Intel(R) UHD Graphics 630"));
        assert!(super::is_integrated("AMD Radeon(TM) Graphics"));
        assert!(!super::is_integrated("NVIDIA GeForce RTX 4060"));
        assert!(!super::is_integrated("AMD Radeon RX 6600"));
    }

    #[test]
    fn date_math() {
        let (y, m) = super::today_ym();
        assert!(y >= 2024 && (1..=12).contains(&m));
    }
}
