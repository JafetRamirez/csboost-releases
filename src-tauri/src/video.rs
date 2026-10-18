//! Presets de vídeo do CS2 (ROADMAP #8).
//!
//! O CS2 guarda as opções do menu Vídeo em
//! `Steam\userdata\<conta>\730\local\cfg\cs2_video.txt`. O CSBoost só troca o
//! valor de chaves que JÁ existem nesse arquivo, só com o jogo fechado, e guarda
//! o conteúdo anterior no Histórico (dá para desfazer). É o mesmo arquivo que o
//! próprio jogo grava quando você muda o vídeo no menu. Ver CLAUDE.md.

use crate::journal::Change;
use crate::{cs2, engine, platform};
use anyhow::{anyhow, bail, Result};
use serde::Serialize;
use std::path::PathBuf;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Preset {
    MaxFps,
    Balanced,
    Visibility,
}

impl Preset {
    pub fn from_id(s: &str) -> Option<Preset> {
        match s {
            "max_fps" => Some(Preset::MaxFps),
            "balanced" => Some(Preset::Balanced),
            "visibility" => Some(Preset::Visibility),
            _ => None,
        }
    }

    pub fn name(self) -> String {
        match self {
            Preset::MaxFps => tr!("FPS máximo", "FPS máximo", "Max FPS"),
            Preset::Balanced => tr!("Equilibrado", "Equilibrado", "Balanced"),
            Preset::Visibility => tr!("Visibilidade", "Visibilidad", "Visibility"),
        }
    }

    /// Valores do menu Vídeo. Sombras dinâmicas ficam em "Todas" nos três: ver a
    /// sombra do inimigo é vantagem. Reflex (r_low_latency) ligado nos três.
    pub fn values(self) -> &'static [(&'static str, &'static str)] {
        match self {
            Preset::MaxFps => &[
                ("setting.shaderquality", "0"),
                ("setting.msaa_samples", "0"),
                ("setting.r_csgo_cmaa_enable", "0"),
                ("setting.videocfg_shadow_quality", "0"),
                ("setting.videocfg_dynamic_shadows", "1"),
                ("setting.videocfg_texture_detail", "0"),
                ("setting.videocfg_particle_detail", "0"),
                ("setting.videocfg_ao_detail", "0"),
                ("setting.videocfg_hdr_detail", "3"),
                ("setting.videocfg_fsr_detail", "0"),
                ("setting.r_texturefilteringquality", "0"),
                ("setting.r_low_latency", "1"),
                ("setting.mat_vsync", "0"),
            ],
            Preset::Balanced => &[
                ("setting.shaderquality", "0"),
                ("setting.msaa_samples", "2"),
                ("setting.r_csgo_cmaa_enable", "0"),
                ("setting.videocfg_shadow_quality", "1"),
                ("setting.videocfg_dynamic_shadows", "1"),
                ("setting.videocfg_texture_detail", "1"),
                ("setting.videocfg_particle_detail", "0"),
                ("setting.videocfg_ao_detail", "0"),
                ("setting.videocfg_hdr_detail", "3"),
                ("setting.videocfg_fsr_detail", "0"),
                ("setting.r_texturefilteringquality", "3"),
                ("setting.r_low_latency", "1"),
                ("setting.mat_vsync", "0"),
            ],
            Preset::Visibility => &[
                ("setting.shaderquality", "0"),
                ("setting.msaa_samples", "4"),
                ("setting.r_csgo_cmaa_enable", "0"),
                ("setting.videocfg_shadow_quality", "2"),
                ("setting.videocfg_dynamic_shadows", "1"),
                ("setting.videocfg_texture_detail", "1"),
                ("setting.videocfg_particle_detail", "0"),
                ("setting.videocfg_ao_detail", "0"),
                ("setting.videocfg_hdr_detail", "3"),
                ("setting.videocfg_fsr_detail", "0"),
                ("setting.r_texturefilteringquality", "5"),
                ("setting.r_low_latency", "1"),
                ("setting.mat_vsync", "0"),
            ],
        }
    }
}

const ALL: [Preset; 3] = [Preset::MaxFps, Preset::Balanced, Preset::Visibility];

/// Lê os pares "chave" "valor" do arquivo.
pub fn parse(src: &str) -> Vec<(String, String)> {
    src.lines()
        .filter_map(|l| {
            let p: Vec<&str> = l.split('"').collect();
            (p.len() >= 5 && p[0].trim().is_empty()).then(|| (p[1].to_string(), p[3].to_string()))
        })
        .collect()
}

/// Troca o valor só das chaves que já existem, preservando o resto do arquivo
/// (ordem, tabulação, quebras de linha). Devolve o texto novo e quantas mudaram.
pub fn set_values(src: &str, values: &[(&str, &str)]) -> (String, usize) {
    let mut changed = 0;
    let out: Vec<String> = src
        .split_inclusive('\n')
        .map(|line| {
            let mut p: Vec<String> = line.split('"').map(|s| s.to_string()).collect();
            if p.len() >= 5 && p[0].trim().is_empty() {
                if let Some((_, v)) = values.iter().find(|(k, _)| *k == p[1]) {
                    if p[3] != *v {
                        p[3] = v.to_string();
                        changed += 1;
                    }
                }
            }
            p.join("\"")
        })
        .collect();
    (out.concat(), changed)
}

