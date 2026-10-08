import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, errorText } from "./api";
import type { BatchResult, Report, TweakView } from "./types";
import { checkForUpdate, type AvailableUpdate } from "./updater";

export interface Toast {
  id: number;
  tone: "good" | "bad" | "info";
  text: string;
}

interface AppState {
  report: Report | null;
  tweaks: TweakView[] | null;
  scanning: boolean;
  rescan: () => Promise<void>;
  reloadTweaks: () => Promise<void>;
  notify: (tone: Toast["tone"], text: string) => void;
  toasts: Toast[];
  summarize: (r: BatchResult, verb: "aplicad" | "revertid") => void;
  update: AvailableUpdate | null;
  checkUpdate: (manual?: boolean) => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [report, setReport] = useState<Report | null>(null);
  const [tweaks, setTweaks] = useState<TweakView[] | null>(null);
  const [scanning, setScanning] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [update, setUpdate] = useState<AvailableUpdate | null>(null);

  const notify = useCallback((tone: Toast["tone"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, tone, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5200);
  }, []);

  const reloadTweaks = useCallback(async () => {
    try {
      setTweaks(await api.listTweaks());
    } catch (e) {
      notify("bad", errorText(e));
    }
  }, [notify]);

  const rescan = useCallback(async () => {
    setScanning(true);
    try {
      const [r, t] = await Promise.all([api.runDiagnostics(), api.listTweaks()]);
      setReport(r);
      setTweaks(t);
    } catch (e) {
      notify("bad", `Não foi possível analisar o PC: ${errorText(e)}`);
    } finally {
      setScanning(false);
    }
  }, [notify]);

  const summarize = useCallback(
    (r: BatchResult, verb: "aplicad" | "revertid") => {
      const done = r.results.filter((x) => x.ok && !x.skipped).length;
      const failed = r.results.filter((x) => !x.ok);
      if (failed.length) {
        notify("bad", `${failed.length} não ${failed.length > 1 ? "puderam" : "pôde"} ser ${verb}${failed.length > 1 ? "as" : "a"}: ${failed[0].message ?? "erro desconhecido"}`);
      }
      if (done) {
        notify(
          "good",
          `${done} ${done > 1 ? "otimizações" : "otimização"} ${verb}${done > 1 ? "as" : "a"}.${r.needs_reboot ? " Reinicie o PC para concluir." : ""}`,
        );
      } else if (!failed.length) {
        notify("info", "Nada mudou: tudo já estava como pedido.");
      }
    },
    [notify],
  );

  const checkUpdate = useCallback(
    async (manual = false) => {
      try {
        const u = await checkForUpdate();
        setUpdate(u);
        if (manual && !u) notify("good", "Você já está na versão mais recente.");
      } catch (e) {
        // sem internet / repositório ainda não publicado: só avisa se foi pedido
        if (manual) notify("bad", `Não foi possível procurar atualizações: ${errorText(e)}`);
      }
    },
    [notify],
  );

  useEffect(() => {
    rescan();
    const t = setTimeout(() => checkUpdate(false), 4000);
    return () => clearTimeout(t);
  }, [rescan, checkUpdate]);

  return (
    <Ctx.Provider value={{ report, tweaks, scanning, rescan, reloadTweaks, notify, toasts, summarize, update, checkUpdate }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp fora do AppProvider");
  return c;
}
