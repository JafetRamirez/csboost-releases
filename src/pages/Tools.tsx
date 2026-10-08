import { useEffect, useRef, useState } from "react";
import { MousePointer2, Sparkles, TriangleAlert } from "lucide-react";
import { Button, Loading, PageHeader, Panel } from "../components/ui";
import { api, errorText } from "../lib/api";
import { fmtBytes, fmtNum } from "../lib/format";
import { useApp } from "../lib/store";
import type { CleanTarget } from "../lib/types";

function Cleanup() {
  const { notify } = useApp();
  const [targets, setTargets] = useState<CleanTarget[] | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const scan = async () => {
    setTargets(null);
    try {
      const t = await api.cleanupScan();
      setTargets(t);
      setSel(new Set(t.filter((x) => x.selected_by_default && x.bytes > 0).map((x) => x.id)));
    } catch (e) {
      notify("bad", errorText(e));
      setTargets([]);
    }
  };
  useEffect(() => {
    scan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = (targets ?? []).filter((t) => sel.has(t.id)).reduce((s, t) => s + t.bytes, 0);

  async function run() {
    setBusy(true);
    try {
      const r = await api.cleanupRun([...sel]);
      notify(
        "good",
        `${fmtBytes(r.freed_bytes)} liberados (${fmtNum(r.deleted_files)} arquivos).${r.skipped_files ? ` ${fmtNum(r.skipped_files)} estavam em uso e ficaram.` : ""}`,
      );
      await scan();
    } catch (e) {
      notify("bad", errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel className="overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
        <div>
          <h2 className="font-cond font-bold text-[20px]">Limpeza</h2>
          <p className="text-[14.5px] text-dim mt-0.5 max-w-[62ch]">
            Apaga só arquivos temporários e caches que o Windows recria. Seus documentos e o jogo não são tocados. Limpeza não tem como desfazer.
          </p>
        </div>
        <Button variant="primary" busy={busy} disabled={!targets || sel.size === 0 || total === 0} icon={<Sparkles size={16} />} onClick={run}>
          Limpar {total > 0 ? fmtBytes(total) : ""}
        </Button>
      </div>
      {!targets ? (
        <Loading label="Calculando espaço…" />
      ) : (
        <ul>
          {targets.map((t) => {
            const on = sel.has(t.id);
            return (
              <li key={t.id} className="flex gap-4 px-6 py-3.5 border-t border-line/60">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-[#f9ab19] cursor-pointer"
                  checked={on}
                  disabled={t.bytes === 0}
                  onChange={() =>
                    setSel((s) => {
                      const n = new Set(s);
                      if (n.has(t.id)) n.delete(t.id);
                      else n.add(t.id);
                      return n;
                    })
                  }
                  aria-label={t.label}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-cond font-semibold text-[16px]">{t.label}</p>
                  <p className="text-[14px] text-dim">{t.description}</p>
                  {t.warning && on && (
                    <p className="text-[13.5px] text-warn mt-1 flex items-start gap-1.5">
                      <TriangleAlert size={15} className="mt-0.5 shrink-0" /> {t.warning}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-cond font-bold text-[16px] num">{t.bytes ? fmtBytes(t.bytes) : "vazio"}</p>
                  {t.files > 0 && <p className="text-[12.5px] text-faint num">{fmtNum(t.files)} arquivos</p>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

/** Mede a taxa de polling do mouse pelos eventos que chegam na janela do CSBoost. */
function MouseTest() {
  const [hz, setHz] = useState(0);
  const [peak, setPeak] = useState(0);
  const stamps = useRef<number[]>([]);
  const area = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = area.current!;
    const onMove = (e: PointerEvent) => {
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of evs) stamps.current.push(ev.timeStamp);
    };
    el.addEventListener("pointermove", onMove);
    const t = setInterval(() => {
      const now = performance.now();
      stamps.current = stamps.current.filter((s) => now - s < 500);
      const rate = Math.round(stamps.current.length * 2);
      setHz(rate);
      setPeak((p) => Math.max(p, rate));
    }, 250);
    return () => {
      el.removeEventListener("pointermove", onMove);
      clearInterval(t);
    };
  }, []);

  const verdict =
    peak === 0
      ? "Mexa o mouse em círculos rápidos dentro da área."
      : peak < 200
        ? "Parece estar em 125 Hz. Se o seu mouse é gamer, aumente a taxa de polling no software do fabricante (1000 Hz é o padrão dos pros)."
        : peak < 600
          ? "Por volta de 500 Hz. Dá para subir para 1000 Hz no software do mouse."
          : "1000 Hz ou mais. Está ótimo.";

  return (
    <Panel className="p-6">
      <h2 className="font-cond font-bold text-[20px]">Teste do mouse</h2>
      <p className="text-[14.5px] text-dim mt-0.5">Estima a taxa de polling: quantas vezes por segundo o mouse informa a posição.</p>
      <div className="grid grid-cols-[1fr_220px] gap-5 mt-4">
        <div
          ref={area}
          className="h-48 rounded-xl border-2 border-dashed border-line bg-base grid place-items-center text-dim select-none cursor-crosshair"
        >
          <span className="flex items-center gap-2">
            <MousePointer2 size={18} /> Mexa o mouse rápido aqui dentro
          </span>
        </div>
        <div className="flex flex-col justify-center gap-3">
          <div>
            <p className="text-[13.5px] text-dim">Agora</p>
            <p className="font-display text-[34px] leading-none num">{fmtNum(hz)} <span className="text-[16px] font-cond text-dim">Hz</span></p>
          </div>
          <div>
            <p className="text-[13.5px] text-dim">Pico</p>
            <p className="font-cond font-bold text-[22px] num">{fmtNum(peak)} Hz</p>
          </div>
          <button onClick={() => setPeak(0)} className="text-left text-[13.5px] text-faint hover:text-fg cursor-pointer">
            Zerar
          </button>
        </div>
      </div>
      <p className="text-[14px] mt-3">{verdict}</p>
      <p className="text-[12.5px] text-faint mt-1">Estimativa pelo Windows: acima de 1000 Hz o valor pode aparecer menor do que o real.</p>
    </Panel>
  );
}

export function ToolsPage() {
  return (
    <>
      <PageHeader title="Ferramentas" lead="Limpeza de arquivos inúteis e teste do mouse." />
      <div className="space-y-6">
        <Cleanup />
        <MouseTest />
      </div>
    </>
  );
}
