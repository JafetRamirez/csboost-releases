// Dados de exemplo usados só fora do app (pré-visualização no navegador).
import catalog from "../../catalog/tweaks.json";
import type { BatchResult, BenchRun, CleanResult, CleanTarget, Cs2Info, EntryCheck, JournalEntry, Report, TweakView } from "./types";

const state: Record<string, { applied: boolean; managed: boolean }> = {};
const journal: JournalEntry[] = [];
let displayHz = 60;

for (const t of catalog.tweaks) {
  state[t.id] = { applied: t.id === "gamemode.enable", managed: false };
}

export function tweaks(): TweakView[] {
  return catalog.tweaks.map((t) => {
    const s = state[t.id];
    return {
      ...(t as unknown as TweakView),
      laptop_warning: (t as { laptop_warning?: boolean }).laptop_warning ?? false,
      min_build: (t as { min_build?: number }).min_build ?? null,
      state: s.applied ? "applied" : "not_applied",
      managed: s.managed,
      supported: true,
      unsupported_reason: null,
    };
  });
}

export function apply(ids: string[]): BatchResult {
  let reboot = false;
  const results = ids.map((id) => {
    const t = catalog.tweaks.find((x) => x.id === id)!;
    if (state[id].applied) return { tweak_id: id, ok: true, skipped: true, message: "Já estava ativo no sistema" };
    state[id] = { applied: true, managed: true };
    if (t.requires_reboot) reboot = true;
    journal.unshift({ id: Date.now() + Math.random(), tweak_id: id, title: t.title, applied_at: Date.now(), reverted_at: null, changes: [] });
    return { tweak_id: id, ok: true, skipped: false, message: null };
  });
  return { results, needs_reboot: reboot };
}

export function revert(ids: string[]): BatchResult {
  const results = ids.map((id) => {
    if (state[id]) state[id] = { applied: false, managed: false };
    const e = journal.find((j) => j.tweak_id === id && !j.reverted_at);
    if (e) e.reverted_at = Date.now();
    return { tweak_id: id, ok: true, skipped: false, message: null };
  });
  return { results, needs_reboot: false };
}

export function revertAll(): BatchResult {
  return revert(journal.filter((j) => !j.reverted_at).map((j) => j.tweak_id));
}

export function history(): JournalEntry[] {
  return journal;
}

export function fixDisplay(_device: string, hz: number) {
  displayHz = hz;
  journal.unshift({ id: Date.now(), tweak_id: "display.refresh", title: `Monitor em ${hz} Hz`, applied_at: Date.now(), reverted_at: null, changes: [] });
}

export function saveAutoexec(_content: string) {
  journal.unshift({ id: Date.now(), tweak_id: "cs2.autoexec", title: "Autoexec do CS2", applied_at: Date.now(), reverted_at: null, changes: [] });
  return "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg\\autoexec.cfg";
}

