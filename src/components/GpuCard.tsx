import { useState } from "react";
import { Cpu, Gauge as GaugeIcon } from "lucide-react";
import { Button, Dot, Panel } from "./ui";
import { api, errorText } from "../lib/api";
import { useApp } from "../lib/store";
import type { GpuInUse } from "../lib/types";
import { t } from "../i18n";

// Mostra em qual placa o CS2 está rodando. Só lê contadores do Windows
// (ver CLAUDE.md): nada abre o processo do jogo.
export function GpuCard() {
  const { notify } = useApp();
  const [res, setRes] = useState<GpuInUse | null>(null);
  const [busy, setBusy] = useState(false);

  async function check() {
    setBusy(true);
    try {
      setRes(await api.gpuInUse());
    } catch (e) {
      notify("bad", errorText(e));
    } finally {
      setBusy(false);
    }
  }

  let tone: "good" | "bad" | "faint" = "faint";
  let status = "";
  if (res) {
    if (!res.cs2_running) status = t("gpu.notRunning");
    else if (!res.in_use) status = t("gpu.unknown");
    else if (res.in_use.integrated) {
      tone = "bad";
      status = t("gpu.onIntegrated", { name: res.in_use.name });
    } else {
      tone = "good";
      status = res.adapters.length > 1 ? t("gpu.onDedicated", { name: res.in_use.name }) : t("gpu.single", { name: res.in_use.name });
    }
  }

  return (
    <Panel className="p-6 mt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-cond font-bold text-[18px] flex items-center gap-2"><Cpu size={18} className="text-amber" />{t("gpu.title")}</h2>
          <p className="text-dim text-[14.5px] mt-1 max-w-[70ch]">{t("gpu.lead")}</p>
        </div>
        <Button className="shrink-0" busy={busy} icon={<GaugeIcon size={16} />} onClick={check}>
          {busy ? t("gpu.checking") : t("gpu.check")}
        </Button>
      </div>

      {res && (
        <div className="mt-4 space-y-4">
          <p className="flex items-start gap-2 text-[15px]"><span className="mt-2 shrink-0 flex"><Dot tone={tone} /></span>{status}</p>

          {res.guide.length > 0 && (
            <div className="rounded-xl bg-bad/10 p-4">
              <h3 className="font-semibold text-[14.5px] mb-2">{t("gpu.howTo")}</h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-[14px] text-dim">
                {res.guide.map((g) => <li key={g}>{g}</li>)}
              </ol>
            </div>
          )}

          {res.adapters.length > 0 && (
            <div>
              <div className="text-faint text-[13px] mb-1">{t("gpu.adapters")}</div>
              <ul className="text-[14px] space-y-0.5">
                {res.adapters.map((a) => (
                  <li key={a.name}>
                    {a.name} <span className="text-faint">· {a.integrated ? t("gpu.integrated") : t("gpu.dedicated")}{a.dedicated_mb >= 1024 ? ` · ${(a.dedicated_mb / 1024).toFixed(0)} GB` : ""}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-faint text-[13px]">{t("gpu.how")}</p>
        </div>
      )}
    </Panel>
  );
}
