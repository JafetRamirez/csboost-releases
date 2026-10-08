import { useEffect, useState } from "react";
import { ChevronDown, CircleAlert, CircleCheck, Clock, HelpCircle, LifeBuoy, RefreshCw, RotateCcw } from "lucide-react";
import { Button, Loading, PageHeader, Panel } from "../components/ui";
import { api, errorText } from "../lib/api";
import { useApp } from "../lib/store";
import type { CheckStatus, EntryCheck, JournalEntry } from "../lib/types";

const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

const statusInfo: Record<CheckStatus, { icon: typeof CircleCheck; tone: string; text: string }> = {
  ok: { icon: CircleCheck, tone: "text-good", text: "Ativo no Windows" },
  pending_reboot: { icon: Clock, tone: "text-amber", text: "Gravado — vale depois de reiniciar" },
  changed: { icon: CircleAlert, tone: "text-warn", text: "Foi alterado depois" },
  unknown: { icon: HelpCircle, tone: "text-faint", text: "Não deu para conferir" },
};

function EntryRow({ e, busy, onRevert }: { e: EntryCheck; busy: boolean; onRevert: () => void }) {
  const [open, setOpen] = useState(false);
  const s = statusInfo[e.status];
  const Icon = s.icon;
  return (
    <li className="border-t border-line/60 first:border-t-0">
      <div className="flex items-center gap-4 px-6 py-4">
        <Icon size={20} className={`${s.tone} shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className="font-cond font-semibold text-[16px]">{e.title}</p>
          <p className="text-[13.5px] text-faint">
            <span className={s.tone}>{s.text}</span>, aplicado em {fmt.format(e.applied_at)}
          </p>
        </div>
        <Button variant="quiet" className="h-8 px-2.5 text-[14px]" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          Detalhes
          <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </Button>
        <Button variant="quiet" className="h-8 px-2.5 text-[14px]" busy={busy} icon={<RotateCcw size={14} />} onClick={onRevert}>
          Reverter
        </Button>
      </div>
      {open && (
        <div className="px-6 pb-5 pl-[60px]">
          {e.how_to_check && (
            <p className="text-[14px] text-dim mb-3">
              <span className="text-fg">Onde conferir no Windows: </span>
              {e.how_to_check}
            </p>
          )}
          <table className="w-full text-[13.5px] border-separate border-spacing-0">
            <thead>
              <tr className="text-faint text-left">
                <th className="font-normal pb-1.5 pr-4">Configuração</th>
                <th className="font-normal pb-1.5 pr-4 w-[18%]">Antes</th>
                <th className="font-normal pb-1.5 pr-4 w-[18%]">Gravado</th>
                <th className="font-normal pb-1.5 w-[18%]">Agora</th>
              </tr>
            </thead>
            <tbody>
              {e.checks.map((c) => (
                <tr key={c.label} className="align-top">
                  <td className="py-1.5 pr-4 text-dim break-all select-text">{c.label}</td>
                  <td className="py-1.5 pr-4">{c.before}</td>
                  <td className="py-1.5 pr-4">{c.expected}</td>
                  <td className={`py-1.5 font-semibold ${statusInfo[c.status].tone}`}>{c.now}</td>
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
      notify("good", "Ponto de restauração criado. O Windows guarda no máximo um a cada 24 horas.");
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

  if (!checks) return <Loading label="Conferindo no Windows o que foi aplicado…" />;

  const count = (s: CheckStatus) => checks.filter((c) => c.status === s).length;
  const ok = count("ok");
  const pending = count("pending_reboot");
  const changed = count("changed");

  return (
    <>
      <PageHeader
        title="Histórico"
        lead="Tudo o que o CSBoost mudou, conferido agora direto no Windows: o valor de antes, o que foi gravado e o que está lá neste momento."
        actions={
          <>
            <Button busy={busy === "check"} icon={<RefreshCw size={16} />} onClick={recheck}>
              Conferir de novo
            </Button>
            <Button busy={busy === "rp"} icon={<LifeBuoy size={16} />} onClick={restorePoint}>
              Ponto de restauração
            </Button>
          </>
        }
      />

      {checks.length === 0 ? (
        <Panel className="p-8 text-dim">Nenhum ajuste ativo. Quando você otimizar, cada mudança aparece aqui com o antes e o depois.</Panel>
      ) : (
        <>
          <Panel className="px-6 py-5 mb-4">
            <p className="text-[16.5px] leading-relaxed">
              <strong className="font-cond text-[19px]">{checks.length} {checks.length === 1 ? "ajuste ativo" : "ajustes ativos"}.</strong>{" "}
              <span className="text-good">{ok} {ok === 1 ? "confirmado" : "confirmados"} no Windows agora</span>
              {pending > 0 && (
                <>
                  {", "}
                  <span className="text-amber">{pending} {pending === 1 ? "só vale" : "só valem"} depois de reiniciar o PC</span>
                </>
              )}
              {changed > 0 && (
                <>
                  {", "}
                  <span className="text-warn">{changed} {changed === 1 ? "foi alterado" : "foram alterados"} por outro programa ou pelo Windows</span>
                </>
              )}
              .
            </p>
            <p className="text-[14px] text-dim mt-2 max-w-[78ch]">
              Ajustes do Windows deixam o sistema mais limpo e estável, mas sozinhos raramente mudam muito o FPS. O que mais pesa costuma estar no Raio-X (monitor em Hz errado, memória sem XMP, notebook na bateria). Para saber o ganho real no seu PC, compare o FPS antes e depois no mesmo mapa.
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
            {reverted.length} {reverted.length === 1 ? "ajuste revertido" : "ajustes revertidos"}
          </summary>
          <ul className="mt-3 space-y-1.5 pl-6">
            {reverted.map((e) => (
              <li key={e.id} className="text-[14px] text-faint">
                {e.title}, revertido em {fmt.format(e.reverted_at!)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