export function report(): Report {
  const issues: Report["issues"] = [];
  if (displayHz < 165)
    issues.push({
      id: "display.\\\\.\\DISPLAY1",
      severity: "critical",
      title: `Monitor em ${displayHz} Hz — ele aguenta 165 Hz`,
      detail: "AOC 24G2 está rodando abaixo do que suporta. Você está vendo menos quadros do que o PC gera. É a correção com maior efeito na fluidez.",
      fix: { kind: "display_refresh", device: "\\\\.\\DISPLAY1", hz: 165 },
    });
  if (!state["power.high_performance"].applied)
    issues.push({
      id: "power.plan",
      severity: "warning",
      title: "Plano de energia Equilibrado",
      detail: "O Equilibrado reduz o clock quando acha que não precisa, o que pode causar quedas de FPS em momentos de ação.",
      fix: { kind: "tweak", tweak_id: "power.high_performance" },
    });
  issues.push({
    id: "ram.xmp",
    severity: "warning",
    title: "Memória DDR4 a 2666 MT/s — provavelmente sem XMP/EXPO",
    detail: "Pentes de memória gamer vêm de fábrica numa velocidade básica. Ativar o perfil XMP (Intel) ou EXPO (AMD) na BIOS costuma dar ganho real no CS2.",
    fix: {
      kind: "guide",
      steps: [
        "Reinicie o PC e entre na BIOS (geralmente tecla Del ou F2 ao ligar).",
        "Procure por XMP, EXPO, D.O.C.P ou A-XMP (na aba AI Tweaker, OC ou Extreme Tweaker).",
        "Ative o Perfil 1, salve (F10) e reinicie.",
        "Se o PC não ligar, ele volta sozinho ao padrão após algumas tentativas.",
      ],
    },
  });
  if (!state["gamedvr.disable"].applied)
    issues.push({
      id: "gamedvr",
      severity: "warning",
      title: "Gravação em segundo plano ligada",
      detail: "O Windows pode estar gravando o jogo continuamente, gastando GPU e disco.",
      fix: { kind: "tweak", tweak_id: "gamedvr.disable" },
    });
  const penalty = issues.reduce((s, i) => s + (i.severity === "critical" ? 18 : i.severity === "warning" ? 8 : 2), 0);
  return {
    score: Math.max(0, 100 - penalty),
    elevated: true,
    hardware: {
      os_name: "Microsoft Windows 11 Pro",
      os_build: 26100,
      cpu: "AMD Ryzen 5 5600",
      cpu_cores: 6,
      cpu_threads: 12,
      gpus: [{ name: "NVIDIA GeForce RTX 3060", driver_version: "32.0.15.6614", driver_date: "2026-08-12" }],
      ram_modules: [
        { capacity_gb: 8, rated_mts: 3200, configured_mts: 2666, smbios_type: 26 },
        { capacity_gb: 8, rated_mts: 3200, configured_mts: 2666, smbios_type: 26 },
      ],
      disk_free_gb: 182,
      disk_total_gb: 476,
    },
    displays: [{ device: "\\\\.\\DISPLAY1", name: "AOC 24G2", primary: true, width: 1920, height: 1080, current_hz: displayHz, max_hz: 165 }],
    power: { has_battery: false, on_ac: true },
    power_plan: { guid: null, name: state["power.high_performance"].applied ? "Alto desempenho" : "Equilibrado" },
    cs2_found: true,
    issues,
    checks_passed: ["16 GB de RAM", "Driver de vídeo recente (NVIDIA GeForce RTX 3060)", "CS2 encontrado"],
  };
}

export function cs2(): Cs2Info {
  return {
    steam_found: true,
    steam_path: "C:\\Program Files (x86)\\Steam",
    found: true,
    install_dir: "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive",
    exe_path: "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\bin\\win64\\cs2.exe",
    cfg_dir: "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg",
    autoexec: null,
    users: [{ id3: "84512377", persona: "jafet", launch_options: "-novid -high", most_recent: true }],
    steam_running: true,
    cs2_running: false,
  };
}

