// Atualização automática: o app consulta o latest.json publicado no GitHub
// (Releases do repositório csboost-releases). O instalador novo é verificado
// com a assinatura do CSBoost antes de rodar — sem assinatura válida, não instala.
import { isTauri } from "./api";

export interface AvailableUpdate {
  version: string;
  notes: string | null;
  install: (onProgress: (pct: number | null) => void) => Promise<void>;
}

export async function appVersion(): Promise<string> {
  if (!isTauri) return "0.2.0";
  const { getVersion } = await import("@tauri-apps/api/app");
  return getVersion();
}

export async function checkForUpdate(): Promise<AvailableUpdate | null> {
  if (!isTauri) return null;
  const { check } = await import("@tauri-apps/plugin-updater");
  const update = await check();
  if (!update) return null;
  return {
    version: update.version,
    notes: update.body ?? null,
    install: async (onProgress) => {
      let total = 0;
      let done = 0;
      await update.downloadAndInstall((ev) => {
        if (ev.event === "Started") total = ev.data.contentLength ?? 0;
        if (ev.event === "Progress") {
          done += ev.data.chunkLength;
          onProgress(total ? Math.round((done / total) * 100) : null);
        }
      });
      // No Windows o instalador fecha o app sozinho; isto cobre os demais casos.
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    },
  };
}
