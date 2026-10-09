// Dados de exemplo usados só fora do app (pré-visualização no navegador).
import catalogRaw from "../../catalog/tweaks.json";
import type { BatchResult, BenchRun, CleanResult, CleanTarget, Cs2Info, EntryCheck, GpuInUse, JournalEntry, NetReport, Report, TweakView } from "./types";
import { getLang } from "../i18n";

// Mesmo comportamento do núcleo: textos do catálogo no idioma atual.
type RawTweak = (typeof catalogRaw.tweaks)[number] & { i18n?: Record<string, { title?: string; description?: string; how_to_check?: string }> };
const catalog = {
  get tweaks() {
    const l = getLang();
    return (catalogRaw.tweaks as RawTweak[]).map((t) => (l === "pt" || !t.i18n?.[l] ? t : { ...t, ...t.i18n[l] }));
  },
};
/** Texto de exemplo nos três idiomas. */
const m = (pt: string, es: string, en: string) => ({ pt, es, en })[getLang()];

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
    if (state[id].applied) return { tweak_id: id, ok: true, skipped: true, message: m("Já estava ativo no sistema", "Ya estaba activo en el sistema", "Already active on the system") };
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
  journal.unshift({ id: Date.now(), tweak_id: "display.refresh", title: m(`Monitor em ${hz} Hz`, `Monitor a ${hz} Hz`, `Monitor at ${hz} Hz`), applied_at: Date.now(), reverted_at: null, changes: [] });
}

export function saveAutoexec(_content: string) {
  journal.unshift({ id: Date.now(), tweak_id: "cs2.autoexec", title: m("Autoexec do CS2", "Autoexec de CS2", "CS2 autoexec"), applied_at: Date.now(), reverted_at: null, changes: [] });
  return "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg\\autoexec.cfg";
}