export function verify(): EntryCheck[] {
  const base: EntryCheck[] = [
    {
      entry_id: 3, tweak_id: "timer.global_requests", title: "Resolução de timer global (Windows 11)", applied_at: Date.now() - 3600_000,
      status: "pending_reboot", how_to_check: "Efeito interno do kernel; só vale depois de reiniciar o PC.",
      checks: [{ label: "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\\GlobalTimerResolutionRequests", before: "não existia", expected: "1", now: "1", status: "pending_reboot" }],
    },
    {
      entry_id: 2, tweak_id: "power.high_performance", title: "Plano de energia de alto desempenho", applied_at: Date.now() - 7200_000,
      status: "ok", how_to_check: "Painel de Controle › Hardware e Sons › Opções de Energia — o plano marcado é o ativo.",
      checks: [{ label: "Plano de energia ativo", before: "Personalizado (d1e5a0cb)", expected: "Alto desempenho", now: "Alto desempenho", status: "ok" }],
    },
    {
      entry_id: 1, tweak_id: "gamedvr.disable", title: "Desativar gravação em segundo plano", applied_at: Date.now() - 7300_000,
      status: "ok", how_to_check: "Configurações › Jogos › Capturas — 'Gravar o que aconteceu' fica desligado.",
      checks: [
        { label: "HKCU\\System\\GameConfigStore\\GameDVR_Enabled", before: "1", expected: "0", now: "0", status: "ok" },
        { label: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR\\AppCaptureEnabled", before: "não existia", expected: "0", now: "0", status: "ok" },
      ],
    },
  ];
  return base;
}

// ---- benchmark (exemplo)
function fakeSeries(base: number, spikes: number): number[] {
  return Array.from({ length: 480 }, (_, i) => {
    const wave = Math.sin(i / 17) * 0.4 + Math.sin(i / 5) * 0.2;
    const spike = i % Math.round(480 / spikes) === 7 ? base * 2.6 : 0;
    return +(base + wave + spike).toFixed(2);
  });
}
let benchRuns: BenchRun[] = [
  { id: 1, label: "Antes", created_at: Date.now() - 86400000, seconds: 60, frames: 9120, avg_fps: 152.3, low1_fps: 104.8, low01_fps: 81.2, p50_ms: 6.4, p99_ms: 9.8, stutter_pct: 1.9, series: fakeSeries(6.6, 14) },
  { id: 2, label: "Depois", created_at: Date.now() - 3600000, seconds: 60, frames: 10930, avg_fps: 182.1, low1_fps: 141.6, low01_fps: 118.0, p50_ms: 5.4, p99_ms: 7.1, stutter_pct: 0.6, series: fakeSeries(5.5, 5) },
];
export function benchList() { return benchRuns; }
export function benchDelete(id: number) { benchRuns = benchRuns.filter((r) => r.id !== id); }
export function benchRun(seconds: number, label: string): BenchRun {
  const r = { ...benchRuns[benchRuns.length - 1], id: Date.now(), label, seconds, created_at: Date.now() };
  benchRuns = [...benchRuns, r];
  return r;
}

// ---- limpeza (exemplo)
export function cleanupScan(): CleanTarget[] {
  return [
    { id: "user_temp", label: "Arquivos temporários do usuário", description: "Sobras de instaladores e programas na pasta %TEMP%.", files: 1834, bytes: 2_412_000_000, selected_by_default: true, warning: null },
    { id: "windows_temp", label: "Arquivos temporários do Windows", description: "Pasta C:\\Windows\\Temp.", files: 212, bytes: 380_000_000, selected_by_default: true, warning: null },
    { id: "crash_dumps", label: "Relatórios de travamento", description: "Despejos de memória e relatórios de erro antigos do Windows.", files: 9, bytes: 96_000_000, selected_by_default: true, warning: null },
    { id: "dx_shader_cache", label: "Cache de shaders do DirectX", description: "O Windows recria sozinho.", files: 640, bytes: 512_000_000, selected_by_default: false, warning: "Use só se o jogo estiver engasgando depois de atualizar o driver." },
    { id: "gpu_shader_cache", label: "Cache de shaders da placa de vídeo", description: "Caches da NVIDIA e da AMD. O driver recria sozinho.", files: 310, bytes: 1_020_000_000, selected_by_default: false, warning: "Use só se o jogo estiver engasgando depois de atualizar o driver." },
  ];
}
export function cleanupRun(ids: string[]): CleanResult {
  const t = cleanupScan().filter((x) => ids.includes(x.id));
  return { freed_bytes: t.reduce((s, x) => s + x.bytes * 0.92, 0), deleted_files: t.reduce((s, x) => s + x.files, 0) - 14, skipped_files: 14 };
}
