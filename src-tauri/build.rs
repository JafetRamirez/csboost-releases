fn main() {
    // REGRA Nº 1 DO CSBOOST: nunca causar VAC ban. Ver vac_guard() abaixo.
    vac_guard();

    // Release: pede administrador (UAC) ao abrir — necessário para HKLM,
    // plano de energia e ponto de restauração.
    // Dev: roda sem elevação para o `tauri dev` funcionar num terminal comum
    // (abra o terminal como administrador para testar as escritas em HKLM).
    let release = std::env::var("PROFILE").map(|p| p == "release").unwrap_or(false);
    let manifest = if release {
        include_str!("windows-app-admin.manifest")
    } else {
        include_str!("windows-app.manifest")
    };
    let attrs = tauri_build::Attributes::new()
        .windows_attributes(tauri_build::WindowsAttributes::new().app_manifest(manifest));
    tauri_build::try_build(attrs).expect("falha no tauri-build");
}

// ---------------------------------------------------------------------------
// VAC GUARD — a compilação FALHA se o código usar qualquer API capaz de
// interagir com o processo de outro programa (abrir handle, ler/escrever
// memória, injetar thread/DLL, hooks globais, depuração).
//
// O CSBoost só mexe no WINDOWS (registro, energia, monitor) e em arquivos de
// CONFIGURAÇÃO do usuário. Ele nunca encosta no cs2.exe.
//
// Não remova itens desta lista. Se um recurso novo "precisa" de uma destas
// APIs, o recurso está errado — procure outro caminho (ex.: prioridade do
// jogo via registro do Windows em vez de abrir o processo).
// ---------------------------------------------------------------------------

const FORBIDDEN_APIS: &[&str] = &[
    // acesso ao processo de outro programa
    "OpenProcess",
    "NtOpenProcess",
    "ZwOpenProcess",
    "DuplicateHandle",
    // leitura/escrita de memória alheia
    "ReadProcessMemory",
    "WriteProcessMemory",
    "NtReadVirtualMemory",
    "NtWriteVirtualMemory",
    "VirtualAllocEx",
    "VirtualProtectEx",
    "VirtualQueryEx",
    // injeção de código/threads
    "CreateRemoteThread",
    "CreateRemoteThreadEx",
    "NtCreateThreadEx",
    "RtlCreateUserThread",
    "QueueUserAPC",
    "NtQueueApcThread",
    "SetThreadContext",
    "OpenThread",
    // hooks e depuração
    "SetWindowsHookEx",
    "SetWindowsHookExA",
    "SetWindowsHookExW",
    "SetWinEventHook",
    "DebugActiveProcess",
    "NtDebugActiveProcess",
    // módulos de outro processo
    "EnumProcessModules",
    "EnumProcessModulesEx",
    "Module32First",
    "Module32FirstW",
    "Module32Next",
    "Module32NextW",
    "TH32CS_SNAPMODULE",
    "TH32CS_SNAPTHREAD",
    // crates de manipulação de memória/injeção
    "dll_syringe",
    "process_memory",
    "detour",
    "retour",
    "minhook",
];

fn is_ident_char(c: char) -> bool {
    c.is_ascii_alphanumeric() || c == '_'
}

/// Procura `word` como identificador inteiro (OpenProcessToken não conta
/// como OpenProcess).
fn contains_word(line: &str, word: &str) -> bool {
    let mut start = 0;
    while let Some(pos) = line[start..].find(word) {
        let i = start + pos;
        let before = line[..i].chars().next_back();
        let after = line[i + word.len()..].chars().next();
        if !before.map(is_ident_char).unwrap_or(false) && !after.map(is_ident_char).unwrap_or(false) {
            return true;
        }
        start = i + word.len();
    }
    false
}

fn scan_dir(dir: &std::path::Path, ext: &[&str], files: &mut Vec<std::path::PathBuf>) {
    let Ok(rd) = std::fs::read_dir(dir) else { return };
    for e in rd.flatten() {
        let p = e.path();
        if p.is_dir() {
            scan_dir(&p, ext, files);
        } else if p.extension().and_then(|x| x.to_str()).map(|x| ext.contains(&x)).unwrap_or(false) {
            files.push(p);
        }
    }
}

