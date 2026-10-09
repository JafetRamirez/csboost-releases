import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import data from "../../catalog/pros.json";
import { CopyButton } from "../components/CopyButton";
import { PageHeader, Panel } from "../components/ui";
import { openUrl } from "../lib/api";
import { fmtNum } from "../lib/format";
import type { ProPlayer } from "../lib/types";

const players = (data.players as unknown as ProPlayer[]).slice().sort((a, b) => a.nick.localeCompare(b.nick, "pt-BR", { sensitivity: "base" }));
const DEFAULT_VIEWMODEL = ["viewmodel_fov 68", "viewmodel_offset_x 2.5", "viewmodel_offset_y 0", "viewmodel_offset_z -1.5"];
const fmtDate = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("pt-BR");

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  if (v === null || v === undefined || v === "") return null;
  return (
    <div className="flex justify-between gap-4 py-2 border-t border-line/50 first:border-t-0 text-[14.5px]">
      <dt className="text-dim">{k}</dt>
      <dd className="text-right num">{v}</dd>
    </div>
  );
}

function Block({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line/70 bg-raised/30 p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="font-cond font-bold text-[16.5px]">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Commands({ lines }: { lines: string[] }) {
  return (
    <pre className="rounded-lg bg-base border border-line px-3 py-2.5 text-[13.5px] leading-relaxed font-[Consolas,monospace] text-fg/90 whitespace-pre-wrap select-text">
      {lines.join("\n")}
    </pre>
  );
}

function SensConverter({ p }: { p: ProPlayer }) {
  const [dpi, setDpi] = useState(800);
  const edpi = p.mouse.edpi ?? (p.mouse.dpi && p.mouse.sens ? p.mouse.dpi * p.mouse.sens : null);
  if (!edpi) return null;
  const sens = dpi > 0 ? edpi / dpi : 0;
  const sensStr = sens.toFixed(3).replace(/\.?0+$/, "");
  return (
    <div className="mt-3 rounded-lg bg-base border border-line p-3">
      <p className="text-[14px] text-dim">Mesma sensibilidade do {p.nick} no seu mouse</p>
      <div className="flex items-center gap-3 mt-2">
        <label className="flex items-center gap-2 text-[14px]">
          Seu DPI
          <input
            type="number"
            min={100}
            max={32000}
            step={50}
            value={dpi}
            onChange={(e) => setDpi(Number(e.target.value))}
            className="w-24 h-8 rounded-lg bg-raised border border-line px-2 num focus:border-amber outline-none"
          />
        </label>
        <span className="text-[14px] text-dim">→</span>
        <code className="text-amber text-[15px] font-semibold num select-text">sensitivity {sensStr}</code>
        <CopyButton text={`sensitivity ${sensStr}`} className="ml-auto" />
      </div>
    </div>
  );
}

function Detail({ p }: { p: ProPlayer }) {
  const isDefaultVm = p.viewmodel.commands.length === 4 && p.viewmodel.commands.every((c, i) => c === DEFAULT_VIEWMODEL[i]);
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-[30px] leading-none">{p.nick}</p>
          <p className="text-dim text-[15px] mt-2">
            {[p.name, p.team ?? "Sem time", p.country_name].filter(Boolean).join(", ")}
          </p>
        </div>
        <p className="text-[13px] text-faint text-right">
          Conferido em {fmtDate(p.checked)}
          <br />
          {p.sources.map((s) => (
            <button key={s} onClick={() => openUrl(s)} className="inline-flex items-center gap-1 hover:text-fg cursor-pointer">
              {new URL(s).hostname.replace("www.", "")} <ExternalLink size={12} />
            </button>
          ))}
        </p>
      </div>

      <Block title="Mira" action={p.crosshair.code && <CopyButton text={p.crosshair.code} label="Copiar código" />}>
        {p.crosshair.code && (
          <code className="block text-[18px] font-semibold text-amber tracking-wide select-text">{p.crosshair.code}</code>
        )}
        <p className="text-[13.5px] text-dim mt-1.5">
          No CS2: Configurações › Jogo › Mira › Compartilhar ou importar › cole o código. O código traz a mira completa, com cor e opacidade.
        </p>
        {p.crosshair.commands.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13.5px] text-faint">Ou pelo console (formato básico, sem a cor)</span>
              <CopyButton text={p.crosshair.commands.join("; ")} label="Copiar comandos" />
            </div>
            <Commands lines={p.crosshair.commands} />
          </div>
        )}
      </Block>

      <div className="grid grid-cols-2 gap-4">
        <Block title="Mouse e sensibilidade">
          <dl>
            <Row k="DPI" v={p.mouse.dpi} />
            <Row k="Sensibilidade" v={p.mouse.sens != null ? fmtNum(p.mouse.sens, String(p.mouse.sens).split(".")[1]?.length ?? 0) : null} />
            <Row k="eDPI" v={p.mouse.edpi} />
            <Row k="Sensibilidade com zoom" v={p.mouse.zoom_sens != null ? fmtNum(p.mouse.zoom_sens, 2) : null} />
            <Row k="Taxa de polling" v={p.mouse.polling_hz ? `${p.mouse.polling_hz} Hz` : null} />
          </dl>
          <SensConverter p={p} />
        </Block>

        <Block title="Monitor e resolução">
          <dl>
            <Row k="Resolução" v={p.monitor.resolution} />
            <Row k="Proporção" v={p.monitor.aspect} />
            <Row k="Escala" v={p.monitor.scaling} />
            <Row k="Taxa de atualização" v={p.monitor.hz ? `${p.monitor.hz} Hz` : null} />
          </dl>
        </Block>
      </div>

      <Block title="Viewmodel" action={<CopyButton text={p.viewmodel.commands.join("; ")} label="Copiar comandos" />}>
        <Commands lines={p.viewmodel.commands} />
        {isDefaultVm && <p className="text-[13.5px] text-dim mt-1.5">É o viewmodel padrão do CS2.</p>}
      </Block>

      {p.video && (
        <Block title="Vídeo no jogo">
          <dl className="grid grid-cols-2 gap-x-8">
            {Object.entries(p.video).map(([k, v]) => (
              <Row key={k} k={k} v={v} />
            ))}
          </dl>
        </Block>
      )}

      {p.launch_options && (
        <Block title="Opções de inicialização" action={<CopyButton text={p.launch_options} />}>
          <Commands lines={[p.launch_options]} />
        </Block>
      )}

      {p.gear && (
        <Block title="Periféricos">
          <dl>
            <Row k="Mouse" v={p.gear.mouse} />
            <Row k="Mousepad" v={p.gear.mousepad} />
            <Row k="Teclado" v={p.gear.keyboard} />
            <Row k="Monitor" v={p.gear.monitor} />
            <Row k="Headset" v={p.gear.headset} />
          </dl>
        </Block>
      )}

      {p.notes && <p className="text-[13.5px] text-faint">{p.notes}</p>}
    </div>
  );
}

