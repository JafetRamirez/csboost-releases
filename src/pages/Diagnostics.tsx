import { useState } from "react";
import { ChevronDown, CircleCheck, ClipboardCopy, RotateCcw } from "lucide-react";
import { IssueCard } from "../components/IssueCard";
import { Button, Loading, PageHeader, Panel } from "../components/ui";
import { useApp } from "../lib/store";
import { errorText } from "../lib/api";
import { diagnosticText } from "../lib/diagnosticText";
import { t } from "../i18n";

export function Diagnostics() {
  const { report, scanning, rescan, notify } = useApp();
  const [showIgnored, setShowIgnored] = useState(false);
  if (!report) return <Loading label={t("dash.analyzing")} />;

  async function copy() {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(await diagnosticText(report));
      notify("good", t("diag.copied"));
    } catch (e) {
      notify("bad", errorText(e));
    }
  }

  return (
    <>
      <PageHeader
        title={t("nav.raiox")}
        lead={t("diag.lead")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={copy} icon={<ClipboardCopy size={16} />} title={t("diag.copyHint")}>
              {t("diag.copy")}
            </Button>
            <Button onClick={rescan} busy={scanning} icon={<RotateCcw size={16} />}>
              {t("dash.rescan")}
            </Button>
          </div>
        }
      />
      <div className="space-y-3">
        {report.issues.map((i) => (
          <IssueCard key={i.id} issue={i} />
        ))}
        {report.issues.length === 0 && (
          <Panel className="p-8 text-center text-dim">{t("diag.none")}</Panel>
        )}
      </div>

      {report.dismissed.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowIgnored((s) => !s)}
            aria-expanded={showIgnored}
            className="flex items-center gap-2 text-[14.5px] text-dim hover:text-fg cursor-pointer"
          >
            <ChevronDown size={16} className={`transition-transform ${showIgnored ? "rotate-180" : ""}`} />
            {t("diag.ignored", { n: report.dismissed.length })}
            <span className="text-faint text-[13px]">· {t("diag.ignoredHint")}</span>
          </button>
          {showIgnored && (
            <div className="space-y-3 mt-3">
              {report.dismissed.map((i) => (
                <IssueCard key={i.id} issue={i} dismissed />
              ))}
            </div>
          )}
        </div>
      )}

      {report.checks_passed.length > 0 && (
        <Panel className="p-6 mt-6">
          <h2 className="font-cond font-bold text-[18px] mb-3">{t("diag.passed")}</h2>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
            {report.checks_passed.map((c) => (
              <li key={c} className="flex items-center gap-2.5 text-[15px]">
                <CircleCheck size={17} className="text-good shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
