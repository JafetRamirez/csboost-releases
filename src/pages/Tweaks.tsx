import { useMemo, useState } from "react";
import { Check, RotateCcw, Undo2 } from "lucide-react";
import { Button, Dot, Loading, PageHeader, Panel, Tag } from "../components/ui";
import { api, errorText } from "../lib/api";
import { categoryLabel, categoryOrder, evidenceLabel, presets, riskLabel } from "../lib/labels";
import { useApp } from "../lib/store";
import type { Preset, TweakView } from "../lib/types";
import { t as tr } from "../i18n";

const stateText = () => ({
  applied: { tone: "good" as const, text: tr("tw.state.applied") },
  partial: { tone: "warn" as const, text: tr("tw.state.partial") },
  not_applied: { tone: "faint" as const, text: tr("tw.state.off") },
  unknown: { tone: "faint" as const, text: tr("tw.state.unknown") },
});

export function Tweaks() {
  const { tweaks, reloadTweaks, rescan, notify, summarize } = useApp();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  const groups = useMemo(() => {
    const g = new Map<string, TweakView[]>();
    for (const c of categoryOrder) g.set(c, []);
    for (const t of tweaks ?? []) g.set(t.category, [...(g.get(t.category) ?? []), t]);
    return [...g.entries()].filter(([, list]) => list.length);
  }, [tweaks]);

  if (!tweaks) return <Loading label={tr("tw.loading")} />;

  const selectable = (t: TweakView) => t.supported && t.state !== "applied";
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const pickPreset = (p: Preset) =>
    setSelected(new Set(tweaks.filter((t) => selectable(t) && t.presets.includes(p)).map((t) => t.id)));

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    try {
      await fn();
      await Promise.all([reloadTweaks(), rescan()]);
    } catch (e) {
      notify("bad", errorText(e));
    } finally {
      setBusy(null);
    }
  }

  const managedCount = tweaks.filter((t) => t.managed).length;

  return (
    <>
      <PageHeader
        title={tr("nav.otimizacoes")}
        lead={tr("tw.lead")}
        actions={
          managedCount > 0 && (
            <Button
              variant="danger"
              busy={busy === "all"}
              icon={<Undo2 size={16} />}
              onClick={() => run("all", async () => summarize(await api.revertAll(), "revertid"))}
            >
              {tr("tw.revertAll")}
            </Button>
          )
        }
      />

      <div className="flex items-center gap-2 mb-5">
        <span className="text-[14px] text-dim mr-1">{tr("tw.pickMode")}</span>
        {[...presets(), { id: "avancado" as Preset, name: tr("tw.all") }].map((p) => (
          <button
            key={p.id}
            onClick={() => pickPreset(p.id)}
            className="h-8 px-3 rounded-lg border border-line text-[14px] font-cond font-semibold text-dim hover:text-fg hover:border-faint cursor-pointer"
          >
            {p.name}
          </button>
        ))}
        {selected.size > 0 && (
          <button onClick={() => setSelected(new Set())} className="ml-1 text-[14px] text-faint hover:text-fg cursor-pointer">
            {tr("tw.clear")}
          </button>
        )}
      </div>

      <div className="space-y-6 pb-24">
        {groups.map(([cat, list]) => (
          <Panel key={cat} className="overflow-hidden">
            <h2 className="font-cond font-bold text-[18px] px-6 pt-5 pb-2">{categoryLabel(cat)}</h2>
            <ul>
              {list.map((t) => {
                const st = stateText()[t.state];
                const canPick = selectable(t);
                const checked = selected.has(t.id);
                return (
                  <li key={t.id} className={`flex gap-4 px-6 py-4 border-t border-line/60 ${!t.supported ? "opacity-55" : ""}`}>
                    <button
                      role="checkbox"
                      aria-checked={checked || t.state === "applied"}
                      aria-label={tr("tw.selectAria", { name: t.title })}
                      disabled={!canPick}
                      onClick={() => toggle(t.id)}
                      className={`mt-0.5 size-[22px] shrink-0 rounded-md border-2 grid place-items-center transition-colors cursor-pointer disabled:cursor-default ${
                        checked
                          ? "bg-amber border-amber text-ink"
                          : t.state === "applied"
                            ? "bg-good/20 border-good/40 text-good"
                            : "border-faint hover:border-dim"
                      }`}
                    >
                      {(checked || t.state === "applied") && <Check size={15} strokeWidth={3} />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-cond font-bold text-[16.5px]">{t.title}</h3>
                        <Tag tone={t.risk === "safe" ? "faint" : "warn"}>{riskLabel(t.risk)}</Tag>
                        <Tag tone={t.evidence === "proven" ? "amber" : "faint"}>{evidenceLabel(t.evidence)}</Tag>
                        {t.requires_reboot && <Tag>{tr("tw.reboot")}</Tag>}
                      </div>
                      <p className="text-dim text-[14.5px] mt-1 max-w-[72ch]">{t.description}</p>
                      {t.unsupported_reason && <p className="text-[13.5px] text-warn mt-1">{t.unsupported_reason}</p>}
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1.5 w-[132px]">
                      <span className="flex items-center gap-2 text-[14px]">
                        <Dot tone={st.tone} /> {st.text}
                      </span>
                      {t.state === "applied" && !t.managed && <span className="text-[12.5px] text-faint text-right">{tr("tw.already")}</span>}
                      {t.managed && (
                        <Button
                          variant="quiet"
                          className="h-8 px-2.5 text-[14px]"
                          busy={busy === t.id}
                          icon={<RotateCcw size={14} />}
                          onClick={() => run(t.id, async () => summarize(await api.revertTweaks([t.id]), "revertid"))}
                        >
                          {tr("tw.revert")}
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="fixed bottom-6 left-[calc(248px+40px)] right-10 max-w-[1080px] z-40">
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-raised border border-line px-5 py-3 shadow-2xl shadow-black/50">
            <span className="text-[15px]">
              <strong className="font-cond text-amber text-[17px] num">{selected.size}</strong>{" "}
              {selected.size === 1 ? tr("tw.selOne") : tr("tw.selMany")}
            </span>
            <Button
              variant="primary"
              busy={busy === "apply"}
              onClick={() =>
                run("apply", async () => {
                  summarize(await api.applyTweaks([...selected]), "aplicad");
                  setSelected(new Set());
                })
              }
            >
              {tr("tw.applySel")}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
