import { useEffect, useState } from "react";
import { Check, Clock, LoaderCircle, RotateCcw, Zap } from "lucide-react";
import { Gauge } from "../components/Gauge";
import { IssueCard } from "../components/IssueCard";
import { Button, Loading, Panel } from "../components/ui";
import type { Page } from "../components/Sidebar";
import { api, errorText } from "../lib/api";
import { presets, scoreVerdict } from "../lib/labels";
import { useApp } from "../lib/store";
import type { Preset } from "../lib/types";

type Step = { label: string; status: "wait" | "run" | "done" | "skip" };

export function Dashboard({ go }: { go: (p: Page) => void }) {
  const { report, tweaks, scanning, rescan, notify, summarize } = useApp();
  const [preset, setPreset] = useState<Preset>("seguro");
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [pendingReboot, setPendingReboot] = useState(0);

  // quantos ajustes já gravados só passam a valer depois de reiniciar
  useEffect(() => {
    api
      .verifyChanges()
      .then((c) => setPendingReboot(c.filter((x) => x.status === "pending_reboot").length))
      .catch(() => {});
  }, [report]);

  if (!report || !tweaks) return <Loading label="Analisando o seu PC…" />;

  const pending = tweaks.filter((t) => t.supported && t.presets.includes(preset) && t.state !== "applied");
  const running = steps?.some((s) => s.status === "run") ?? false;

  async function optimize() {
    const plan: Step[] = [
      { label: "Criar ponto de restauração do Windows", status: "wait" },
      { label: `Aplicar ${pending.length} ${pending.length === 1 ? "ajuste" : "ajustes"} do modo ${presets.find((p) => p.id === preset)!.name}`, status: "wait" },
      { label: "Analisar o PC de novo", status: "wait" },
    ];
    const set = (i: number, status: Step["status"]) => {
      plan[i] = { ...plan[i], status };
      setSteps([...plan]);
    };
    setSteps([...plan]);

    set(0, "run");
    try {
      await api.createRestorePoint();
      set(0, "done");
    } catch (e) {
      set(0, "skip");
      notify("info", `Ponto de restauração não criado (${errorText(e)}). Seguimos — o CSBoost guarda o próprio backup de cada ajuste.`);
    }

    set(1, "run");
    try {
      summarize(await api.applyTweaks(pending.map((t) => t.id)), "aplicad");
      set(1, "done");
    } catch (e) {
      set(1, "skip");
      notify("bad", errorText(e));
    }

    set(2, "run");
    await rescan();
    set(2, "done");
  }

  const hw = report.hardware;
  const ramGb = hw.ram_modules.reduce((s, m) => s + m.capacity_gb, 0);
  const ramMts = Math.min(...hw.ram_modules.map((m) => m.configured_mts ?? Infinity));
  const display = report.displays.find((d) => d.primary) ?? report.displays[0];
  const topIssues = report.issues.filter((i) => i.severity !== "info").slice(0, 3);

  const specs: [string, string][] = [
    ["Processador", hw.cpu ? `${hw.cpu}` : "—"],
    ["Placa de vídeo", hw.gpus.map((g) => g.name).join(" + ") || "—"],
    ["Memória", ramGb ? `${ramGb.toFixed(0)} GB em ${hw.ram_modules.length} ${hw.ram_modules.length === 1 ? "pente" : "pentes"}${isFinite(ramMts) ? `, ${ramMts} MT/s` : ""}` : "—"],
    ["Monitor", display ? `${display.width}×${display.height} a ${display.current_hz} Hz` : "—"],
    ["Energia", report.power_plan.name],
    ["Sistema", hw.os_name ? `${hw.os_name.replace("Microsoft ", "")} (build ${hw.os_build})` : "—"],
  ];

  return (
    <div className="space-y-6">
      {/* Bloco principal: a divisão marinho/painel ecoa o recorte do logo */}
      <Panel className="relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-[42%] bg-navy bolt-cut" aria-hidden />
        <div className="relative grid grid-cols-[minmax(0,42%)_1fr] items-center">
          <div className="flex flex-col items-center py-9 pr-12">
            <Gauge score={report.score} />
            <p className="font-cond font-semibold text-[18px] text-center mt-2 max-w-[24ch] leading-snug">{scoreVerdict(report.score)}</p>
            <button
              onClick={rescan}
              disabled={scanning || running}
              className="mt-3 inline-flex items-center gap-1.5 text-[14px] text-fg/70 hover:text-fg cursor-pointer disabled:opacity-50"
            >
              <RotateCcw size={14} className={scanning ? "spin" : ""} /> Analisar de novo
            </button>
          </div>

          <div className="py-9 pr-9 pl-4">
            <h2 className="font-display text-[26px] leading-tight">Otimizar para o CS2</h2>
            <p className="text-dim mt-2 text-[15px] max-w-[52ch]">
              Escolha o modo. Antes de mudar qualquer coisa o CSBoost cria um ponto de restauração e guarda o valor antigo de cada ajuste — dá para desfazer tudo em Histórico.
            </p>

            <div role="radiogroup" aria-label="Modo de otimização" className="grid grid-cols-3 gap-2 mt-5">
              {presets.map((p) => {
                const on = p.id === preset;
                return (
                  <button
                    key={p.id}
                    role="radio"
                    aria-checked={on}
                    onClick={() => setPreset(p.id)}
                    className={`text-left rounded-xl border px-3.5 py-3 transition-colors cursor-pointer ${
                      on ? "border-amber bg-amber/10" : "border-line hover:border-faint"
                    }`}
                  >
                    <span className={`font-cond font-bold text-[16px] ${on ? "text-amber" : ""}`}>{p.name}</span>
                    <span className="block text-[13px] text-dim leading-snug mt-1">{p.blurb}</span>
                  </button>
                );
              })}
            </div>

            {steps ? (
              <ul className="mt-6 space-y-2.5" aria-live="polite">
                {steps.map((s) => (
                  <li key={s.label} className={`flex items-center gap-3 text-[15px] ${s.status === "wait" ? "text-faint" : ""}`}>
                    <span className="size-5 grid place-items-center">
                      {s.status === "run" && <LoaderCircle size={18} className="spin text-amber" />}
                      {s.status === "done" && <Check size={18} className="text-good" />}
                      {s.status === "skip" && <span className="size-2 rounded-full bg-warn" />}
                      {s.status === "wait" && <span className="size-2 rounded-full bg-faint" />}
                    </span>
                    {s.label}
                  </li>
                ))}
                {!running && (
                  <li className="pt-2 flex gap-2">
                    <Button variant="ghost" onClick={() => setSteps(null)}>Concluir</Button>
                    <Button variant="quiet" onClick={() => go("historico")}>Ver o que mudou</Button>
                  </li>
                )}
              </ul>
            ) : (
              <div className="mt-6 flex items-center gap-4">
                <Button
                  variant="primary"
                  className="h-14 px-8 text-[19px] rounded-xl"
                  icon={<Zap size={20} fill="currentColor" />}
                  disabled={pending.length === 0}
                  onClick={optimize}
                >
                  Otimizar agora
                </Button>
                <span className="text-[14px] text-dim">
                  {pending.length === 0
                    ? "Tudo deste modo já está aplicado."
                    : `${pending.length} ${pending.length === 1 ? "ajuste pendente" : "ajustes pendentes"}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </Panel>

      {pendingReboot > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber/30 bg-amber/5 px-5 py-3 text-[15px]">
          <Clock size={18} className="text-amber shrink-0" />
          <span className="flex-1">
            {pendingReboot} {pendingReboot === 1 ? "ajuste já foi gravado, mas só vale" : "ajustes já foram gravados, mas só valem"} depois de reiniciar o PC.
          </span>
          <button className="text-[14px] text-amber hover:underline cursor-pointer" onClick={() => go("historico")}>
            Ver o que mudou
          </button>
        </div>
      )}

      <div className="grid grid-cols-[1.45fr_1fr] gap-6">
        <Panel className="p-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-cond font-bold text-[20px]">O que mais pesa agora</h2>
            <button className="text-[14px] text-amber hover:underline cursor-pointer" onClick={() => go("raiox")}>
              Ver Raio-X completo
            </button>
          </div>
          {topIssues.length ? (
            <div className="space-y-3">
              {topIssues.map((i) => (
                <IssueCard key={i.id} issue={i} compact />
              ))}
            </div>
          ) : (
            <p className="text-dim py-6">Nenhum problema encontrado. Rode um benchmark para conferir o resultado no jogo.</p>
          )}
        </Panel>

        <Panel className="p-6">
          <h2 className="font-cond font-bold text-[20px] mb-4">Seu PC</h2>
          <dl className="space-y-3.5">
            {specs.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[13px] text-faint">{k}</dt>
                <dd className="text-[15px] leading-snug">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </div>
  );
}
