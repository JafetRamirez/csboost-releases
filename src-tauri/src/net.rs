//! Diagnóstico de rede gratuito: ping, variação (jitter) e perda até os
//! relays da Valve (Steam Datagram Relay), mais a placa de rede em uso.
//!
//! Só mede. Não muda rota, não usa servidor próprio e não promete ping menor
//! (ver ROADMAP #13 e a regra do produto 100% gratuito). Nada toca no jogo.
//! A lista de relays vem da API pública da Steam e só é baixada quando o
//! usuário clica em Testar.

use crate::platform::{self, NetInterface};
use anyhow::{anyhow, Result};
use serde::Serialize;
use std::net::Ipv4Addr;

const PROBES: u32 = 20;
const TIMEOUT_MS: u32 = 1000;

#[derive(Debug, Clone)]
pub struct Pop {
    pub code: String,
    pub name: String,
    pub relays: Vec<Ipv4Addr>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PopResult {
    pub code: String,
    pub name: String,
    pub sent: u32,
    pub received: u32,
    pub avg_ms: Option<f64>,
    pub min_ms: Option<u32>,
    pub jitter_ms: Option<f64>,
    pub loss_pct: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct NetReport {
    pub interface: Option<NetInterface>,
    pub pops: Vec<PopResult>,
    pub tips: Vec<String>,
}

/// Lê o JSON de `ISteamApps/GetSDRConfig` (campo `pops`).
pub fn parse_sdr(json: &str) -> Result<Vec<Pop>> {
    let v: serde_json::Value = serde_json::from_str(json)?;
    let pops = v.get("pops").and_then(|p| p.as_object()).ok_or_else(|| anyhow!("SDR: sem 'pops'"))?;
    let mut out = Vec::new();
    for (code, p) in pops {
        let relays: Vec<Ipv4Addr> = p
            .get("relays")
            .and_then(|r| r.as_array())
            .map(|a| a.iter().filter_map(|r| r.get("ipv4")?.as_str()?.parse().ok()).collect())
            .unwrap_or_default();
        if relays.is_empty() {
            continue;
        }
        let name = p.get("desc").and_then(|d| d.as_str()).unwrap_or(code).to_string();
        out.push(Pop { code: code.clone(), name, relays });
    }
    Ok(out)
}

/// Estatísticas de uma série de pings (`None` = perdido).
pub fn stats(code: &str, name: &str, rtts: &[Option<u32>]) -> PopResult {
    let ok: Vec<u32> = rtts.iter().flatten().copied().collect();
    let sent = rtts.len() as u32;
    let received = ok.len() as u32;
    let avg = (!ok.is_empty()).then(|| ok.iter().map(|&x| x as f64).sum::<f64>() / ok.len() as f64);
    let jitter = (ok.len() > 1).then(|| {
        ok.windows(2).map(|w| (w[1] as f64 - w[0] as f64).abs()).sum::<f64>() / (ok.len() - 1) as f64
    });
    PopResult {
        code: code.into(),
        name: name.into(),
        sent,
        received,
        avg_ms: avg,
        min_ms: ok.iter().min().copied(),
        jitter_ms: jitter,
        loss_pct: if sent == 0 { 0.0 } else { (sent - received) as f64 * 100.0 / sent as f64 },
    }
}

fn probe(p: &Pop) -> PopResult {
    // escolhe o relay que responde (alguns ficam em manutenção)
    let ip = p.relays.iter().take(3).copied().find(|ip| platform::icmp_ping(*ip, TIMEOUT_MS).is_some());
    let Some(ip) = ip else {
        return stats(&p.code, &p.name, &[None; 0]);
    };
    let mut rtts = Vec::with_capacity(PROBES as usize);
    for _ in 0..PROBES {
        rtts.push(platform::icmp_ping(ip, TIMEOUT_MS));
        std::thread::sleep(std::time::Duration::from_millis(60));
    }
    stats(&p.code, &p.name, &rtts)
}

fn tips(iface: &Option<NetInterface>, pops: &[PopResult]) -> Vec<String> {
    let mut t = Vec::new();
    if iface.as_ref().map(|i| i.wifi).unwrap_or(false) {
        t.push(tr!(
            "Você está no Wi-Fi. Cabo de rede é a melhora mais certa: menos variação e menos perda de pacote.",
            "Estás por Wi-Fi. El cable de red es la mejora más segura: menos variación y menos pérdida de paquetes.",
            "You're on Wi-Fi. An Ethernet cable is the surest improvement: less jitter and less packet loss."
        ));
    }
    let answered: Vec<&PopResult> = pops.iter().filter(|p| p.received > 0).collect();
    if answered.is_empty() {
        t.push(tr!(
            "Nenhum relay respondeu ao ping. O roteador, o firewall ou a operadora pode estar bloqueando ping (ICMP); isso não quer dizer que o jogo esteja sem conexão.",
            "Ningún relay respondió al ping. El router, el firewall o el proveedor puede estar bloqueando el ping (ICMP); eso no quiere decir que el juego no tenga conexión.",
            "No relay answered the ping. Your router, firewall or ISP may be blocking ping (ICMP); that doesn't mean the game has no connection."
        ));
        return t;
    }
    let best = answered[0];
    if best.loss_pct >= 2.0 {
        t.push(tr!(
            "Há perda de pacote até o servidor mais próximo. Teste com cabo, reinicie o roteador e, se continuar, mostre este resultado para a operadora.",
            "Hay pérdida de paquetes hasta el servidor más cercano. Prueba con cable, reinicia el router y, si sigue, muéstrale este resultado a tu proveedor.",
            "There's packet loss to the nearest server. Try a cable, restart the router and, if it continues, show this result to your ISP."
        ));
    }
    if best.jitter_ms.unwrap_or(0.0) >= 5.0 {
        t.push(tr!(
            "O ping está variando bastante. Feche downloads, streams e atualizações (Steam, Windows, OneDrive) enquanto joga.",
            "El ping varía bastante. Cierra descargas, streams y actualizaciones (Steam, Windows, OneDrive) mientras juegas.",
            "Your ping is fluctuating a lot. Close downloads, streams and updates (Steam, Windows, OneDrive) while playing."
        ));
    }
    if t.is_empty() {
        t.push(tr!(
            "Conexão estável até o servidor mais próximo. Nada para corrigir aqui.",
            "Conexión estable hasta el servidor más cercano. Nada para corregir acá.",
            "Stable connection to the nearest server. Nothing to fix here."
        ));
    }
    t
}

pub fn run() -> Result<NetReport> {
    let body = platform::https_get("api.steampowered.com", "/ISteamApps/GetSDRConfig/v1/?appid=730")
        .map_err(|e| anyhow!(tr!("não foi possível baixar a lista de servidores da Steam: {e}", "no se pudo descargar la lista de servidores de Steam: {e}", "couldn't download Steam's server list: {e}")))?;
    let pops = parse_sdr(&String::from_utf8_lossy(&body))?;
    let iface = pops.first().and_then(|p| platform::route_interface(p.relays[0]).ok());
    let handles: Vec<_> = pops.into_iter().map(|p| std::thread::spawn(move || probe(&p))).collect();
    let mut results: Vec<PopResult> = handles.into_iter().filter_map(|h| h.join().ok()).collect();
    results.sort_by(|a, b| match (a.avg_ms, b.avg_ms) {
        (Some(x), Some(y)) => x.total_cmp(&y),
        (Some(_), None) => std::cmp::Ordering::Less,
        (None, Some(_)) => std::cmp::Ordering::Greater,
        (None, None) => a.name.cmp(&b.name),
    });
    Ok(NetReport { tips: tips(&iface, &results), interface: iface, pops: results })
}

#[cfg(test)]
mod tests {
    #[test]
    fn parses_sdr_config() {
        let j = r#"{"revision":1,"pops":{"gru":{"desc":"Sao Paulo (Brazil)","relays":[{"ipv4":"155.133.227.4","port_range":[27015,27060]}]},"xyz":{"desc":"No relays"}}}"#;
        let p = super::parse_sdr(j).unwrap();
        assert_eq!(p.len(), 1);
        assert_eq!(p[0].code, "gru");
        assert_eq!(p[0].relays[0].to_string(), "155.133.227.4");
    }

    #[test]
    fn stats_handles_loss_and_jitter() {
        let r = super::stats("gru", "SP", &[Some(10), None, Some(14), Some(12)]);
        assert_eq!(r.received, 3);
        assert_eq!(r.loss_pct, 25.0);
        assert_eq!(r.min_ms, Some(10));
        assert_eq!(r.jitter_ms, Some(3.0));
    }
}
