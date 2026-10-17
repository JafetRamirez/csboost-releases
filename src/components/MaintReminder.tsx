import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { Button } from "./ui";
import { maintenanceDue, snoozeMaintenance } from "../lib/prefsLocal";
import { t } from "../i18n";

// Lembrete mensal de manutenção (ROADMAP #12): só aparece ao abrir o app,
// nada roda em segundo plano.
export function MaintReminder({ go }: { go: () => void }) {
  const [show, setShow] = useState(maintenanceDue);
  if (!show) return null;
  return (
    <div className="mx-10 mb-2 flex flex-wrap items-center gap-3 rounded-xl border border-navy-hi/40 bg-navy/30 px-4 py-2.5 text-[14.5px]">
      <CalendarClock size={18} className="text-navy-hi shrink-0" />
      <span className="flex-1 min-w-[240px]">{t("maint.reminder")}</span>
      <Button variant="ghost" className="h-8 px-3 text-[14px]" onClick={() => { snoozeMaintenance(); setShow(false); }}>
        {t("maint.later")}
      </Button>
      <Button variant="primary" className="h-8 px-3 text-[14px]" onClick={() => { setShow(false); go(); }}>
        {t("maint.go")}
      </Button>
    </div>
  );
}
