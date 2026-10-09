//! Em qual placa de vídeo o CS2 está rodando agora.
//!
//! Lê a lista de placas (DXGI) e os contadores de uso de GPU por processo do
//! Windows. Nada abre o processo do jogo (ver CLAUDE.md, Regra nº 1).

use crate::platform::{self, GpuAdapter};
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct AdapterView {
    pub name: String,
    pub dedicated_mb: u64,
    pub integrated: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct GpuInUse {
    pub cs2_running: bool,
    pub adapters: Vec<AdapterView>,
    /// Placa com mais uso pelo cs2.exe durante a amostra.
    pub in_use: Option<AdapterView>,
    pub laptop: bool,
    /// Passos para o CS2 usar a placa dedicada (vazio se já está nela).
    pub guide: Vec<String>,
}

pub(crate) fn name_says_integrated(name: &str) -> bool {
    let n = name.to_lowercase();
    if n.contains("intel") {
        // Arc dedicada tem modelo (A380, A770, B580…); a integrada é só "Arc(TM) Graphics"
        let dedicated_arc = n.split(|c: char| !c.is_ascii_alphanumeric()).any(|w| {
            w.len() == 4 && (w.starts_with('a') || w.starts_with('b')) && w[1..].chars().all(|c| c.is_ascii_digit())
        });
        return !dedicated_arc;
    }
    n.contains("radeon") && !n.contains(" rx") && (n.contains("graphics") || n.contains("vega"))
}

pub fn classify(adapters: &[GpuAdapter]) -> Vec<AdapterView> {
    let max = adapters.iter().map(|a| a.dedicated_mb).max().unwrap_or(0);
    adapters
        .iter()
        .map(|a| AdapterView {
            name: a.name.clone(),
            dedicated_mb: a.dedicated_mb,
            integrated: name_says_integrated(&a.name) || (adapters.len() > 1 && a.dedicated_mb < max && a.dedicated_mb <= 2048),
        })
        .collect()
}

/// Passos por fabricante para o notebook usar a placa dedicada.
pub fn guide(laptop: bool, manufacturer: &str) -> Vec<String> {
    let m = manufacturer.to_lowercase();
    let mut steps = Vec::new();
    if !laptop {
        steps.push(tr!(
            "Confira atrás do PC: o cabo do monitor precisa estar na placa de vídeo (a saída mais baixa, na horizontal), não na saída da placa-mãe.",
            "Revisa atrás de la PC: el cable del monitor tiene que estar en la placa de video (la salida más baja, en horizontal), no en la salida de la placa madre.",
            "Check the back of the PC: the monitor cable must be plugged into the graphics card (the lower, horizontal ports), not the motherboard port."
        ));
    } else {
        let app = if m.contains("asus") {
            tr!(
                "No Armoury Crate, procure Modo GPU (ou MUX Switch) e escolha Ultimate / GPU dedicada. Reinicie.",
                "En Armoury Crate, busca Modo GPU (o MUX Switch) y elige Ultimate / GPU dedicada. Reinicia.",
                "In Armoury Crate, look for GPU Mode (or MUX Switch) and pick Ultimate / dedicated GPU. Restart."
            )
        } else if m.contains("acer") {
            tr!(
                "No NitroSense ou PredatorSense, procure MUX Switch / Modo GPU e escolha a GPU dedicada (Discrete). Reinicie.",
                "En NitroSense o PredatorSense, busca MUX Switch / Modo GPU y elige la GPU dedicada (Discrete). Reinicia.",
                "In NitroSense or PredatorSense, look for MUX Switch / GPU mode and pick the dedicated GPU (Discrete). Restart."
            )
        } else if m.contains("lenovo") {
            tr!(
                "No Lenovo Vantage (ou Legion Space), procure Modo de trabalho da GPU / Modo híbrido e escolha a GPU dedicada (dGPU). Reinicie.",
                "En Lenovo Vantage (o Legion Space), busca Modo de trabajo de la GPU / Modo híbrido y elige la GPU dedicada (dGPU). Reinicia.",
                "In Lenovo Vantage (or Legion Space), look for GPU Working Mode / Hybrid mode and pick the dedicated GPU (dGPU). Restart."
            )
        } else if m.contains("hp") || m.contains("hewlett") {
            tr!(
                "No OMEN Gaming Hub, procure Alternador gráfico (Graphics Switcher) e escolha Discreto. Reinicie.",
                "En OMEN Gaming Hub, busca Selector de gráficos (Graphics Switcher) y elige Discreto. Reinicia.",
                "In OMEN Gaming Hub, look for Graphics Switcher and pick Discrete. Restart."
            )
        } else if m.contains("dell") || m.contains("alienware") {
            tr!(
                "No Alienware Command Center (ou na BIOS), procure Advanced Optimus / Hybrid Graphics e desative o modo híbrido. Reinicie.",
                "En Alienware Command Center (o en la BIOS), busca Advanced Optimus / Hybrid Graphics y desactiva el modo híbrido. Reinicia.",
                "In Alienware Command Center (or the BIOS), look for Advanced Optimus / Hybrid Graphics and turn off hybrid mode. Restart."
            )
        } else if m.contains("micro-star") || m.contains("msi") {
            tr!(
                "No MSI Center, procure GPU Switch e escolha a GPU dedicada (Discrete). Reinicie.",
                "En MSI Center, busca GPU Switch y elige la GPU dedicada (Discrete). Reinicia.",
                "In MSI Center, look for GPU Switch and pick the dedicated GPU (Discrete). Restart."
            )
        } else {
            tr!(
                "Se o notebook tiver MUX switch, ative a GPU dedicada no app do fabricante ou na BIOS e reinicie.",
                "Si la notebook tiene MUX switch, activa la GPU dedicada en la app del fabricante o en la BIOS y reinicia.",
                "If your laptop has a MUX switch, enable the dedicated GPU in the maker's app or the BIOS and restart."
            )
        };
        steps.push(tr!(
            "Jogue com o carregador conectado: na bateria muitos notebooks forçam a placa integrada.",
            "Juega con el cargador conectado: con batería muchas notebooks fuerzan la placa integrada.",
            "Play with the charger plugged in: on battery many laptops force the integrated GPU."
        ));
        steps.push(app);
    }
    steps.push(tr!(
        "Placa NVIDIA: Painel de Controle da NVIDIA › Gerenciar as configurações 3D › Configurações do programa › cs2.exe › Processador gráfico preferido: alto desempenho.",
        "Placa NVIDIA: Panel de control de NVIDIA › Administrar la configuración 3D › Configuración de programa › cs2.exe › Procesador de gráficos preferido: alto rendimiento.",
        "NVIDIA card: NVIDIA Control Panel › Manage 3D settings › Program Settings › cs2.exe › Preferred graphics processor: high-performance."
    ));
    steps.push(tr!(
        "Feche e abra o CS2 de novo e confira aqui.",
        "Cierra y vuelve a abrir CS2 y compruébalo aquí.",
        "Close and reopen CS2 and check here again."
    ));
    steps
}

/// Mede por `sample_ms` qual placa o cs2.exe está usando.
pub fn check(sample_ms: u64) -> GpuInUse {
    let raw = platform::gpu_adapters().unwrap_or_default();
    let adapters = classify(&raw);
    let power = platform::power_status();
    let laptop = power.has_battery;
    let pids = platform::pids_named("cs2.exe");
    let mut in_use = None;
    if !pids.is_empty() && !raw.is_empty() {
        let samples = platform::gpu_engine_usage(sample_ms).unwrap_or_default();
        let mut best: Option<(usize, f64)> = None;
        for (i, a) in raw.iter().enumerate() {
            let (hi, lo) = (a.luid_high as u32, a.luid_low);
            let total: f64 = samples
                .iter()
                .filter(|s| pids.contains(&s.pid) && ((s.luid_a == hi && s.luid_b == lo) || (s.luid_a == lo && s.luid_b == hi)))
                .map(|s| s.utilization)
                .sum();
            if total > 0.0 && best.map(|(_, b)| total > b).unwrap_or(true) {
                best = Some((i, total));
            }
        }
        in_use = best.map(|(i, _)| adapters[i].clone());
    }
    let on_integrated = in_use.as_ref().map(|a| a.integrated).unwrap_or(false);
    let manufacturer = platform::hardware_info().map(|h| h.manufacturer).unwrap_or_default();
    GpuInUse {
        cs2_running: !pids.is_empty(),
        guide: if on_integrated { guide(laptop, &manufacturer) } else { Vec::new() },
        adapters,
        in_use,
        laptop,
    }
}

#[cfg(test)]
mod tests {
    use crate::platform::GpuAdapter;

    fn a(name: &str, mb: u64) -> GpuAdapter {
        GpuAdapter { name: name.into(), vendor_id: 0, dedicated_mb: mb, outputs: 0, luid_low: 0, luid_high: 0 }
    }

    #[test]
    fn hybrid_laptop_is_classified() {
        let v = super::classify(&[a("Intel(R) UHD Graphics", 128), a("NVIDIA GeForce RTX 3050 Laptop GPU", 3962)]);
        assert!(v[0].integrated && !v[1].integrated);
    }

    #[test]
    fn names() {
        assert!(super::name_says_integrated("Intel(R) Arc(TM) Graphics"));
        assert!(!super::name_says_integrated("Intel(R) Arc(TM) A770 Graphics"));
        assert!(super::name_says_integrated("AMD Radeon 780M Graphics"));
        assert!(!super::name_says_integrated("AMD Radeon RX 6800M"));
    }

    #[test]
    fn single_dedicated_is_not_integrated() {
        let v = super::classify(&[a("NVIDIA GeForce RTX 3060", 12039)]);
        assert!(!v[0].integrated);
    }
}
