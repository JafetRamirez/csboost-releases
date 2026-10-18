import { useEffect, useState } from "react";
import { CircleCheck, Cpu } from "lucide-react";
import { Button, Dot, Panel } from "./ui";
import { api, errorText } from "../lib/api";
import { useApp } from "../lib/store";
import type { NvInfo } from "../lib/types";
import { t } from "../i18n";

// Perfil NVIDIA (ROADMAP #10). Só aparece em PC com placa NVIDIA.
export function NvidiaCard() {
  const { notify } = useApp();
  const [info, setInfo] = useState<NvInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const load = () => api.nvidiaInfo().then(setInfo).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  if (!info?.available) return null;
  const pending = info.settings.filter((s) => !s.ok).length;

  async function apply() {
    setBusy(true);
    try {
      const n = await api.nvidiaApply();
      notify("good", t("nv.done", { n }));
      await load();
    } catch (e) {
      notify("bad", errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel className="p-6 mt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-cond font-bold text-[18px] flex items-center gap-2"><Cpu size={18} className="text-good" />{t("nv.title")}</h2>
          <p className="text-dim text-[14.5px] mt-1 max-w-[70ch]">{t("nv.lead")}</p>
        </div>
        {pending > 0 && !info.error && (
          <Button className="shrink-0" variant="primary" busy={busy} onClick={apply}>
            {t("nv.apply")}
          </Button>
        )}
      </div>
      {info.error ? (
        <p className="mt-3 text-[14px] text-warn">{info.error}</p>
      ) : (
        <ul className="mt-4 space-y-2 text-[14.5px]">
          {info.settings.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {s.ok ? <CircleCheck size={16} className="text-good shrink-0" /> : <span className="flex"><Dot tone="amber" /></span>}
              <span className="font-semibold">{s.label}</span>
              <span className="text-dim">→ {s.target}</span>
              {!s.ok && <span className="text-faint text-[13px]">({t("nv.now", { v: s.now })})</span>}
            </li>
          ))}
          {pending === 0 && <li className="text-good text-[14px]">{t("nv.allSet")}</li>}
        </ul>
      )}
      <p className="text-faint text-[13px] mt-3">{t("nv.reflex")}</p>
    </Panel>
  );
}
