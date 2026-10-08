//! Limpeza de arquivos temporários. Só apaga em pastas de lixo conhecidas
//! (nunca arquivos do jogo nem documentos). Arquivos em uso são pulados.
//! Limpeza não tem "desfazer" — a interface avisa antes.

use serde::Serialize;
use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime};

#[derive(Debug, Clone, Serialize)]
pub struct CleanTarget {
    pub id: String,
    pub label: String,
    pub description: String,
    pub files: u64,
    pub bytes: u64,
    pub selected_by_default: bool,
    pub warning: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct CleanResult {
    pub freed_bytes: u64,
    pub deleted_files: u64,
    pub skipped_files: u64,
}

struct Def {
    id: &'static str,
    label: &'static str,
    description: &'static str,
    default: bool,
    warning: Option<&'static str>,
    /// só apaga arquivos com mais de X horas (evita mexer em coisas em uso)
    min_age_h: u64,
}

const DEFS: &[Def] = &[
    Def { id: "user_temp", label: "Arquivos temporários do usuário", description: "Sobras de instaladores e programas na pasta %TEMP%.", default: true, warning: None, min_age_h: 24 },
    Def { id: "windows_temp", label: "Arquivos temporários do Windows", description: "Pasta C:\\Windows\\Temp.", default: true, warning: None, min_age_h: 24 },
    Def { id: "crash_dumps", label: "Relatórios de travamento", description: "Despejos de memória e relatórios de erro antigos do Windows.", default: true, warning: None, min_age_h: 24 },
    Def { id: "dx_shader_cache", label: "Cache de shaders do DirectX", description: "O Windows recria sozinho.", default: false, warning: Some("Use só se o jogo estiver engasgando depois de atualizar o driver: as primeiras partidas depois da limpeza ficam mais pesadas enquanto o cache é refeito."), min_age_h: 0 },
    Def { id: "gpu_shader_cache", label: "Cache de shaders da placa de vídeo", description: "Caches da NVIDIA e da AMD. O driver recria sozinho.", default: false, warning: Some("Use só se o jogo estiver engasgando depois de atualizar o driver: as primeiras partidas depois da limpeza ficam mais pesadas enquanto o cache é refeito."), min_age_h: 0 },
];

fn env_path(var: &str) -> Option<PathBuf> {
    std::env::var_os(var).map(PathBuf::from)
}

fn paths_for(id: &str) -> Vec<PathBuf> {
    let local = env_path("LOCALAPPDATA");
    let windir = env_path("WINDIR").unwrap_or_else(|| PathBuf::from(r"C:\Windows"));
    let progdata = env_path("PROGRAMDATA").unwrap_or_else(|| PathBuf::from(r"C:\ProgramData"));
    let mut v = Vec::new();
    match id {
        "user_temp" => v.extend(env_path("TEMP")),
        "windows_temp" => v.push(windir.join("Temp")),
        "crash_dumps" => {
            if let Some(l) = &local {
                v.push(l.join("CrashDumps"));
            }
            v.push(progdata.join(r"Microsoft\Windows\WER\ReportArchive"));
            v.push(progdata.join(r"Microsoft\Windows\WER\ReportQueue"));
        }
        "dx_shader_cache" => {
            if let Some(l) = &local {
                v.push(l.join("D3DSCache"));
            }
        }
        "gpu_shader_cache" => {
            if let Some(l) = &local {
                for p in [r"NVIDIA\DXCache", r"NVIDIA\GLCache", r"AMD\DxCache", r"AMD\DxcCache", r"AMD\VkCache"] {
                    v.push(l.join(p));
                }
            }
        }
        _ => {}
    }
    // trava de segurança: só pastas que existem e têm "temp", "cache", "dump" ou "wer" no caminho
    v.into_iter()
        .filter(|p| p.is_dir())
        .filter(|p| {
            let s = p.display().to_string().to_ascii_lowercase();
            ["temp", "cache", "dump", "\\wer\\"].iter().any(|k| s.contains(k))
        })
        .collect()
}

fn old_enough(meta: &std::fs::Metadata, min_age_h: u64) -> bool {
    if min_age_h == 0 {
        return true;
    }
    meta.modified()
        .ok()
        .and_then(|m| SystemTime::now().duration_since(m).ok())
        .map(|age| age >= Duration::from_secs(min_age_h * 3600))
        .unwrap_or(false)
}

/// Percorre a pasta (sem seguir atalhos/links) chamando `f` em cada arquivo elegível.
fn walk(dir: &Path, min_age_h: u64, depth: u32, f: &mut dyn FnMut(&Path, u64)) {
    if depth > 12 {
        return;
    }
    let Ok(rd) = std::fs::read_dir(dir) else { return };
    for e in rd.flatten() {
        let Ok(ft) = e.file_type() else { continue };
        if ft.is_symlink() {
            continue;
        }
        let p = e.path();
        if ft.is_dir() {
            walk(&p, min_age_h, depth + 1, f);
        } else if let Ok(meta) = e.metadata() {
            if old_enough(&meta, min_age_h) {
                f(&p, meta.len());
            }
        }
    }
}

pub fn scan() -> Vec<CleanTarget> {
    DEFS.iter()
        .map(|d| {
            let (mut files, mut bytes) = (0u64, 0u64);
            for root in paths_for(d.id) {
                walk(&root, d.min_age_h, 0, &mut |_, len| {
                    files += 1;
                    bytes += len;
                });
            }
            CleanTarget {
                id: d.id.into(),
                label: d.label.into(),
                description: d.description.into(),
                files,
                bytes,
                selected_by_default: d.default,
                warning: d.warning.map(String::from),
            }
        })
        .collect()
}

pub fn run(ids: &[String]) -> CleanResult {
    let mut r = CleanResult { freed_bytes: 0, deleted_files: 0, skipped_files: 0 };
    for d in DEFS.iter().filter(|d| ids.iter().any(|i| i == d.id)) {
        for root in paths_for(d.id) {
            walk(&root, d.min_age_h, 0, &mut |p, len| match std::fs::remove_file(p) {
                Ok(_) => {
                    r.freed_bytes += len;
                    r.deleted_files += 1;
                }
                Err(_) => r.skipped_files += 1, // em uso ou sem permissão
            });
        }
    }
    r
}
