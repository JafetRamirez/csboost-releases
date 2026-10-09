import { useState } from "react";
import { ChevronDown, Wrench } from "lucide-react";
import type { Issue } from "../lib/types";
import { api, errorText } from "../lib/api";
import { useApp } from "../lib/store";
import { Button } from "./ui";
import { t } from "../i18n";

const tone = () => ({
  critical: { bar: "bg-bad", text: "text-bad", label: t("sev.critical") },
  warning: { bar: "bg-warn", text: "text-warn", label: t("sev.warning") },
  info: { bar: "bg-navy-hi", text: "text-navy-hi", label: t("sev.info") },
});

export function IssueCard({ issue, compact = false }: { issue: Issue; compact?: boolean }) {
  const { rescan, notify, summarize } = useApp();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const sev = tone()[issue.severity];

  async function fix() {
    if (!issue.fix) return;
    setBusy(true);
    try {
      if (issue.fix.kind === "tweak") {
        summarize(await api.applyTweaks([issue.fix.tweak_id]), "aplicad");
      } else if (issue.fix.kind === "display_refresh") {
        await api.setDisplayRefresh(issue.fix.device, issue.fix.hz);
        notify("good", t("issue.monitorSet", { hz: issue.fix.hz }));
      }
      await rescan();
    } catch (e) {
      notify("bad", errorText(e));
    } finally {
      setBusy(false);
    }
  }

  const action =
    issue.fix?.kind === "guide" ? (
      <Button variant="quiet" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {t("issue.howto")}
        <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>
    ) : issue.fix ? (
      <Button variant="primary" busy={busy} onClick={fix} icon={<Wrench size={16} />}>
        {t("issue.fix")}
      </Button>
    ) : null;

  return (
    <div className="relative flex gap-4 rounded-xl bg-raised/50 border border-line/70 pl-5 pr-4 py-4 overflow-hidden">
      <span className={`absolute left-0 inset-y-0 w-1 ${sev.bar}`} aria-hidden />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-[13px] font-semibold ${sev.text}`}>{sev.label}</span>
        </div>
        <h3 className="font-cond font-bold text-[17.5px] leading-snug mt-0.5">{issue.title}</h3>
        {!compact && <p className="text-dim text-[14.5px] mt-1 max-w-[68ch]">{issue.detail}</p>}
        {open && issue.fix?.kind === "guide" && (
          <ol className="mt-3 space-y-1.5 text-[14.5px] list-decimal pl-5 marker:text-amber">
            {issue.fix.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        )}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}
