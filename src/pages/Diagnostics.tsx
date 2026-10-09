import { CircleCheck, RotateCcw } from "lucide-react";
import { IssueCard } from "../components/IssueCard";
import { Button, Loading, PageHeader, Panel } from "../components/ui";
import { useApp } from "../lib/store";
import { t } from "../i18n";

export function Diagnostics() {
  const { report, scanning, rescan } = useApp();
  if (!report) return <Loading label={t("dash.analyzing")} />;

  return (
    <>
      <PageHeader
        title={t("nav.raiox")}
        lead={t("diag.lead")}
        actions={
          <Button onClick={rescan} busy={scanning} icon={<RotateCcw size={16} />}>
            {t("dash.rescan")}
          </Button>
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