fn vac_guard() {
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"));
    let mut problems = Vec::new();

    // 1) Código Rust: nenhuma API proibida (comentários são ignorados).
    // diretórios inteiros: arquivo novo também dispara a verificação
    println!("cargo:rerun-if-changed=src");
    println!("cargo:rerun-if-changed=../src");
    let mut rs = Vec::new();
    scan_dir(&root.join("src"), &["rs"], &mut rs);
    for f in &rs {
        println!("cargo:rerun-if-changed={}", f.display());
        let src = std::fs::read_to_string(f).unwrap_or_default();
        for (n, raw) in src.lines().enumerate() {
            let line = raw.split("//").next().unwrap_or("");
            for api in FORBIDDEN_APIS {
                if contains_word(line, api) {
                    problems.push(format!("{}:{}  usa `{}`", f.display(), n + 1, api));
                }
            }
        }
    }

    // 2) Dependências: nenhuma crate de injeção/memória.
    let cargo_toml = std::fs::read_to_string(root.join("Cargo.toml")).unwrap_or_default();
    println!("cargo:rerun-if-changed=Cargo.toml");
    for line in cargo_toml.lines() {
        let line = line.split('#').next().unwrap_or("");
        for c in ["dll-syringe", "process-memory", "detour", "retour", "minhook", "injrs", "memflow"] {
            if line.trim_start().starts_with(c) {
                problems.push(format!("Cargo.toml  depende de `{c}`"));
            }
        }
    }

    // 3) Interface: nenhuma opção de inicialização que desligue o Trusted Mode.
    let mut ui = Vec::new();
    scan_dir(&root.join("..").join("src"), &["ts", "tsx"], &mut ui);
    for f in &ui {
        println!("cargo:rerun-if-changed={}", f.display());
        let src = std::fs::read_to_string(f).unwrap_or_default();
        for (n, line) in src.lines().enumerate() {
            let l = line.to_ascii_lowercase();
            // texto explicativo pode citar a opção; constantes de launch options não
            if l.contains("allow_third_party_software") && (l.contains("launch") || l.contains("options =") || l.contains("const ")) {
                problems.push(format!("{}:{}  launch option com -allow_third_party_software", f.display(), n + 1));
            }
        }
    }

    // 4) Catálogo: nenhuma ação fora dos tipos seguros conhecidos.
    let catalog = std::fs::read_to_string(root.join("..").join("catalog").join("tweaks.json")).unwrap_or_default();
    println!("cargo:rerun-if-changed=../catalog/tweaks.json");
    for (n, line) in catalog.lines().enumerate() {
        if let Some(i) = line.find("\"type\"") {
            let rest = &line[i..];
            let ok = ["\"registry\"", "\"power_plan\"", "\"cs2_gpu_preference\""].iter().any(|t| rest.contains(t));
            if !ok {
                problems.push(format!("catalog/tweaks.json:{}  tipo de ação não aprovado", n + 1));
            }
        }
    }

    // 5) Configs de pros: opções de inicialização exibidas nunca desligam o Trusted Mode.
    let pros = std::fs::read_to_string(root.join("..").join("catalog").join("pros.json")).unwrap_or_default();
    println!("cargo:rerun-if-changed=../catalog/pros.json");
    for (n, line) in pros.lines().enumerate() {
        if line.contains("\"launch_options\"") && line.contains("allow_third_party_software") {
            problems.push(format!("catalog/pros.json:{}  launch option com -allow_third_party_software", n + 1));
        }
    }

    if !problems.is_empty() {
        panic!(
            "\n\n=== VAC GUARD: compilação bloqueada ===\n\
             O CSBoost nunca pode arriscar VAC ban dos usuários.\n\
             Encontrado:\n  {}\n\
             Leia CLAUDE.md / README (seção Regra nº 1) antes de continuar.\n\n",
            problems.join("\n  ")
        );
    }
}