/// Qual preset bate com o arquivo (olhando só as chaves que existem nele).
pub fn detect(pairs: &[(String, String)]) -> Option<Preset> {
    ALL.into_iter().find(|p| {
        let mut seen = 0;
        let ok = p.values().iter().all(|(k, v)| match pairs.iter().find(|(pk, _)| pk == k) {
            Some((_, pv)) => {
                seen += 1;
                pv == v
            }
            None => true,
        });
        ok && seen >= 3
    })
}

#[derive(Debug, Clone, Serialize)]
pub struct VideoFile {
    pub id3: String,
    pub persona: Option<String>,
    pub path: String,
    pub preset: Option<Preset>,
    pub resolution: Option<String>,
}

fn video_path(steam: &std::path::Path, id3: &str) -> PathBuf {
    steam.join("userdata").join(id3).join("730").join("local").join("cfg").join("cs2_video.txt")
}

pub fn files() -> Vec<VideoFile> {
    let Some(steam) = cs2::steam_path() else { return Vec::new() };
    cs2::users(&steam)
        .into_iter()
        .filter_map(|u| {
            let path = video_path(&steam, &u.id3);
            let src = std::fs::read_to_string(&path).ok()?;
            let pairs = parse(&src);
            let get = |k: &str| pairs.iter().find(|(pk, _)| pk == k).map(|(_, v)| v.clone());
            let resolution = match (get("setting.defaultres"), get("setting.defaultresheight")) {
                (Some(w), Some(h)) => Some(format!("{w}×{h}")),
                _ => None,
            };
            Some(VideoFile { id3: u.id3, persona: u.persona, path: path.display().to_string(), preset: detect(&pairs), resolution })
        })
        .collect()
}

#[derive(Debug, Clone, Serialize)]
pub struct ApplyResult {
    pub files: usize,
    pub changed: usize,
}

pub fn apply(preset: &str) -> Result<ApplyResult> {
    let preset = Preset::from_id(preset).ok_or_else(|| anyhow!("preset desconhecido: {preset}"))?;
    if !platform::pids_named("cs2.exe").is_empty() {
        bail!(tr!(
            "Feche o CS2 antes: o jogo regrava as opções de vídeo quando fecha.",
            "Cierra CS2 antes: el juego vuelve a guardar las opciones de video al cerrarse.",
            "Close CS2 first: the game rewrites its video settings when it exits."
        ));
    }
    let list = files();
    if list.is_empty() {
        bail!(tr!(
            "Não achamos as opções de vídeo do CS2. Abra o jogo uma vez, feche e tente de novo.",
            "No encontramos las opciones de video de CS2. Abre el juego una vez, ciérralo e inténtalo de nuevo.",
            "We couldn't find CS2's video settings. Open the game once, close it and try again."
        ));
    }
    let mut changed = 0;
    for f in &list {
        let src = std::fs::read_to_string(&f.path)?;
        let (new, n) = set_values(&src, preset.values());
        if n == 0 {
            continue;
        }
        std::fs::write(&f.path, &new)?;
        changed += n;
        let name = preset.name();
        engine::record_external(
            &format!("cs2.video.{}", f.id3),
            &tr!("Vídeo do CS2: {name}", "Video de CS2: {name}", "CS2 video: {name}"),
            Change::File { path: f.path.clone(), previous: Some(src) },
        )?;
    }
    Ok(ApplyResult { files: list.len(), changed })
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE: &str = "\"video.cfg\"\r\n{\r\n\t\"setting.defaultres\"\t\t\"1280\"\r\n\t\"setting.msaa_samples\"\t\t\"4\"\r\n\t\"setting.videocfg_shadow_quality\"\t\t\"2\"\r\n\t\"setting.r_texturefilteringquality\"\t\t\"5\"\r\n\t\"setting.r_low_latency\"\t\t\"1\"\r\n\t\"setting.mat_vsync\"\t\t\"1\"\r\n}\r\n";

    #[test]
    fn only_existing_keys_change_and_format_is_kept() {
        let (out, n) = set_values(SAMPLE, Preset::MaxFps.values());
        assert_eq!(n, 4); // msaa, sombra, filtro, vsync
        assert!(out.contains("\t\"setting.msaa_samples\"\t\t\"0\"\r\n"));
        assert!(out.contains("\"setting.defaultres\"\t\t\"1280\""));
        assert!(!out.contains("videocfg_texture_detail")); // não cria chave nova
        assert_eq!(out.matches("\r\n").count(), SAMPLE.matches("\r\n").count());
    }

    #[test]
    fn detects_preset_after_apply() {
        let (out, _) = set_values(SAMPLE, Preset::Visibility.values());
        assert_eq!(detect(&parse(&out)), Some(Preset::Visibility));
        assert_eq!(detect(&parse(SAMPLE)), None);
    }
}
