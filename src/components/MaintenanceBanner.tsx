import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { api, errorText } from "../lib/api";
import { useApp } from "../lib/store";
import type { EntryCheck } from "../lib/types";
import { Button } from "./ui";
import { t } from "../i18n";

// Manutenção: ao abrir, confere se o Windows desfez algum ajuste aplicado
// (comum depois de atualização) e oferece reaplicar com um clique.
export function MaintenanceBanner() {
  const { notify, summarize, reloadTweaks } = useApp();
  const [undone, setUndone] = useState<EntryCheck[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      api.verifyChanges().then((v) => setUndone(v.filter((e) => e.status === "changed"))).catch(() => {});
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!undone.length) return null;
  const names = undone.map((e) => e.title).join(", ");

  async function reapply() {
    setBusy(true);
    try {
      const r = await api.reapplyTweaks(undone.map((e) => e.tweak_id));
      summarize(r, "aplicad");
      const v = await api.verifyChanges();
      setUndone(v.filter((e) => e.status === "changed"));
      await reloadTweaks();
    } catch (e) {
      notify("bad", errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-10 mb-2 flex flex-wrap items-center gap-3 rounded-xl border border-amber/40 bg-amber/10 px-4 py-2.5 text-[14.5px]">
      <RefreshCw size={18} className="text-amber shrink-0" />
      <span className="flex-1 min-w-[240px]">
        {undone.length === 1 ? t("maint.one", { names }) : t("maint.many", { n: undone.length, names })}
      </span>
      <Button variant="ghost" className="h-8 px-3 text-[14px]" onClick={() => setUndone([])}>
        {t("maint.dismiss")}
      </Button>
      <Button variant="primary" busy={busy} className="h-8 px-3 text-[14px]" onClick={reapply}>
        {t("maint.reapply")}
      </Button>
    </div>
  );
}
