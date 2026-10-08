import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, ClipboardCopy, Play, Trash2 } from "lucide-react";
import { Button, Loading, PageHeader, Panel } from "../components/ui";
import { api, errorText } from "../lib/api";
import { fmtNum, pctChange } from "../lib/format";
import { useApp } from "../lib/store";
import type { BenchRun } from "../lib/types";
import markUrl from "../assets/brand/mark.png";

// Paleta de 2 séries validada (dataviz) contra o fundo #181c36.
const C_A = "#6f84e0"; // medição mais antiga
const C_B = "#c9840c"; // medição mais nova

const fmtDate = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function Delta({ a, b, invert = false }: { a: number; b: number; invert?: boolean }) {
  const d = pctChange(a, b);
  const good = invert ? d < 0 : d > 0;
  if (Math.abs(d) < 0.5) return <span className="text-faint">igual</span>;
  return (
    <span className={good ? "text-good" : "text-bad"}>
      {d > 0 ? "+" : ""}
      {fmtNum(d, 1)}%
    </span>
  );
}

/** Gráfico de frametime: pico de cada trecho da medição (ms). Mais baixo e mais reto = mais liso. */
function FrametimeChart({ runs }: { runs: { run: BenchRun; color: string }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 960, H = 220, PL = 48, PB = 22, PT = 10;
  const max = Math.max(...runs.flatMap((r) => r.run.series), 1);
  const yMax = Math.max(10, Math.ceil(max / 10) * 10);
  const n = Math.max(...runs.map((r) => r.run.series.length));
  const x = (i: number) => PL + (i / Math.max(n - 1, 1)) * (W - PL - 8);
  const y = (v: number) => PT + (1 - v / yMax) * (H - PT - PB);
  const ticks = [0, yMax / 2, yMax];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Gráfico de frametime das medições comparadas"
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          const i = Math.round(((px - PL) / (W - PL - 8)) * (n - 1));
          setHover(i >= 0 && i < n ? i : null);
        }}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PL} x2={W - 8} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth={1} />
            <text x={PL - 8} y={y(t) + 4} textAnchor="end" fontSize="12" fill="var(--color-faint)">
              {fmtNum(t)} ms
            </text>
          </g>
        ))}
        <text x={PL} y={H - 4} fontSize="12" fill="var(--color-faint)">início</text>
        <text x={W - 8} y={H - 4} fontSize="12" fill="var(--color-faint)" textAnchor="end">fim</text>
        {runs.map(({ run, color }) => (
          <polyline
            key={run.id}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
            points={run.series.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
          />
        ))}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PT} y2={H - PB} stroke="var(--color-dim)" strokeWidth={1} />}
      </svg>
      {hover !== null && (
        <div
          className="absolute top-2 pointer-events-none rounded-lg bg-raised border border-line px-3 py-2 text-[13px] shadow-xl min-w-[160px]"
          style={{ left: `min(calc(${(x(hover) / W) * 100}% + 12px), calc(100% - 180px))` }}
        >
          {runs.map(({ run, color }) => (
            <div key={run.id} className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: color }} />
              <span className="text-dim">{run.label}</span>
              <span className="ml-auto num">{run.series[hover] != null ? `${fmtNum(run.series[hover], 1)} ms` : "—"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function copyShareCard(a: BenchRun, b: BenchRun) {
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = 630;
  const g = c.getContext("2d")!;
  g.fillStyle = "#11142a";
  g.fillRect(0, 0, 1200, 630);
  g.fillStyle = "#28397f";
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(380, 0);
  g.lineTo(320, 630);
  g.lineTo(0, 630);
  g.fill();
  const img = new Image();
  img.src = markUrl;
  await img.decode();
  g.drawImage(img, 60, 60, 120, 120);
  g.fillStyle = "#eef0f8";
  g.font = "bold 44px 'Barlow Semi Condensed', sans-serif";
  g.fillText("CSBoost", 60, 240);
  g.font = "26px Barlow, sans-serif";
  g.fillStyle = "#c8cde6";
  g.fillText("Benchmark no CS2", 60, 280);

  const rows: [string, number, number][] = [
    ["FPS médio", a.avg_fps, b.avg_fps],
    ["1% low", a.low1_fps, b.low1_fps],
    ["0,1% low", a.low01_fps, b.low01_fps],
  ];
  g.font = "24px Barlow, sans-serif";
  g.fillStyle = "#a3a9c9";
  g.fillText(a.label, 620, 110);
  g.fillStyle = "#f9ab19";
  g.fillText(b.label, 820, 110);
  rows.forEach(([label, va, vb], i) => {
    const yy = 200 + i * 130;
    g.fillStyle = "#a3a9c9";
    g.font = "24px Barlow, sans-serif";
    g.fillText(label, 410, yy);
    g.fillStyle = "#eef0f8";
    g.font = "bold 56px 'Barlow Semi Condensed', sans-serif";
    g.fillText(fmtNum(va), 620, yy + 8);
    g.fillText(fmtNum(vb), 820, yy + 8);
    const d = pctChange(va, vb);
    g.fillStyle = d >= 0 ? "#47c98c" : "#ff5d6c";
    g.font = "bold 30px Barlow, sans-serif";
    g.fillText(`${d >= 0 ? "+" : ""}${fmtNum(d, 1)}%`, 1010, yy);
  });
  g.fillStyle = "#6d7398";
  g.font = "20px Barlow, sans-serif";
  g.fillText(`${a.seconds} s de jogo em cada medição, medido com o PresentMon`, 410, 590);
  const blob: Blob = await new Promise((r) => c.toBlob((bl) => r(bl!), "image/png"));
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

export function Benchmark() {
  const { notify } = useApp();
  const [runs, setRuns] = useState<BenchRun[] | null>(null);
  const [cs2, setCs2] = useState(false);
  const [seconds, setSeconds] = useState(60);
  const [label, setLabel] = useState("Antes");
  const [measuring, setMeasuring] = useState<number | null>(null); // segundos restantes
  const [compare, setCompare] = useState<number[]>([]);
  const timer = useRef<number | null>(null);

  const load = async () => {
    const r = await api.benchList();
    setRuns(r);
    return r;
  };

  useEffect(() => {
    load()
      .then((r) => {
        if (r.length >= 2) setCompare([r[r.length - 2].id, r[r.length - 1].id]);
        if (r.length >= 1) setLabel("Depois");
      })
      .catch((e) => notify("bad", errorText(e)));
    const check = () => api.cs2Running().then(setCs2).catch(() => {});
    check();
    const t = setInterval(check, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    setMeasuring(seconds);
    const startedAt = Date.now();
    timer.current = window.setInterval(() => {
      setMeasuring(Math.max(0, seconds - Math.round((Date.now() - startedAt) / 1000)));
    }, 500);
    try {
      const r = await api.benchRun(seconds, label || "Medição");
      notify("good", `Medição "${r.label}" salva: ${fmtNum(r.avg_fps)} FPS médio, ${fmtNum(r.low1_fps)} no 1% low.`);
      const all = await load();
      if (all.length >= 2) setCompare([all[all.length - 2].id, all[all.length - 1].id]);
      setLabel("Depois");
    } catch (e) {
      notify("bad", errorText(e));
    } finally {
      if (timer.current) clearInterval(timer.current);
      setMeasuring(null);
    }
  }

  const pair = useMemo(() => {
    if (!runs) return null;
    const sel = compare.map((id) => runs.find((r) => r.id === id)).filter(Boolean) as BenchRun[];
    return sel.length === 2 ? sel.sort((a, b) => a.created_at - b.created_at) : null;
  }, [runs, compare]);

  if (!runs) return <Loading label="Carregando medições…" />;

  const toggle = (id: number) => setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c.slice(-1), id]));

  const metrics = [
    ["FPS médio", "avg_fps", false],
    ["1% low", "low1_fps", false],
    ["0,1% low", "low01_fps", false],
    ["Engasgos", "stutter_pct", true],
  ] as const;

  return (
    <>
      <PageHeader
        title="Benchmark"
        lead="Meça o FPS antes e depois de otimizar, jogando no mesmo mapa. É o jeito honesto de saber o ganho real no seu PC."
      />

      <Panel className="p-6">
        {measuring !== null ? (
          <div aria-live="polite">
            <p className="font-cond font-bold text-[20px]">Medindo "{label}"… continue jogando normalmente.</p>
            <p className="text-dim mt-1">Faltam {measuring} s. Deixe o CS2 em foco até o fim.</p>
            <div className="h-2 rounded-full bg-base mt-4 overflow-hidden">
              <div className="h-full bg-amber transition-[width] duration-500" style={{ width: `${((seconds - measuring) / seconds) * 100}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex items-end gap-4 flex-wrap">
            <label className="flex flex-col gap-1.5 text-[14px] text-dim">
              Nome da medição
              <input
                value={label}
                maxLength={40}
                onChange={(e) => setLabel(e.target.value)}
                className="h-10 w-48 rounded-lg bg-base border border-line px-3 text-fg text-[15px] focus:border-amber outline-none"
              />
            </label>
            <div className="flex flex-col gap-1.5 text-[14px] text-dim">
              Duração
              <div className="flex gap-1.5" role="radiogroup" aria-label="Duração">
                {[30, 60, 90].map((s) => (
                  <button
                    key={s}
                    role="radio"
                    aria-checked={seconds === s}
                    onClick={() => setSeconds(s)}
                    className={`h-10 px-4 rounded-lg border font-cond font-semibold cursor-pointer ${
                      seconds === s ? "border-amber text-amber bg-amber/10" : "border-line text-dim hover:text-fg"
                    }`}
                  >
                    {s} s
                  </button>
                ))}
              </div>
            </div>
            <Button variant="primary" className="h-10" icon={<Play size={16} fill="currentColor" />} disabled={!cs2} onClick={start}>
              Medir agora
            </Button>
            <p className="text-[14px] text-dim basis-full mt-1">
              {cs2
                ? "CS2 aberto. Clique em Medir, volte para o jogo e jogue normalmente, de preferência no mesmo mapa e modo em todas as medições."
                : "Abra o CS2 e entre num mapa para liberar a medição. Um mapa de treino ou deathmatch dá resultados mais fáceis de comparar."}
            </p>
          </div>
        )}
      </Panel>

      {pair && (
        <Panel className="p-6 mt-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="font-cond font-bold text-[20px]">
                {pair[0].label} × {pair[1].label}
              </h2>
              <p className="text-[14px] text-dim mt-0.5">Frametime ao longo da medição: linha mais baixa e mais reta significa jogo mais liso.</p>
            </div>
            <Button
              icon={<ClipboardCopy size={16} />}
              onClick={async () => {
                try {
                  await copyShareCard(pair[0], pair[1]);
                  notify("good", "Imagem copiada. Cole no Discord, WhatsApp ou Facebook com Ctrl+V.");
                } catch (e) {
                  notify("bad", `Não deu para copiar a imagem: ${errorText(e)}`);
                }
              }}
            >
              Copiar imagem
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-5">
            {metrics.map(([k, f, inv]) => (
              <div key={k} className="rounded-xl bg-raised/40 border border-line/70 p-4">
                <p className="text-[13.5px] text-dim">{k}</p>
                <p className="font-cond font-bold text-[24px] num mt-1">
                  {f === "stutter_pct" ? `${fmtNum(pair[1][f], 1)}%` : fmtNum(pair[1][f])}
                  <span className="text-[15px] ml-2 font-semibold">
                    <Delta a={pair[0][f]} b={pair[1][f]} invert={inv} />
                  </span>
                </p>
                <p className="text-[13px] text-faint num">
                  {pair[0].label}: {f === "stutter_pct" ? `${fmtNum(pair[0][f], 1)}%` : fmtNum(pair[0][f])}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-5 text-[14px] mb-2">
            {([
              [pair[0], C_A],
              [pair[1], C_B],
            ] as const).map(([r, c]) => (
              <span key={r.id} className="flex items-center gap-2">
                <span className="w-4 h-[3px] rounded-full" style={{ background: c }} />
                {r.label}
                <span className="text-faint">{fmtDate.format(r.created_at)}</span>
              </span>
            ))}
          </div>
          <FrametimeChart runs={[{ run: pair[0], color: C_A }, { run: pair[1], color: C_B }]} />
        </Panel>
      )}

      <Panel className="mt-6 overflow-hidden">
        <div className="px-6 pt-5 pb-2 flex items-baseline justify-between">
          <h2 className="font-cond font-bold text-[18px]">Medições</h2>
          {runs.length >= 2 && <span className="text-[13.5px] text-faint">Marque duas para comparar</span>}
        </div>
        {runs.length === 0 ? (
          <div className="px-6 pb-6 flex items-start gap-3 text-dim">
            <Activity size={18} className="text-amber mt-0.5 shrink-0" />
            Nenhuma medição ainda. Faça a primeira antes de otimizar, chamada "Antes", e depois outra chamada "Depois".
          </div>
        ) : (
          <table className="w-full text-[14.5px]">
            <thead>
              <tr className="text-faint text-left text-[13px]">
                <th className="font-normal pl-6 py-2 w-10"><span className="sr-only">Comparar</span></th>
                <th className="font-normal py-2">Medição</th>
                <th className="font-normal py-2 text-right">FPS médio</th>
                <th className="font-normal py-2 text-right">1% low</th>
                <th className="font-normal py-2 text-right">0,1% low</th>
                <th className="font-normal py-2 text-right">Engasgos</th>
                <th className="font-normal py-2 pr-6 w-12"><span className="sr-only">Apagar</span></th>
              </tr>
            </thead>
            <tbody>
              {runs
                .slice()
                .reverse()
                .map((r) => (
                  <tr key={r.id} className="border-t border-line/60">
                    <td className="pl-6 py-3">
                      <input
                        type="checkbox"
                        checked={compare.includes(r.id)}
                        onChange={() => toggle(r.id)}
                        aria-label={`Comparar ${r.label}`}
                        className="size-4 accent-[#f9ab19] cursor-pointer"
                      />
                    </td>
                    <td className="py-3">
                      <span className="font-cond font-semibold text-[15.5px]">{r.label}</span>
                      <span className="block text-[12.5px] text-faint">
                        {fmtDate.format(r.created_at)}, {r.seconds} s, {fmtNum(r.frames)} quadros
                      </span>
                    </td>
                    <td className="py-3 text-right num">{fmtNum(r.avg_fps)}</td>
                    <td className="py-3 text-right num">{fmtNum(r.low1_fps)}</td>
                    <td className="py-3 text-right num">{fmtNum(r.low01_fps)}</td>
                    <td className="py-3 text-right num">{fmtNum(r.stutter_pct, 1)}%</td>
                    <td className="pr-6 py-3 text-right">
                      <button
                        aria-label={`Apagar ${r.label}`}
                        className="text-faint hover:text-bad cursor-pointer"
                        onClick={async () => {
                          await api.benchDelete(r.id);
                          setCompare((c) => c.filter((x) => x !== r.id));
                          load();
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </Panel>
      <p className="text-[13px] text-faint mt-4 max-w-[80ch]">
        Medido com o PresentMon, ferramenta aberta da Intel que lê os eventos de vídeo do Windows sem encostar no processo do jogo. O 1% low é a média dos 1% de quadros mais lentos: quanto mais perto do FPS médio, mais estável o jogo.
      </p>
    </>
  );
}
