import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, errorText } from "./api";
import type { BatchResult, Report, TweakView } from "./types";
import { checkForUpdate, type AvailableUpdate } from "./updater";
import { getLang, t } from "../i18n";

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
      notify("bad", t("store.scanFail", { err: errorText(e) }));
    } finally {
      setScanning(false);
    }
  }, [notify]);

  const summarize = useCallback(
    (r: BatchResult, verb: "aplicad" | "revertid") => {
      const done = r.results.filter((x) => x.ok && !x.skipped).length;
      const failed = r.results.filter((x) => !x.ok);
      if (failed.length) {
        const msg = failed[0].message ?? t("store.unknownError");
        const k = verb === "aplicad" ? (failed.length > 1 ? "store.applyFailMany" : "store.applyFailOne") : failed.length > 1 ? "store.revertFailMany" : "store.revertFailOne";
        notify("bad", t(k, { n: failed.length, msg }));
      }
      if (done) {
        const k = verb === "aplicad" ? (done > 1 ? "store.appliedMany" : "store.appliedOne") : done > 1 ? "store.revertedMany" : "store.revertedOne";
        notify("good", t(k, { n: done }) + (r.needs_reboot ? " " + t("store.reboot") : ""));
      } else if (!failed.length) {
        notify("info", t("store.nothing"));
      }
    },
    [notify],
  );

  const checkUpdate = useCallback(
    async (manual = false) => {
      try {
        const u = await checkForUpdate();
        setUpdate(u);
        if (manual && !u) notify("good", t("store.upToDate"));
      } catch (e) {
        // sem internet / repositório ainda não publicado: só avisa se foi pedido
        if (manual) notify("bad", t("store.updateCheckFail", { err: errorText(e) }));
      }
    },
    [notify],
  );

  useEffect(() => {
    // o núcleo Rust gera os textos do Raio-X no idioma escolhido
    api.setLanguage(getLang()).catch(() => {}).finally(() => rescan());
    const timer = setTimeout(() => checkUpdate(false), 4000);
    return () => clearTimeout(timer);
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
