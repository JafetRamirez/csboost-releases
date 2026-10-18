import { useEffect, useState } from "react";
import { Gamepad2 } from "lucide-react";
import { Dot, Panel } from "./ui";
import { api, errorText } from "../lib/api";
import { useApp } from "../lib/store";
import { fmtDateTime } from "../lib/format";
import type { SessionStatus } from "../lib/types";
import { t } from "../i18n";

// Modo Sessão v1 (ROADMAP #7). O vigia roda no núcleo; aqui só mostra o estado.
export function SessionCard() {
  const { notify } = useApp();
  const [s, setS] = useState<SessionStatus | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () => api.sessionStatus().then((v) => alive && setS(v)).catch(() => {});
    load();
    const timer = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  async function toggle() {
    if (!s) return;
    setBusy(true);
    try {
      setS(await api.sessionSet(!s.enabled));
    } catch (e) {
      notify("bad", errorText(e));
    } finally {
      setBusy(false);
    }
  }

  const time = s?.started_at ? fmtDateTime(s.started_at) : "";
  const line = !s
    ? ""
    : !s.enabled
      ? t("session.off")
      : s.active
        ? s.plan_changed
          ? t("session.active", { time })
          : t("session.activeSame", { time })
        : t("session.waiting");

  return (
    <Panel className="p-6 mt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-cond font-bold text-[18px] flex items-center gap-2"><Gamepad2 size={18} className="text-amber" />{t("session.title")}</h2>
          <p className="text-dim text-[14.5px] mt-1 max-w-[70ch]">{t("session.lead")}</p>
        </div>
        <button
          role="switch"
          aria-checked={!!s?.enabled}
          aria-label={t("session.toggle")}
          disabled={!s || busy}
          onClick={toggle}
          className={`shrink-0 relative h-7 w-12 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${s?.enabled ? "bg-amber" : "bg-line"}`}
        >
          <span className={`absolute top-1 size-5 rounded-full bg-white transition-all ${s?.enabled ? "left-6" : "left-1"}`} />
        </button>
      </div>
      {s && (
        <div className="mt-3 space-y-2 text-[14.5px]">
          <p className="flex items-center gap-2">
            <Dot tone={s.active ? "good" : s.enabled ? "amber" : "faint"} />
            {line}
          </p>
          {s.enabled && s.background_apps.length > 0 && (
            <p className="text-warn text-[14px]">{t("session.background", { apps: s.background_apps.join(", ") })}</p>
          )}
        </div>
      )}
    </Panel>
  );
}
