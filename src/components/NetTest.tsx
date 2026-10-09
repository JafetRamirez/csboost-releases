import { useState } from "react";
import { Cable, Wifi, Activity } from "lucide-react";
import { Button, Dot, Panel } from "./ui";
import { api, errorText } from "../lib/api";
import { useApp } from "../lib/store";
import type { NetReport, PopResult } from "../lib/types";
import { t } from "../i18n";

// Diagnóstico de rede gratuito (ROADMAP #13): só mede, não muda rota.
const tonePing = (ms: number | null) => (ms == null ? "faint" : ms <= 40 ? "good" : ms <= 90 ? "warn" : "bad");

function Row({ p }: { p: PopResult }) {
  const ms = (v: number | null) => (v == null ? "—" : `${Math.round(v)} ms`);
  return (
    <tr className="border-t border-line">
      <td className="py-2 pr-4">{p.name}</td>
      <td className="py-2 pr-4 num">
        <span className="inline-flex items-center gap-2"><Dot tone={tonePing(p.avg_ms)} />{p.received ? ms(p.avg_ms) : t("net.noReply")}</span>
      </td>
      <td className="py-2 pr-4 num">{p.received ? ms(p.jitter_ms) : "—"}</td>
      <td className={`py-2 num ${p.received && p.loss_pct > 0 ? "text-bad" : ""}`}>{p.received ? `${Math.round(p.loss_pct)}%` : "—"}</td>
    </tr>
  );
}

export function NetTest() {
  const { notify } = useApp();
  const [res, setRes] = useState<NetReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [all, setAll] = useState(false);

  async function run() {
    setBusy(true);
    try {
      setRes(await api.netTest());
    } catch (e) {
      notify("bad", errorText(e));
    } finally {
      setBusy(false);
    }
  }

  const shown = res ? (all ? res.pops : res.pops.slice(0, 6)) : [];
  const iface = res?.interface;

  return (
    <Panel className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-cond font-bold text-[20px]">{t("net.title")}</h2>
          <p className="text-[14.5px] text-dim mt-0.5 max-w-[70ch]">{t("net.lead")}</p>
        </div>
        <Button className="shrink-0" variant="primary" busy={busy} icon={<Activity size={16} />} onClick={run}>
          {busy ? t("net.running") : t("net.run")}
        </Button>
      </div>

      {res && (
        <div className="mt-4 space-y-4">
          {iface && (
            <p className="flex items-center gap-2 text-[14.5px]">
              {iface.wifi ? <Wifi size={17} className="text-warn" /> : <Cable size={17} className="text-good" />}
              <span className="text-faint">{t("net.iface")}:</span>
              <span>{iface.wifi ? t("net.wifi") : t("net.cable")} · {iface.description}{iface.link_mbps ? ` · ${iface.link_mbps} Mbps` : ""}</span>
            </p>
          )}
          <ul className="space-y-1.5 text-[14.5px]">
            {res.tips.map((tip) => <li key={tip} className="rounded-lg bg-base px-3 py-2">{tip}</li>)}
          </ul>
          {res.pops.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-[14px] text-left">
                <thead className="text-faint text-[13px]">
                  <tr>
                    <th className="font-normal pb-1 pr-4">{t("net.server")}</th>
                    <th className="font-normal pb-1 pr-4">{t("net.ping")}</th>
                    <th className="font-normal pb-1 pr-4">{t("net.jitter")}</th>
                    <th className="font-normal pb-1">{t("net.loss")}</th>
                  </tr>
                </thead>
                <tbody>{shown.map((p) => <Row key={p.code} p={p} />)}</tbody>
              </table>
              {res.pops.length > 6 && (
                <button onClick={() => setAll(!all)} className="mt-2 text-[13.5px] text-faint hover:text-fg cursor-pointer">
                  {all ? t("net.showLess") : t("net.showAll", { n: res.pops.length })}
                </button>
              )}
            </div>
          )}
        </div>
      )}
      <p className="text-[12.5px] text-faint mt-3">{t("net.privacy")}</p>
    </Panel>
  );
}
