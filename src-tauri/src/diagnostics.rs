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
    crate::gpu::name_says_integrated(name)
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
        name: plan_guid.as_deref().map(platform::plan_name).unwrap_or_else(|| tr!("Desconhecido", "Desconocido", "Unknown")),
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
                title: tr!("Monitor em {} Hz — ele aguenta {} Hz", "Monitor a {} Hz — soporta {} Hz", "Monitor at {} Hz — it supports {} Hz", d.current_hz, d.max_hz),
                detail: {
                    let name = if d.name.is_empty() { tr!("Seu monitor", "Tu monitor", "Your monitor") } else { d.name.clone() };
                    tr!(
                        "{name} está rodando abaixo do que suporta. Você está vendo menos quadros do que o PC gera. É a correção com maior efeito na fluidez.",
                        "{name} está funcionando por debajo de lo que soporta. Estás viendo menos cuadros de los que genera la PC. Es la corrección con más efecto en la fluidez.",
                        "{name} is running below what it supports. You are seeing fewer frames than your PC renders. This is the fix with the biggest effect on smoothness."
                    )
                },
                fix: Some(Fix::DisplayRefresh { device: d.device.clone(), hz: d.max_hz }),
            });
        } else if d.current_hz > 0 {
            ok.push(tr!("Monitor na taxa máxima ({} Hz)", "Monitor en su frecuencia máxima ({} Hz)", "Monitor at its maximum refresh rate ({} Hz)", d.current_hz));
        }
    }

    // 2. Notebook na bateria
    if power.has_battery && !power.on_ac {
        issues.push(Issue {
            id: "power.on_battery".into(),
            severity: Severity::Critical,
            title: tr!("Notebook rodando na bateria", "Notebook funcionando con batería", "Laptop running on battery"),
            detail: tr!(
                "Na bateria, CPU e GPU limitam o clock para economizar. Para jogar, conecte o carregador.",
                "Con batería, la CPU y la GPU bajan la frecuencia para ahorrar energía. Para jugar, conecta el cargador.",
                "On battery, the CPU and GPU lower their clocks to save power. Plug in the charger to play."
            ),
            fix: Some(Fix::Guide {
                steps: vec![
                    tr!("Conecte o carregador original do notebook.", "Conecta el cargador original de la notebook.", "Plug in the laptop's original charger."),
                    tr!("Rode o Raio-X de novo.", "Vuelve a ejecutar el Rayos X de la PC.", "Run the PC Scan again."),
                ],
            }),
        });
    }

    // 3. Plano de energia
    match plan_guid.as_deref() {
        Some(platform::PLAN_POWER_SAVER) => issues.push(Issue {
            id: "power.plan".into(),
            severity: Severity::Critical,
            title: tr!("Plano de energia em Economia", "Plan de energía en Ahorro", "Power plan set to Power saver"),
            detail: tr!(
                "O processador está limitado para gastar menos energia — isso derruba o FPS no CS2, que depende muito da CPU.",
                "El procesador está limitado para gastar menos energía, y eso baja los FPS en CS2, que depende mucho de la CPU.",
                "The processor is limited to use less power, which drops FPS in CS2, a game that leans heavily on the CPU."
            ),
            fix: Some(Fix::Tweak { tweak_id: "power.high_performance".into() }),
        }),
        Some(platform::PLAN_BALANCED) => issues.push(Issue {
            id: "power.plan".into(),
            severity: Severity::Warning,
            title: tr!("Plano de energia Equilibrado", "Plan de energía Equilibrado", "Balanced power plan"),
            detail: tr!(
                "O Equilibrado reduz o clock quando acha que não precisa, o que pode causar quedas de FPS em momentos de ação.",
                "El plan Equilibrado baja la frecuencia cuando cree que no hace falta, y eso puede causar caídas de FPS en plena acción.",
                "Balanced lowers clock speeds when it thinks they are not needed, which can cause FPS drops in the middle of a fight."
            ),
            fix: Some(Fix::Tweak { tweak_id: "power.high_performance".into() }),
        }),
        Some(_) => ok.push(tr!("Plano de energia: {}", "Plan de energía: {}", "Power plan: {}", power_plan.name)),
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
        let locked = memory_speed_locked(&hardware.cpu, &hardware.board);
        if base > 0 && cfg > 0 && cfg <= base && locked && ty == 26 {
            ok.push(tr!(
                "Memória a {cfg} MT/s (é o máximo desta placa-mãe: chipset Intel B/H/Q não aumenta a velocidade da memória)",
                "Memoria a {cfg} MT/s (es el máximo de esta placa madre: el chipset Intel B/H/Q no sube la velocidad de la memoria)",
                "Memory at {cfg} MT/s (the most this motherboard allows: Intel B/H/Q chipsets can't raise memory speed)"
            ));
        } else if base > 0 && cfg > 0 && cfg <= base && !power.has_battery {
            issues.push(Issue {
                id: "ram.xmp".into(),
                severity: Severity::Warning,
                title: tr!("Memória {label} a {cfg} MT/s — pode estar sem XMP/EXPO", "Memoria {label} a {cfg} MT/s — puede estar sin XMP/EXPO", "{label} memory at {cfg} MT/s — XMP/EXPO may be off"),
                detail: tr!(
                    "Pentes de memória gamer vêm de fábrica numa velocidade básica. Ativar o perfil XMP (Intel) ou EXPO (AMD) na BIOS costuma dar ganho real no CS2.",
                    "Las memorias gamer vienen de fábrica a una velocidad básica. Activar el perfil XMP (Intel) o EXPO (AMD) en la BIOS suele dar una mejora real en CS2.",
                    "Gaming memory ships at a basic speed. Enabling the XMP (Intel) or EXPO (AMD) profile in the BIOS usually gives a real gain in CS2."
                ),
                fix: Some(Fix::Guide {
                    steps: vec![
                        tr!("Reinicie o PC e entre na BIOS (geralmente tecla Del ou F2 ao ligar).", "Reinicia la PC y entra a la BIOS (normalmente con Supr o F2 al encender).", "Restart the PC and enter the BIOS (usually Del or F2 while it boots)."),
                        tr!("Procure por XMP, EXPO, D.O.C.P ou A-XMP (na aba AI Tweaker, OC ou Extreme Tweaker).", "Busca XMP, EXPO, D.O.C.P o A-XMP (en la pestaña AI Tweaker, OC o Extreme Tweaker).", "Look for XMP, EXPO, D.O.C.P or A-XMP (under AI Tweaker, OC or Extreme Tweaker)."),
                        tr!("Ative o Perfil 1, salve (F10) e reinicie.", "Activa el Perfil 1, guarda (F10) y reinicia.", "Enable Profile 1, save (F10) and restart."),
                        tr!("Se o Perfil 1 já mostra a mesma velocidade que aparece aqui (ex.: DDR4-2666), seus pentes já estão no máximo deles: pode ignorar este aviso.", "Si el Perfil 1 ya muestra la misma velocidad que aparece acá (ej.: DDR4-2666), tus módulos ya están en su máximo: puedes ignorar este aviso.", "If Profile 1 already shows the same speed as here (e.g. DDR4-2666), your sticks are already at their maximum: you can ignore this warning."),
                        tr!("Se o PC não ligar, ele volta sozinho ao padrão após algumas tentativas.", "Si la PC no arranca, vuelve sola a la configuración original después de algunos intentos.", "If the PC does not boot, it goes back to the defaults by itself after a few tries."),
                    ],
                }),
            });
        } else if cfg > 0 {
            ok.push(tr!("Memória a {cfg} MT/s", "Memoria a {cfg} MT/s", "Memory at {cfg} MT/s"));
        }
        if mods.len() == 1 && !power.has_battery {
            issues.push(Issue {
                id: "ram.single_channel".into(),
                severity: Severity::Warning,
                title: tr!("Apenas um pente de memória (canal único)", "Un solo módulo de memoria (canal simple)", "Only one memory stick (single channel)"),
                detail: tr!(
                    "Com um pente só, a memória trabalha com metade da banda. Dois pentes iguais (dual channel) ajudam bastante o 1% low no CS2.",
                    "Con un solo módulo, la memoria trabaja con la mitad del ancho de banda. Dos módulos iguales (dual channel) ayudan mucho al 1% low en CS2.",
                    "With a single stick, memory runs at half the bandwidth. Two matching sticks (dual channel) help CS2's 1% lows a lot."
                ),
                fix: None,
            });
        }
        if total < 7.5 {
            issues.push(Issue {
                id: "ram.low".into(),
                severity: Severity::Warning,
                title: tr!("{total:.0} GB de RAM", "{total:.0} GB de RAM", "{total:.0} GB of RAM"),
                detail: tr!(
                    "O CS2 pede pelo menos 8 GB. Feche navegador e apps pesados antes de jogar.",
                    "CS2 pide al menos 8 GB. Cierra el navegador y las apps pesadas antes de jugar.",
                    "CS2 needs at least 8 GB. Close your browser and heavy apps before playing."
                ),
                fix: None,
            });
        } else if total < 15.0 {
            issues.push(Issue {
                id: "ram.low".into(),
                severity: Severity::Info,
                title: tr!("{total:.0} GB de RAM", "{total:.0} GB de RAM", "{total:.0} GB of RAM"),
                detail: tr!(
                    "Dá para jogar, mas 16 GB deixa o sistema mais folgado com Discord e navegador abertos.",
                    "Se puede jugar, pero con 16 GB el sistema queda más holgado con Discord y el navegador abiertos.",
                    "It is playable, but 16 GB leaves more room with Discord and a browser open."
                ),
                fix: None,
            });
        } else {
            ok.push(tr!("{total:.0} GB de RAM", "{total:.0} GB de RAM", "{total:.0} GB of RAM"));
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
                    title: tr!("CS2 pode estar abrindo na GPU integrada", "CS2 puede estar abriéndose en la GPU integrada", "CS2 may be opening on the integrated GPU"),
                    detail: tr!(
                        "Este PC tem vídeo integrado e dedicado. Sem a preferência configurada, o Windows pode escolher a GPU fraca.",
                        "Esta PC tiene video integrado y dedicado. Sin la preferencia configurada, Windows puede elegir la GPU débil.",
                        "This PC has integrated and dedicated graphics. Without the preference set, Windows may pick the weaker GPU."
                    ),
                    fix: Some(Fix::Tweak { tweak_id: t.id }),
                });
            } else {
                ok.push(tr!("CS2 configurado para a GPU dedicada", "CS2 configurado para la GPU dedicada", "CS2 set to use the dedicated GPU"));
            }
        }
    }

    // 5b. Monitor ligado na saída da placa-mãe (desktop com placa dedicada).
    // Só lê a lista de placas e monitores pelo DXGI; não toca no jogo.
    if !power.has_battery {
        let raw = platform::gpu_adapters().unwrap_or_default();
        let views = crate::gpu::classify(&raw);
        let on_igpu: Vec<&str> = raw.iter().zip(&views).filter(|(a, v)| v.integrated && a.outputs > 0).map(|(a, _)| a.name.as_str()).collect();
        let dgpu = raw.iter().zip(&views).filter(|(_, v)| !v.integrated).map(|(a, _)| a).max_by_key(|a| a.dedicated_mb);
        if let (Some(igpu), Some(d)) = (on_igpu.first(), dgpu) {
            let (igpu, dname) = (igpu.to_string(), d.name.clone());
            let all = d.outputs == 0;
            issues.push(Issue {
                id: "gpu.monitor_on_igpu".into(),
                severity: if all { Severity::Critical } else { Severity::Warning },
                title: if all {
                    tr!("Monitor ligado na saída da placa-mãe", "Monitor conectado a la salida de la placa madre", "Monitor plugged into the motherboard")
                } else {
                    tr!("Um dos monitores está na saída da placa-mãe", "Uno de los monitores está en la salida de la placa madre", "One monitor is plugged into the motherboard")
                },
                detail: tr!(
                    "O monitor está no vídeo integrado ({igpu}), não na {dname}. Assim a imagem passa pela placa fraca e o FPS cai ou fica travado.",
                    "El monitor está en el video integrado ({igpu}), no en la {dname}. Así la imagen pasa por la placa débil y el FPS baja o queda trabado.",
                    "The monitor is on the integrated graphics ({igpu}), not the {dname}. The image goes through the weaker chip and FPS drops or gets capped."
                ),
                fix: Some(Fix::Guide {
                    steps: vec![
                        tr!("Desligue o PC e olhe atrás do gabinete.", "Apaga la PC y mira atrás del gabinete.", "Turn off the PC and look at the back of the case."),
                        tr!("Tire o cabo do monitor da saída de vídeo de cima (a da placa-mãe, na vertical, perto das USB).", "Saca el cable del monitor de la salida de video de arriba (la de la placa madre, en vertical, cerca de los USB).", "Unplug the monitor cable from the upper video port (the motherboard one, vertical, next to the USB ports)."),
                        tr!("Ligue na saída da placa de vídeo, mais embaixo e na horizontal.", "Conéctalo en la salida de la placa de video, más abajo y en horizontal.", "Plug it into the graphics card's port, lower down and horizontal."),
                        tr!("Ligue o PC e rode o Raio-X de novo.", "Enciende la PC y vuelve a correr Rayos X.", "Turn the PC on and run the PC Scan again."),
                    ],
                }),
            });
        }
    }

    // 6. Driver de vídeo antigo
    for g in hardware.gpus.iter().filter(|g| !is_integrated(&g.name)) {
        if let Some(age) = g.driver_date.as_deref().and_then(months_since) {
            if age >= 12 {
                let n = g.name.to_lowercase();
                let site = if n.contains("nvidia") || n.contains("geforce") {
                    tr!("nvidia.com/drivers ou pelo app NVIDIA", "nvidia.com/drivers o desde la app de NVIDIA", "nvidia.com/drivers or the NVIDIA app")
                } else if n.contains("amd") || n.contains("radeon") {
                    tr!("amd.com/support ou pelo AMD Software: Adrenalin", "amd.com/support o desde AMD Software: Adrenalin", "amd.com/support or AMD Software: Adrenalin")
                } else {
                    tr!("o site do fabricante da placa", "el sitio del fabricante de la placa", "the graphics card maker's website")
                };
                issues.push(Issue {
                    id: format!("gpu.driver.{}", g.name),
                    severity: Severity::Warning,
                    title: tr!("Driver de vídeo com {age} meses", "Driver de video de hace {age} meses", "Graphics driver is {age} months old"),
                    detail: {
                        let (name, date) = (g.name.clone(), g.driver_date.clone().unwrap_or_default());
                        tr!(
                            "{name} está com driver de {date}. Drivers novos trazem correções de desempenho para o CS2.",
                            "{name} tiene un driver del {date}. Los drivers nuevos traen correcciones de rendimiento para CS2.",
                            "{name} has a driver from {date}. New drivers bring performance fixes for CS2."
                        )
                    },
                    fix: Some(Fix::Guide {
                        steps: vec![
                            tr!("Baixe o driver mais recente em {site}.", "Descarga el driver más reciente en {site}.", "Download the latest driver from {site}."),
                            tr!("Instale e reinicie o PC.", "Instálalo y reinicia la PC.", "Install it and restart the PC."),
                        ],
                    }),
                });
            } else {
                ok.push(tr!("Driver de vídeo recente ({})", "Driver de video reciente ({})", "Recent graphics driver ({})", g.name));
            }
        }
    }

    // 7. Gravação em segundo plano
    if let Some(t) = catalog::find("gamedvr.disable") {
        if engine::detect(&t, &ctx, &journal) == TweakState::NotApplied {
            issues.push(Issue {
                id: "gamedvr".into(),
                severity: Severity::Warning,
                title: tr!("Gravação em segundo plano ligada", "Grabación en segundo plano activada", "Background recording is on"),
                detail: tr!(
                    "O Windows pode estar gravando o jogo continuamente, gastando GPU e disco.",
                    "Windows puede estar grabando el juego todo el tiempo, gastando GPU y disco.",
                    "Windows may be recording your game all the time, using GPU and disk."
                ),
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
                title: tr!("Pouco espaço no disco C: ({free:.0} GB livres)", "Poco espacio en el disco C: ({free:.0} GB libres)", "Low space on drive C: ({free:.0} GB free)"),
                detail: tr!(
                    "Com o disco quase cheio o Windows fica mais lento e o cache de shaders pode falhar. Libere espaço.",
                    "Con el disco casi lleno, Windows se vuelve más lento y la caché de shaders puede fallar. Libera espacio.",
                    "With the drive almost full, Windows slows down and the shader cache can fail. Free up some space."
                ),
                fix: None,
            });
        }
    }

    // 9. Windows 10
    if hardware.os_build > 0 && hardware.os_build < 22000 {
        issues.push(Issue {
            id: "os.win10".into(),
            severity: Severity::Info,
            title: tr!("Windows 10 sem suporte oficial", "Windows 10 sin soporte oficial", "Windows 10 is no longer supported"),
            detail: tr!(
                "A Microsoft encerrou o suporte ao Windows 10 em outubro de 2025. Ainda funciona, mas não recebe mais correções de segurança.",
                "Microsoft terminó el soporte de Windows 10 en octubre de 2025. Sigue funcionando, pero ya no recibe parches de seguridad.",
                "Microsoft ended Windows 10 support in October 2025. It still works, but it no longer gets security fixes."
            ),
            fix: None,
        });
    }

    // 10. CS2
    if cs2_found {
        ok.push(tr!("CS2 encontrado", "CS2 encontrado", "CS2 found"));
    } else {
        issues.push(Issue {
            id: "cs2.missing".into(),
            severity: Severity::Info,
            title: tr!("CS2 não encontrado", "CS2 no encontrado", "CS2 not found"),
            detail: tr!(
                "Não achamos o Counter-Strike 2 nas bibliotecas da Steam. As otimizações do jogo ficam indisponíveis.",
                "No encontramos Counter-Strike 2 en las bibliotecas de Steam. Las optimizaciones del juego no están disponibles.",
                "We could not find Counter-Strike 2 in your Steam libraries. Game optimizations are unavailable."
            ),
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

/// Placas Intel com chipset B/H/Q das séries 100 a 400 (ex.: B250, B360, H310, B460)
/// travam a memória na velocidade oficial do processador: XMP acima disso não
/// tem efeito. A partir da série 500 (B560, H570…) a memória pode subir.
fn memory_speed_locked(cpu: &str, board: &str) -> bool {
    if !cpu.to_lowercase().contains("intel") {
        return false;
    }
    board.to_uppercase().split(|c: char| !c.is_ascii_alphanumeric()).any(|w| {
        let b = w.as_bytes();
        // pega "B360", "H310M", "B365M" etc.
        b.len() >= 4
            && matches!(b[0], b'B' | b'H' | b'Q')
            && (b'1'..=b'4').contains(&b[1])
            && b[2].is_ascii_digit()
            && b[3].is_ascii_digit()
            && b[4..].iter().all(|c| c.is_ascii_alphabetic())
    })
}

#[cfg(test)]
mod ram_tests {
    #[test]
    fn locked_chipsets() {
        let i = "Intel(R) Core(TM) i5-9400F CPU @ 2.90GHz";
        assert!(super::memory_speed_locked(i, "TUF B360M-PLUS GAMING/BR"));
        assert!(super::memory_speed_locked(i, "PRIME H310M-E R2.0"));
        assert!(!super::memory_speed_locked(i, "ROG STRIX Z390-F GAMING"));
        assert!(!super::memory_speed_locked(i, "PRIME B560M-A"));
        assert!(!super::memory_speed_locked("AMD Ryzen 5 5600", "B450M PRO4"));
    }
}

