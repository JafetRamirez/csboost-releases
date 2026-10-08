//! Benchmark: mede FPS médio, 1% low e 0,1% low do CS2 usando o PresentMon
//! (ferramenta oficial e aberta da Intel). O PresentMon lê os eventos de
//! apresentação de quadros do próprio Windows (ETW) — o CSBoost não encosta
//! no processo do jogo.

use crate::journal::{data_dir, now_ms};
use crate::platform;
use anyhow::{anyhow, bail, Context, Result};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{Duration, Instant};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BenchRun {
    pub id: u64,
    pub label: String,
    pub created_at: u64,
    pub seconds: u32,
    pub frames: u64,
    pub avg_fps: f64,
    pub low1_fps: f64,
    pub low01_fps: f64,
    pub p50_ms: f64,
    pub p99_ms: f64,
    /// % de quadros que demoraram mais que 2× a mediana (engasgos).
    pub stutter_pct: f64,
    /// Frametimes reduzidos para o gráfico (pico de cada trecho, em ms).
    pub series: Vec<f32>,
}

fn store_path() -> PathBuf {
    data_dir().join("benchmarks.json")
}

pub fn list() -> Vec<BenchRun> {
    std::fs::read_to_string(store_path())
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save(runs: &[BenchRun]) -> Result<()> {
    std::fs::create_dir_all(data_dir())?;
    std::fs::write(store_path(), serde_json::to_vec_pretty(runs)?)?;
    Ok(())
}

pub fn delete(id: u64) -> Result<()> {
    let mut runs = list();
    runs.retain(|r| r.id != id);
    save(&runs)
}

/// Calcula as estatísticas a partir dos frametimes (ms).
pub fn stats(frametimes: &[f64]) -> Option<(f64, f64, f64, f64, f64, f64)> {
    if frametimes.len() < 10 {
        return None;
    }
    let total: f64 = frametimes.iter().sum();
    let avg_fps = 1000.0 * frametimes.len() as f64 / total;
    let mut sorted = frametimes.to_vec();
    sorted.sort_by(|a, b| b.partial_cmp(a).unwrap()); // do mais lento para o mais rápido
    let worst_avg = |pct: f64| {
        let n = ((sorted.len() as f64 * pct).ceil() as usize).max(1);
        let mean = sorted[..n].iter().sum::<f64>() / n as f64;
        1000.0 / mean
    };
    let low1 = worst_avg(0.01);
    let low01 = worst_avg(0.001);
    let mut asc = frametimes.to_vec();
    asc.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let pct = |p: f64| asc[((asc.len() - 1) as f64 * p).round() as usize];
    let p50 = pct(0.5);
    let p99 = pct(0.99);
    let stutter = frametimes.iter().filter(|&&f| f > 2.0 * p50).count() as f64 / frametimes.len() as f64 * 100.0;
    Some((avg_fps, low1, low01, p50, p99, stutter))
}

fn downsample(frametimes: &[f64], points: usize) -> Vec<f32> {
    if frametimes.len() <= points {
        return frametimes.iter().map(|&f| f as f32).collect();
    }
    let chunk = frametimes.len() as f64 / points as f64;
    (0..points)
        .map(|i| {
            let a = (i as f64 * chunk) as usize;
            let b = (((i + 1) as f64 * chunk) as usize).min(frametimes.len());
            frametimes[a..b].iter().cloned().fold(0.0, f64::max) as f32
        })
        .collect()
}

/// Lê o CSV do PresentMon (--v1_metrics) e devolve os frametimes do cs2.exe.
pub fn parse_csv(text: &str) -> Result<Vec<f64>> {
    let mut lines = text.lines();
    let header: Vec<&str> = lines.next().ok_or_else(|| anyhow!("CSV vazio"))?.split(',').collect();
    let col = |name: &str| header.iter().position(|h| h.trim().eq_ignore_ascii_case(name));
    let ft = col("MsBetweenPresents").ok_or_else(|| anyhow!("coluna MsBetweenPresents ausente"))?;
    let app = col("Application");
    let mut out = Vec::new();
    for line in lines {
        let cells: Vec<&str> = line.split(',').collect();
        if let Some(a) = app {
            if !cells.get(a).map(|s| s.trim().eq_ignore_ascii_case("cs2.exe")).unwrap_or(false) {
                continue;
            }
        }
        if let Some(v) = cells.get(ft).and_then(|s| s.trim().parse::<f64>().ok()) {
            if v > 0.0 && v < 1000.0 {
                out.push(v);
            }
        }
    }
    Ok(out)
}

pub fn run(presentmon: &Path, seconds: u32, label: &str) -> Result<BenchRun> {
    if !presentmon.exists() {
        bail!("PresentMon não encontrado na instalação do CSBoost");
    }
    if !platform::processes_running(&["cs2.exe"])[0] {
        bail!("Abra o CS2 e entre numa partida ou mapa antes de medir");
    }
    let seconds = seconds.clamp(15, 180);
    std::fs::create_dir_all(data_dir())?;
    let csv = data_dir().join(format!("bench-{}.csv", now_ms()));

    let mut cmd = Command::new(presentmon);
    cmd.args([
        "--process_name",
        "cs2.exe",
        "--output_file",
        &csv.display().to_string(),
        "--v1_metrics",
        "--timed",
        &seconds.to_string(),
        "--terminate_after_timed",
        "--terminate_on_proc_exit",
        "--no_console_stats",
        "--session_name",
        "CSBoost",
        "--stop_existing_session",
    ]);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
    }
    let mut child = cmd.spawn().context("não foi possível iniciar o PresentMon")?;
    let deadline = Instant::now() + Duration::from_secs(seconds as u64 + 30);
    loop {
        if child.try_wait()?.is_some() {
            break;
        }
        if Instant::now() > deadline {
            let _ = child.kill(); // processo filho do próprio CSBoost
            bail!("a medição passou do tempo e foi cancelada");
        }
        std::thread::sleep(Duration::from_millis(250));
    }

    let text = std::fs::read_to_string(&csv).context("o PresentMon não gerou resultado")?;
    let _ = std::fs::remove_file(&csv);
    let frames = parse_csv(&text)?;
    if frames.len() < 100 {
        bail!("Poucos quadros capturados. Deixe o CS2 em foco, jogando, durante toda a medição");
    }
    let (avg_fps, low1, low01, p50, p99, stutter) = stats(&frames).ok_or_else(|| anyhow!("dados insuficientes"))?;
    let run = BenchRun {
        id: now_ms(),
        label: label.trim().chars().take(40).collect(),
        created_at: now_ms(),
        seconds,
        frames: frames.len() as u64,
        avg_fps,
        low1_fps: low1,
        low01_fps: low01,
        p50_ms: p50,
        p99_ms: p99,
        stutter_pct: stutter,
        series: downsample(&frames, 480),
    };
    let mut runs = list();
    runs.push(run.clone());
    save(&runs)?;
    Ok(run)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn stats_basic() {
        let mut ft = vec![4.0; 990];
        ft.extend(vec![20.0; 10]);
        let (avg, low1, _, p50, _, st) = stats(&ft).unwrap();
        assert!((avg - 1000.0 / 4.16).abs() < 0.5);
        assert!((low1 - 50.0).abs() < 0.01);
        assert_eq!(p50, 4.0);
        assert!((st - 1.0).abs() < 0.01);
    }

    #[test]
    fn parses_v1_csv() {
        let csv = "Application,ProcessID,MsBetweenPresents\ncs2.exe,1,4.1\nsteam.exe,2,16\ncs2.exe,1,3.9\n";
        assert_eq!(parse_csv(csv).unwrap(), vec![4.1, 3.9]);
    }
}
