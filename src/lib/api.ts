// Ponte entre a interface e o núcleo Rust.
// Fora do app (npm run dev no navegador) usa dados de exemplo, para dar
// para trabalhar no visual sem compilar o Rust.

import { invoke } from "@tauri-apps/api/core";
import type { BatchResult, BenchRun, CleanResult, CleanTarget, Cs2Info, EntryCheck, JournalEntry, Report, TweakView } from "./types";
import * as mock from "./mock";
import { t } from "../i18n";

export const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

function call<T>(cmd: string, args: Record<string, unknown> | undefined, fallback: () => T | Promise<T>): Promise<T> {
  if (isTauri) return invoke<T>(cmd, args);
  return new Promise((resolve) => setTimeout(() => resolve(fallback()), 450));
}

export const api = {
  runDiagnostics: () => call<Report>("run_diagnostics", undefined, mock.report),
  listTweaks: () => call<TweakView[]>("list_tweaks", undefined, mock.tweaks),
  applyTweaks: (ids: string[]) => call<BatchResult>("apply_tweaks", { ids }, () => mock.apply(ids)),
  revertTweaks: (ids: string[]) => call<BatchResult>("revert_tweaks", { ids }, () => mock.revert(ids)),
  revertAll: () => call<BatchResult>("revert_all", undefined, mock.revertAll),
  history: () => call<JournalEntry[]>("history", undefined, mock.history),
  createRestorePoint: () => call<void>("create_restore_point", undefined, () => undefined),
  setDisplayRefresh: (device: string, hz: number) =>
    call<void>("set_display_refresh", { device, hz }, () => mock.fixDisplay(device, hz)),
  cs2Info: () => call<Cs2Info>("cs2_info", undefined, mock.cs2),
  verifyChanges: () => call<EntryCheck[]>("verify_changes", undefined, mock.verify),
  benchRun: (seconds: number, label: string) => call<BenchRun>("bench_run", { seconds, label }, () => mock.benchRun(seconds, label)),
  benchList: () => call<BenchRun[]>("bench_list", undefined, mock.benchList),
  benchDelete: (id: number) => call<void>("bench_delete", { id }, () => mock.benchDelete(id)),
  cs2Running: () => call<boolean>("cs2_running", undefined, () => true),
  cleanupScan: () => call<CleanTarget[]>("cleanup_scan", undefined, mock.cleanupScan),
  cleanupRun: (ids: string[]) => call<CleanResult>("cleanup_run", { ids }, () => mock.cleanupRun(ids)),
  setLanguage: (lang: string) => call<void>("set_language", { lang }, () => undefined),
  writeAutoexec: (content: string) => call<string>("write_autoexec", { content }, () => mock.saveAutoexec(content)),
};

export async function openUrl(url: string) {
  if (isTauri) {
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    await openUrl(url);
  } else {
    window.open(url, "_blank");
  }
}

export function errorText(e: unknown): string {
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;
  return t("err.generic");
}