export function report(): Report {
  const issues: Report["issues"] = [];
  if (displayHz < 165)
    issues.push({
      id: "display.\\\\.\\DISPLAY1",
      severity: "critical",
      title: m(`Monitor em ${displayHz} Hz — ele aguenta 165 Hz`, `Monitor a ${displayHz} Hz — soporta 165 Hz`, `Monitor at ${displayHz} Hz — it supports 165 Hz`),
      detail: m(
        "AOC 24G2 está rodando abaixo do que suporta. Você está vendo menos quadros do que o PC gera. É a correção com maior efeito na fluidez.",
        "AOC 24G2 está funcionando por debajo de lo que soporta. Estás viendo menos cuadros de los que genera la PC. Es la corrección con más efecto en la fluidez.",
        "AOC 24G2 is running below what it supports. You are seeing fewer frames than your PC renders. This is the fix with the biggest effect on smoothness.",
      ),
      fix: { kind: "display_refresh", device: "\\\\.\\DISPLAY1", hz: 165 },
    });
  if (!state["power.high_performance"].applied)
    issues.push({
      id: "power.plan",
      severity: "warning",
      title: m("Plano de energia Equilibrado", "Plan de energía Equilibrado", "Balanced power plan"),
      detail: m(
        "O Equilibrado reduz o clock quando acha que não precisa, o que pode causar quedas de FPS em momentos de ação.",
        "El plan Equilibrado baja la frecuencia cuando cree que no hace falta, y eso puede causar caídas de FPS en plena acción.",
        "Balanced lowers clock speeds when it thinks they are not needed, which can cause FPS drops in the middle of a fight.",
      ),
      fix: { kind: "tweak", tweak_id: "power.high_performance" },
    });
  issues.push({
    id: "ram.xmp",
    severity: "warning",
    title: m("Memória DDR4 a 2666 MT/s — provavelmente sem XMP/EXPO", "Memoria DDR4 a 2666 MT/s — probablemente sin XMP/EXPO", "DDR4 memory at 2666 MT/s — probably without XMP/EXPO"),
    detail: m(
      "Pentes de memória gamer vêm de fábrica numa velocidade básica. Ativar o perfil XMP (Intel) ou EXPO (AMD) na BIOS costuma dar ganho real no CS2.",
      "Las memorias gamer vienen de fábrica a una velocidad básica. Activar el perfil XMP (Intel) o EXPO (AMD) en la BIOS suele dar una mejora real en CS2.",
      "Gaming memory ships at a basic speed. Enabling the XMP (Intel) or EXPO (AMD) profile in the BIOS usually gives a real gain in CS2.",
    ),
    fix: {
      kind: "guide",
      steps: [
        m("Reinicie o PC e entre na BIOS (geralmente tecla Del ou F2 ao ligar).", "Reinicia la PC y entra a la BIOS (normalmente con Supr o F2 al encender).", "Restart the PC and enter the BIOS (usually Del or F2 while it boots)."),
        m("Procure por XMP, EXPO, D.O.C.P ou A-XMP (na aba AI Tweaker, OC ou Extreme Tweaker).", "Busca XMP, EXPO, D.O.C.P o A-XMP (en la pestaña AI Tweaker, OC o Extreme Tweaker).", "Look for XMP, EXPO, D.O.C.P or A-XMP (under AI Tweaker, OC or Extreme Tweaker)."),
        m("Ative o Perfil 1, salve (F10) e reinicie.", "Activa el Perfil 1, guarda (F10) y reinicia.", "Enable Profile 1, save (F10) and restart."),
        m("Se o PC não ligar, ele volta sozinho ao padrão após algumas tentativas.", "Si la PC no arranca, vuelve sola a la configuración original después de algunos intentos.", "If the PC does not boot, it goes back to the defaults by itself after a few tries."),
      ],
    },
  });
  if (!state["gamedvr.disable"].applied)
    issues.push({
      id: "gamedvr",
      severity: "warning",
      title: m("Gravação em segundo plano ligada", "Grabación en segundo plano activada", "Background recording is on"),
      detail: m("O Windows pode estar gravando o jogo continuamente, gastando GPU e disco.", "Windows puede estar grabando el juego todo el tiempo, gastando GPU y disco.", "Windows may be recording your game all the time, using GPU and disk."),
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
    power_plan: { guid: null, name: state["power.high_performance"].applied ? m("Alto desempenho", "Alto rendimiento", "High performance") : m("Equilibrado", "Equilibrado", "Balanced") },
    cs2_found: true,
    issues,
    checks_passed: [m("16 GB de RAM", "16 GB de RAM", "16 GB of RAM"), m("Driver de vídeo recente (NVIDIA GeForce RTX 3060)", "Driver de video reciente (NVIDIA GeForce RTX 3060)", "Recent graphics driver (NVIDIA GeForce RTX 3060)"), m("CS2 encontrado", "CS2 encontrado", "CS2 found")],
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

const tw = (id: string) => {
  const x = catalog.tweaks.find((t) => t.id === id)!;
  return { title: x.title, how_to_check: x.how_to_check ?? null };
};

// exemplo de manutenção: uma atualização do Windows religou o Game DVR
let dvrUndone = true;
export function reapply(ids: string[]): BatchResult {
  if (ids.includes("gamedvr.disable")) dvrUndone = false;
  return { results: ids.map((id) => ({ tweak_id: id, ok: true, skipped: false, message: null })), needs_reboot: false };
}

export function verify(): EntryCheck[] {
  const base: EntryCheck[] = [
    {
      entry_id: 3, tweak_id: "timer.global_requests", title: tw("timer.global_requests").title, applied_at: Date.now() - 3600_000,
      status: "pending_reboot", how_to_check: tw("timer.global_requests").how_to_check,
      checks: [{ label: "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\\GlobalTimerResolutionRequests", before: m("não existia", "no existía", "did not exist"), expected: "1", now: "1", status: "pending_reboot" }],
    },
    {
      entry_id: 2, tweak_id: "power.high_performance", title: tw("power.high_performance").title, applied_at: Date.now() - 7200_000,
      status: "ok", how_to_check: tw("power.high_performance").how_to_check,
      checks: [{ label: m("Plano de energia ativo", "Plan de energía activo", "Active power plan"), before: m("Personalizado (d1e5a0cb)", "Personalizado (d1e5a0cb)", "Custom (d1e5a0cb)"), expected: m("Alto desempenho", "Alto rendimiento", "High performance"), now: m("Alto desempenho", "Alto rendimiento", "High performance"), status: "ok" }],
    },
    {
      entry_id: 1, tweak_id: "gamedvr.disable", title: tw("gamedvr.disable").title, applied_at: Date.now() - 7300_000,
      status: dvrUndone ? "changed" : "ok", how_to_check: tw("gamedvr.disable").how_to_check,
      checks: [
        { label: "HKCU\\System\\GameConfigStore\\GameDVR_Enabled", before: "1", expected: "0", now: dvrUndone ? "1" : "0", status: dvrUndone ? "changed" : "ok" },
        { label: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR\\AppCaptureEnabled", before: m("não existia", "no existía", "did not exist"), expected: "0", now: "0", status: "ok" },
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
  { id: 1, label: m("Antes", "Antes", "Before"), created_at: Date.now() - 86400000, seconds: 60, frames: 9120, avg_fps: 152.3, low1_fps: 104.8, low01_fps: 81.2, p50_ms: 6.4, p99_ms: 9.8, stutter_pct: 1.9, series: fakeSeries(6.6, 14) },
  { id: 2, label: m("Depois", "Después", "After"), created_at: Date.now() - 3600000, seconds: 60, frames: 10930, avg_fps: 182.1, low1_fps: 141.6, low01_fps: 118.0, p50_ms: 5.4, p99_ms: 7.1, stutter_pct: 0.6, series: fakeSeries(5.5, 5) },
];
export function benchList() { return benchRuns; }
export function benchDelete(id: number) { benchRuns = benchRuns.filter((r) => r.id !== id); }
export function benchRun(seconds: number, label: string): BenchRun {
  const r = { ...benchRuns[benchRuns.length - 1], id: Date.now(), label, seconds, created_at: Date.now() };
  benchRuns = [...benchRuns, r];
  return r;
}

// ---- limpeza (exemplo)
const shaderWarn = () => m("Use só se o jogo estiver engasgando depois de atualizar o driver.", "Úsalo solo si el juego tiene tirones después de actualizar el driver.", "Use only if the game stutters after a driver update.");

export function cleanupScan(): CleanTarget[] {
  return [
    { id: "user_temp", label: m("Arquivos temporários do usuário", "Archivos temporales del usuario", "User temporary files"), description: m("Sobras de instaladores e programas na pasta %TEMP%.", "Restos de instaladores y programas en la carpeta %TEMP%.", "Leftovers from installers and programs in the %TEMP% folder."), files: 1834, bytes: 2_412_000_000, selected_by_default: true, warning: null },
    { id: "windows_temp", label: m("Arquivos temporários do Windows", "Archivos temporales de Windows", "Windows temporary files"), description: m("Pasta C:\\Windows\\Temp.", "Carpeta C:\\Windows\\Temp.", "The C:\\Windows\\Temp folder."), files: 212, bytes: 380_000_000, selected_by_default: true, warning: null },
    { id: "crash_dumps", label: m("Relatórios de travamento", "Informes de fallos", "Crash reports"), description: m("Despejos de memória e relatórios de erro antigos do Windows.", "Volcados de memoria e informes de error antiguos de Windows.", "Old Windows memory dumps and error reports."), files: 9, bytes: 96_000_000, selected_by_default: true, warning: null },
    { id: "dx_shader_cache", label: m("Cache de shaders do DirectX", "Caché de shaders de DirectX", "DirectX shader cache"), description: m("O Windows recria sozinho.", "Windows la vuelve a crear solo.", "Windows rebuilds it on its own."), files: 640, bytes: 512_000_000, selected_by_default: false, warning: shaderWarn() },
    { id: "gpu_shader_cache", label: m("Cache de shaders da placa de vídeo", "Caché de shaders de la placa de video", "Graphics card shader cache"), description: m("Caches da NVIDIA e da AMD. O driver recria sozinho.", "Cachés de NVIDIA y AMD. El driver las vuelve a crear solo.", "NVIDIA and AMD caches. The driver rebuilds them on its own."), files: 310, bytes: 1_020_000_000, selected_by_default: false, warning: shaderWarn() },
  ];
}
export function cleanupRun(ids: string[]): CleanResult {
  const t = cleanupScan().filter((x) => ids.includes(x.id));
  return { freed_bytes: t.reduce((s, x) => s + x.bytes * 0.92, 0), deleted_files: t.reduce((s, x) => s + x.files, 0) - 14, skipped_files: 14 };
}

// ---- placa de vídeo em uso (exemplo: notebook híbrido com o CS2 na integrada)
export function gpuInUse(): GpuInUse {
  const igpu = { name: "Intel(R) UHD Graphics", dedicated_mb: 128, integrated: true };
  return {
    cs2_running: true,
    adapters: [igpu, { name: "NVIDIA GeForce RTX 3050 Laptop GPU", dedicated_mb: 3962, integrated: false }],
    in_use: igpu,
    laptop: true,
    guide: [
      m("Jogue com o carregador conectado: na bateria muitos notebooks forçam a placa integrada.", "Juega con el cargador conectado: con batería muchas notebooks fuerzan la placa integrada.", "Play with the charger plugged in: on battery many laptops force the integrated GPU."),
      m("No Lenovo Vantage (ou Legion Space), procure Modo de trabalho da GPU / Modo híbrido e escolha a GPU dedicada (dGPU). Reinicie.", "En Lenovo Vantage (o Legion Space), busca Modo de trabajo de la GPU / Modo híbrido y elige la GPU dedicada (dGPU). Reinicia.", "In Lenovo Vantage (or Legion Space), look for GPU Working Mode / Hybrid mode and pick the dedicated GPU (dGPU). Restart."),
      m("Placa NVIDIA: Painel de Controle da NVIDIA › Gerenciar as configurações 3D › Configurações do programa › cs2.exe › Processador gráfico preferido: alto desempenho.", "Placa NVIDIA: Panel de control de NVIDIA › Administrar la configuración 3D › Configuración de programa › cs2.exe › Procesador de gráficos preferido: alto rendimiento.", "NVIDIA card: NVIDIA Control Panel › Manage 3D settings › Program Settings › cs2.exe › Preferred graphics processor: high-performance."),
      m("Feche e abra o CS2 de novo e confira aqui.", "Cierra y vuelve a abrir CS2 y compruébalo aquí.", "Close and reopen CS2 and check here again."),
    ],
  };
}

// ---- rede (exemplo: Wi-Fi, servidores da América do Sul)
export async function netTest(): Promise<NetReport> {
  await new Promise((r) => setTimeout(r, 1200));
  const pop = (code: string, name: string, avg: number | null, jitter: number | null, loss: number) => ({
    code, name, sent: 20, received: avg == null ? 0 : Math.round(20 * (1 - loss / 100)), avg_ms: avg, min_ms: avg == null ? null : Math.round(avg - 2), jitter_ms: jitter, loss_pct: avg == null ? 100 : loss,
  });
  return {
    interface: { name: "Wi-Fi", description: "Intel(R) Wi-Fi 6 AX201 160MHz", wifi: true, link_mbps: 866 },
    pops: [
      pop("gru", "Sao Paulo (Brazil)", 14.6, 6.2, 0), pop("eze", "Buenos Aires (Argentina)", 48.9, 7.1, 5), pop("scl", "Santiago (Chile)", 61.3, 5.8, 0),
      pop("lim", "Lima (Peru)", 79.4, 6.6, 0), pop("mia", "Miami", 128.2, 7.4, 0), pop("atl", "Atlanta", 142.7, 8.0, 0),
      pop("iad", "Sterling (Virginia)", 151.0, 6.9, 0), pop("mad", "Madrid", 196.3, 9.2, 0), pop("fra", "Frankfurt", 214.5, 8.1, 0),
    ],
    tips: [
      m("Você está no Wi-Fi. Cabo de rede é a melhora mais certa: menos variação e menos perda de pacote.", "Estás por Wi-Fi. El cable de red es la mejora más segura: menos variación y menos pérdida de paquetes.", "You're on Wi-Fi. An Ethernet cable is the surest improvement: less jitter and less packet loss."),
      m("O ping está variando bastante. Feche downloads, streams e atualizações (Steam, Windows, OneDrive) enquanto joga.", "El ping varía bastante. Cierra descargas, streams y actualizaciones (Steam, Windows, OneDrive) mientras juegas.", "Your ping is fluctuating a lot. Close downloads, streams and updates (Steam, Windows, OneDrive) while playing."),
    ],
  };
}