export function ProsPage() {
  const [q, setQ] = useState("");
  const [onlyBr, setOnlyBr] = useState(false);
  const [sel, setSel] = useState(players.find((p) => p.id === "fallen")?.id ?? players[0].id);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return players.filter(
      (p) =>
        (!onlyBr || p.country === "BR") &&
        (!t || [p.nick, p.name ?? "", p.team ?? ""].some((s) => s.toLowerCase().includes(t))),
    );
  }, [q, onlyBr]);
  const current = players.find((p) => p.id === sel)!;

  return (
    <>
      <PageHeader
        title="Configs de pros"
        lead="Mira, sensibilidade, viewmodel e vídeo dos jogadores mais conhecidos. Nada é aplicado sozinho: você vê e copia o que quiser."
      />
      <div className="grid grid-cols-[260px_1fr] gap-6 items-start">
        <Panel className="p-3 sticky top-0">
          <label className="flex items-center gap-2 h-10 rounded-lg bg-base border border-line px-3 focus-within:border-amber">
            <Search size={16} className="text-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar jogador ou time"
              className="flex-1 bg-transparent outline-none text-[14.5px] placeholder:text-faint"
            />
          </label>
          <div className="flex gap-1.5 mt-2" role="radiogroup" aria-label="Filtro">
            {[
              [false, "Todos"],
              [true, "Brasileiros"],
            ].map(([v, l]) => (
              <button
                key={String(v)}
                role="radio"
                aria-checked={onlyBr === v}
                onClick={() => setOnlyBr(v as boolean)}
                className={`h-8 px-3 rounded-lg text-[13.5px] font-cond font-semibold cursor-pointer ${
                  onlyBr === v ? "bg-amber/15 text-amber" : "text-dim hover:text-fg"
                }`}
              >
                {l as string}
              </button>
            ))}
          </div>
          <ul className="mt-2 max-h-[calc(100vh-300px)] overflow-y-auto scroll -mr-1 pr-1">
            {list.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => setSel(p.id)}
                  aria-current={p.id === sel}
                  className={`w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-left cursor-pointer transition-colors ${
                    p.id === sel ? "bg-raised" : "hover:bg-raised/50"
                  }`}
                >
                  <span className="w-7 text-[11.5px] font-semibold text-faint text-center rounded bg-base py-0.5">{p.country}</span>
                  <span className="flex-1 min-w-0">
                    <span className={`block font-cond font-bold text-[15.5px] ${p.id === sel ? "text-amber" : ""}`}>{p.nick}</span>
                    <span className="block text-[12.5px] text-faint truncate">{p.team ?? "Sem time"}</span>
                  </span>
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="text-[14px] text-faint px-2 py-4">Nenhum jogador encontrado.</li>}
          </ul>
        </Panel>

        <Panel className="p-6">
          <Detail p={current} />
        </Panel>
      </div>
      <p className="text-[13px] text-faint mt-4 max-w-[80ch]">
        Dados públicos compilados do csdb.gg (e do Draft5 no caso do snow), conferidos em {fmtDate(data.updated)}. Pros mudam de config com frequência; as próximas atualizações do CSBoost trazem a lista revisada.
      </p>
    </>
  );
}
