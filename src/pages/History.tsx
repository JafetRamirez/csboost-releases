import { useEffect, useState } from "react";
import { ChevronDown, CircleAlert, CircleCheck, Clock, HelpCircle, LifeBuoy, RefreshCw, RotateCcw } from "lucide-react";
import { Button, Loading, PageHeader, Panel } from "../components/ui";
import { api, errorText } from "../lib/api";
import { useApp } from "../lib/store";
import type { CheckStatus, EntryCheck, JournalEntry } from "../lib/types";
import { t, tn } from "../i18n";
import { fmtDateTime } from "../lib/format";


const statusInfo = (): Record<CheckStatus, { icon: typeof CircleCheck; tone: string; text: string }> => ({
  ok: { icon: CircleCheck, tone: "text-good", text: t("hist.st.ok") },
  pending_reboot: { icon: Clock, tone: "text-amber", text: t("hist.st.pending") },
  changed: { icon: CircleAlert, tone: "text-warn", text: t("hist.st.changed") },
  unknown: { icon: HelpCircle, tone: "text-faint", text: t("hist.st.unknown") },
});

function EntryRow({ e, busy, onRevert }: { e: EntryCheck; busy: boolean; onRevert: () => void }) {
  const [open, setOpen] = useState(false);
  const s = statusInfo()[e.status];
  const Icon = s.icon;
  return (
    <li className="border-t border-line/60 first:border-t-0">
      <div className="flex items-center gap-4 px-6 py-4">
        <Icon size={20} className={`${s.tone} shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className="font-cond font-semibold text-[16px]">{e.title}</p>
          <p className="text-[13.5px] text-faint">
            <span className={s.tone}>{s.text}</span>, {t("hist.appliedAt", { d: fmtDateTime(e.applied_at) })}
          </p>
        </div>
        <Button variant="quiet" className="h-8 px-2.5 text-[14px]" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {t("hist.details")}
          <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </Button>
        <Button variant="quiet" className="h-8 px-2.5 text-[14px]" busy={busy} icon={<RotateCcw size={14} />} onClick={onRevert}>
          {t("tw.revert")}
        </Button>
      </div>
      {open && (
        <div className="px-6 pb-5 pl-[60px]">
          {e.how_to_check && (
            <p className="text-[14px] text-dim mb-3">
              <span className="text-fg">{t("hist.whereCheck")} </span>
              {e.how_to_check}
            </p>
          )}
          <table className="w-full text-[13.5px] border-separate border-spacing-0">
            <thead>
              <tr className="text-faint text-left">
                <th className="font-normal pb-1.5 pr-4">{t("hist.col.setting")}</th>
                <th className="font-normal pb-1.5 pr-4 w-[18%]">{t("hist.col.before")}</th>
                <th className="font-normal pb-1.5 pr-4 w-[18%]">{t("hist.col.written")}</th>
                <th className="font-normal pb-1.5 w-[18%]">{t("hist.col.now")}</th>
              </tr>
            </thead>
            <tbody>
              {e.checks.map((c) => (
                <tr key={c.label} className="align-top">
                  <td className="py-1.5 pr-4 text-dim break-all select-text">{c.label}</td>
                  <td className="py-1.5 pr-4">{c.before}</td>
                  <td className="py-1.5 pr-4">{c.expected}</td>
                  <td className={`py-1.5 font-semibold ${statusInfo()[c.status].tone}`}>{c.now}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </li>
  );
}

export function HistoryPage() {
  const { notify, summarize, reloadTweaks, rescan } = useApp();
  const [checks, setChecks] = useState<EntryCheck[] | null>(null);
  const [reverted, setReverted] = useState<JournalEntry[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    try {
      const [c, h] = await Promise.all([api.verifyChanges(), api.history()]);
      setChecks(c);
      setReverted(h.filter((e) => e.reverted_at));
    } catch (e) {
      notify("bad", errorText(e));
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function revert(id: string) {
    setBusy(id);
    try {
      summarize(await api.revertTweaks([id]), "revertid");
      await Promise.all([load(), reloadTweaks(), rescan()]);
    } catch (e) {
      notify("bad", errorText(e));
    } finally {
      setBusy(null);
    }
  }

  async function restorePoint() {
    setBusy("rp");
    try {
      await api.createRestorePoint();
      notify("good", t("hist.rpCreated"));
    } catch (e) {
      notify("bad", errorText(e));
    } finally {
      setBusy(null);
    }
  }

  async function recheck() {
    setBusy("check");
    await load();
    setBusy(null);
  }

  if (!checks) return <Loading label={t("hist.loading")} />;

  const count = (s: CheckStatus) => checks.filter((c) => c.status === s).length;
  const ok = count("ok");
  const pending = count("pending_reboot");
  const changed = count("changed");

  return (
    <>
      <PageHeader
        title={t("nav.historico")}
        lead={t("hist.lead")}
        actions={
          <>
            <Button busy={busy === "check"} icon={<RefreshCw size={16} />} onClick={recheck}>
              {t("hist.recheck")}
            </Button>
            <Button busy={busy === "rp"} icon={<LifeBuoy size={16} />} onClick={restorePoint}>
              {t("hist.rp")}
            </Button>
          </>
        }
      />

      {checks.length === 0 ? (
        <Panel className="p-8 text-dim">{t("hist.empty")}</Panel>
      ) : (
        <>
          <Panel className="px-6 py-5 mb-4">
            <p className="text-[16.5px] leading-relaxed">
              <strong className="font-cond text-[19px]">{tn(checks.length, "hist.activeOne", "hist.activeMany")}</strong>{" "}
              <span className="text-good">{tn(ok, "hist.okOne", "hist.okMany")}</span>
              {pending > 0 && (
                <>
                  {", "}
                  <span className="text-amber">{tn(pending, "hist.pendOne", "hist.pendMany")}</span>
                </>
              )}
              {changed > 0 && (
                <>
                  {", "}
                  <span className="text-warn">{tn(changed, "hist.chgOne", "hist.chgMany")}</span>
                </>
              )}
              .
            </p>
            <p className="text-[14px] text-dim mt-2 max-w-[78ch]">
              {t("hist.note")}
            </p>
          </Panel>
          <Panel>
            <ul>
              {checks.map((e) => (
                <EntryRow key={e.entry_id} e={e} busy={busy === e.tweak_id} onRevert={() => revert(e.tweak_id)} />
              ))}
            </ul>
          </Panel>
        </>
      )}

      {reverted.length > 0 && (
        <details className="mt-6 group">
          <summary className="cursor-pointer text-[14.5px] text-dim hover:text-fg list-none flex items-center gap-2">
            <ChevronDown size={15} className="transition-transform group-open:rotate-180" />
            {tn(reverted.length, "hist.revOne", "hist.revMany")}
          </summary>
          <ul className="mt-3 space-y-1.5 pl-6">
            {reverted.map((e) => (
              <li key={e.id} className="text-[14px] text-faint">
                {e.title}, {t("hist.revertedAt", { d: fmtDateTime(e.reverted_at!) })}
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
