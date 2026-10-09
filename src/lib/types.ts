// Espelha as structs serializadas pelo núcleo em Rust (src-tauri/src).

export type Risk = "safe" | "moderate" | "advanced";
export type Evidence = "proven" | "situational" | "weak";
export type TweakState = "applied" | "not_applied" | "partial" | "unknown";
export type Preset = "seguro" | "competitivo" | "pc_fraco" | "avancado";

export interface TweakView {
  id: string;
  category: string;
  title: string;
  description: string;
  risk: Risk;
  evidence: Evidence;
  requires_reboot: boolean;
  laptop_warning: boolean;
  min_build: number | null;
  presets: Preset[];
  state: TweakState;
  managed: boolean;
  supported: boolean;
  unsupported_reason: string | null;
}

export interface OpResult {
  tweak_id: string;
  ok: boolean;
  skipped: boolean;
  message: string | null;
}

export interface BatchResult {
  results: OpResult[];
  needs_reboot: boolean;
}

export type Severity = "critical" | "warning" | "info";

export type Fix =
  | { kind: "tweak"; tweak_id: string }
  | { kind: "display_refresh"; device: string; hz: number }
  | { kind: "guide"; steps: string[] };

export interface Issue {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  fix: Fix | null;
}

export interface DisplayInfo {
  device: string;
  name: string;
  primary: boolean;
  width: number;
  height: number;
  current_hz: number;
  max_hz: number;
}

export interface GpuInfo {
  name: string;
  driver_version: string | null;
  driver_date: string | null;
}

export interface RamModule {
  capacity_gb: number;
  rated_mts: number | null;
  configured_mts: number | null;
  smbios_type: number | null;
}

export interface HardwareInfo {
  os_name: string;
  os_build: number;
  cpu: string;
  cpu_cores: number;
  cpu_threads: number;
  gpus: GpuInfo[];
  ram_modules: RamModule[];
  disk_free_gb: number | null;
  disk_total_gb: number | null;
}

export interface Report {
  score: number;
  elevated: boolean;
  hardware: HardwareInfo;
  displays: DisplayInfo[];
  power: { has_battery: boolean; on_ac: boolean };
  power_plan: { guid: string | null; name: string };
  cs2_found: boolean;
  issues: Issue[];
  checks_passed: string[];
}

export interface SteamUser {
  id3: string;
  persona: string | null;
  launch_options: string | null;
  most_recent: boolean;
}

export interface GpuAdapterView {
  name: string;
  dedicated_mb: number;
  integrated: boolean;
}

export interface GpuInUse {
  cs2_running: boolean;
  adapters: GpuAdapterView[];
  in_use: GpuAdapterView | null;
  laptop: boolean;
  guide: string[];
}

export interface NetInterface {
  name: string;
  description: string;
  wifi: boolean;
  link_mbps: number;
}

export interface PopResult {
  code: string;
  name: string;
  sent: number;
  received: number;
  avg_ms: number | null;
  min_ms: number | null;
  jitter_ms: number | null;
  loss_pct: number;
}

export interface NetReport {
  interface: NetInterface | null;
  pops: PopResult[];
  tips: string[];
}

export interface Cs2Info {
  steam_found: boolean;
  steam_path: string | null;
  found: boolean;
  install_dir: string | null;
  exe_path: string | null;
  cfg_dir: string | null;
  autoexec: string | null;
  users: SteamUser[];
  steam_running: boolean;
  cs2_running: boolean;
}

export type Change =
  | { type: "registry"; hive: string; path: string; name: string; previous: unknown }
  | { type: "power_plan"; previous: string; applied: string }
  | { type: "file"; path: string; previous: string | null }
  | { type: "display_refresh"; device: string; previous_hz: number; applied_hz: number };

export interface JournalEntry {
  id: number;
  tweak_id: string;
  title: string;
  applied_at: number;
  reverted_at: number | null;
  changes: Change[];
}

export type CheckStatus = "ok" | "pending_reboot" | "changed" | "unknown";

export interface ChangeCheck {
  label: string;
  before: string;
  expected: string;
  now: string;
  status: CheckStatus;
}

export interface EntryCheck {
  entry_id: number;
  tweak_id: string;
  title: string;
  applied_at: number;
  status: CheckStatus;
  how_to_check: string | null;
  checks: ChangeCheck[];
}

export interface BenchRun {
  id: number;
  label: string;
  created_at: number;
  seconds: number;
  frames: number;
  avg_fps: number;
  low1_fps: number;
  low01_fps: number;
  p50_ms: number;
  p99_ms: number;
  stutter_pct: number;
  series: number[];
}

export interface CleanTarget {
  id: string;
  label: string;
  description: string;
  files: number;
  bytes: number;
  selected_by_default: boolean;
  warning: string | null;
}

export interface CleanResult {
  freed_bytes: number;
  deleted_files: number;
  skipped_files: number;
}

export interface ProPlayer {
  id: string;
  nick: string;
  name: string | null;
  country: string;
  country_name: string;
  team: string | null;
  monitor: { resolution: string | null; aspect: string | null; scaling: string | null; hz: number | null };
  mouse: { dpi: number | null; sens: number | null; edpi: number | null; zoom_sens: number | null; polling_hz: number | null };
  crosshair: { code: string | null; commands: string[] };
  viewmodel: { commands: string[] };
  video: Record<string, string> | null;
  gear: Record<string, string | null> | null;
  launch_options: string | null;
  sources: string[];
  checked: string;
  notes: string | null;
}
