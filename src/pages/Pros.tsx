import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import data from "../../catalog/pros.json";
import { CopyButton } from "../components/CopyButton";
import { PageHeader, Panel } from "../components/ui";
import { openUrl } from "../lib/api";
import { fmtDate, fmtNum } from "../lib/format";
import type { ProPlayer } from "../lib/types";
import { locale, t, type Key } from "../i18n";

const players = (data.players as unknown as ProPlayer[]).slice().sort((a, b) => a.nick.localeCompare(b.nick, "en", { sensitivity: "base" }));
const DEFAULT_VIEWMODEL = ["viewmodel_fov 68", "viewmodel_offset_x 2.5", "viewmodel_offset_y 0", "viewmodel_offset_z -1.5"];

// O pros.json guarda os rótulos de vídeo em português; aqui viram chaves.
const videoKeys: Record<string, Key> = {
  Brilho: "pros.video.brightness",
  "Realçar contraste dos jogadores": "pros.video.boostContrast",
  "V-Sync": "pros.video.vsync",
  "Anti-aliasing": "pros.video.aa",
  "Qualidade das sombras": "pros.video.shadowQuality",
  "Detalhe de texturas": "pros.video.textureDetail",
  "Filtragem de texturas": "pros.video.textureFilter",
  "Detalhe de shaders": "pros.video.shaderDetail",
  "Sombras dinâmicas": "pros.video.dynShadows",
  "NVIDIA Reflex": "pros.video.reflex",
  "FPS máximo": "pros.video.fpsMax",
  "Detalhe de partículas": "pros.video.particles",
  "Oclusão de ambiente": "pros.video.ao",
  "FidelityFX Super Resolution": "pros.video.fsr",
};
const valueKeys: Record<string, Key> = {
  Baixa: "pros.val.low",
  Média: "pros.val.medium",
  Alta: "pros.val.high",
  "Muito alta": "pros.val.veryHigh",
  Ativado: "pros.val.on",
  Desativado: "pros.val.off",
  "Ativado + Boost": "pros.val.onBoost",
  Todas: "pros.val.all",
  Nenhum: "pros.val.none",
  "Desativado (qualidade máxima)": "pros.val.fsrOff",
  "Sem limite (0)": "pros.val.unlimited",
  Esticado: "pros.val.stretched",
  Nativo: "pros.val.native",
  "Barras pretas": "pros.val.blackBars",
};
const tv = (v: string | null) => (v && valueKeys[v] ? t(valueKeys[v]) : v);
const country = (code: string, fallback: string) => {
  try {
    return new Intl.DisplayNames([locale()], { type: "region" }).of(code) ?? fallback;
  } catch {
    return fallback;
  }
};
function noteText(p: ProPlayer): string | null {
  if (!p.notes) return null;
  const parts: string[] = [];
  if (p.id === "snow") parts.push(t("pros.noteSnow"));
  if (p.notes.includes("allow_third_party_software")) parts.push(t("pros.noteTrusted"));
  return parts.length ? parts.join(" ") : p.notes;
}

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
      <p className="text-[14px] text-dim">{t("pros.sameSens", { nick: p.nick })}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2">
        <label className="flex items-center gap-2 text-[14px] whitespace-nowrap">
          {t("pros.yourDpi")}
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
        <code className="text-amber text-[15px] font-semibold num select-text whitespace-nowrap">sensitivity {sensStr}</code>
        <CopyButton text={`sensitivity ${sensStr}`} className="ml-auto shrink-0" />
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
            {[p.name, p.team ?? t("pros.noTeam"), country(p.country, p.country_name)].filter(Boolean).join(", ")}
          </p>
        </div>
        <p className="text-[13px] text-faint text-right">
          {t("pros.checked", { d: fmtDate(p.checked) })}
          <br />
          {p.sources.map((s) => (
            <button key={s} onClick={() => openUrl(s)} className="inline-flex items-center gap-1 hover:text-fg cursor-pointer">
              {new URL(s).hostname.replace("www.", "")} <ExternalLink size={12} />
            </button>
          ))}
        </p>
      </div>

      <Block title={t("pros.crosshair")} action={p.crosshair.code && <CopyButton text={p.crosshair.code} label={t("pros.copyCode")} />}>
        {p.crosshair.code && (
          <code className="block text-[18px] font-semibold text-amber tracking-wide select-text">{p.crosshair.code}</code>
        )}
        <p className="text-[13.5px] text-dim mt-1.5">
          {t("pros.crosshairHow")}
        </p>
        {p.crosshair.commands.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13.5px] text-faint">{t("pros.console")}</span>
              <CopyButton text={p.crosshair.commands.join("; ")} label={t("pros.copyCmds")} />
            </div>
            <Commands lines={p.crosshair.commands} />
          </div>
        )}
      </Block>

      <div className="grid grid-cols-2 gap-4">
        <Block title={t("pros.mouse")}>
          <dl>
            <Row k="DPI" v={p.mouse.dpi} />
            <Row k={t("pros.sens")} v={p.mouse.sens != null ? fmtNum(p.mouse.sens, String(p.mouse.sens).split(".")[1]?.length ?? 0) : null} />
            <Row k="eDPI" v={p.mouse.edpi} />
            <Row k={t("pros.zoomSens")} v={p.mouse.zoom_sens != null ? fmtNum(p.mouse.zoom_sens, 2) : null} />
            <Row k={t("pros.polling")} v={p.mouse.polling_hz ? `${p.mouse.polling_hz} Hz` : null} />
          </dl>
          <SensConverter p={p} />
        </Block>

        <Block title={t("pros.monitor")}>
          <dl>
            <Row k={t("pros.resolution")} v={p.monitor.resolution} />
            <Row k={t("pros.aspect")} v={p.monitor.aspect} />
            <Row k={t("pros.scaling")} v={tv(p.monitor.scaling)} />
            <Row k={t("pros.refresh")} v={p.monitor.hz ? `${p.monitor.hz} Hz` : null} />
          </dl>
        </Block>
      </div>

      <Block title="Viewmodel" action={<CopyButton text={p.viewmodel.commands.join("; ")} label={t("pros.copyCmds")} />}>
        <Commands lines={p.viewmodel.commands} />
        {isDefaultVm && <p className="text-[13.5px] text-dim mt-1.5">{t("pros.defaultVm")}</p>}
      </Block>

      {p.video && (
        <Block title={t("pros.video")}>
          <dl className="grid grid-cols-2 gap-x-8">
            {Object.entries(p.video).map(([k, v]) => (
              <Row key={k} k={videoKeys[k] ? t(videoKeys[k]) : k} v={tv(v)} />
            ))}
          </dl>
        </Block>
      )}

      {p.launch_options && (
        <Block title={t("cs2.launchTitle")} action={<CopyButton text={p.launch_options} />}>
          <Commands lines={[p.launch_options]} />
        </Block>
      )}

      {p.gear && (
        <Block title={t("pros.gear")}>
          <dl>
            <Row k="Mouse" v={p.gear.mouse} />
            <Row k="Mousepad" v={p.gear.mousepad} />
            <Row k={t("pros.keyboard")} v={p.gear.keyboard} />
            <Row k="Monitor" v={p.gear.monitor} />
            <Row k="Headset" v={p.gear.headset} />
          </dl>
        </Block>
      )}

      {p.notes && <p className="text-[13.5px] text-faint">{noteText(p)}</p>}
    </div>
  );
}

export function ProsPage() {
  const [q, setQ] = useState("");
  const [onlyBr, setOnlyBr] = useState(false);
  const [sel, setSel] = useState(players.find((p) => p.id === "fallen")?.id ?? players[0].id);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return players.filter(
      (p) =>
        (!onlyBr || p.country === "BR") &&
        (!term || [p.nick, p.name ?? "", p.team ?? ""].some((s) => s.toLowerCase().includes(term))),
    );
  }, [q, onlyBr]);
  const current = players.find((p) => p.id === sel)!;

  return (
    <>
      <PageHeader
        title={t("nav.pros")}
        lead={t("pros.lead")}
      />
      <div className="grid grid-cols-[260px_1fr] gap-6 items-start">
        <Panel className="p-3 sticky top-0">
          <label className="flex items-center gap-2 h-10 rounded-lg bg-base border border-line px-3 focus-within:border-amber">
            <Search size={16} className="text-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("pros.search")}
              className="flex-1 bg-transparent outline-none text-[14.5px] placeholder:text-faint"
            />
          </label>
          <div className="flex gap-1.5 mt-2" role="radiogroup" aria-label={t("pros.filter")}>
            {[
              [false, t("pros.all")],
              [true, t("pros.br")],
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
                    <span className="block text-[12.5px] text-faint truncate">{p.team ?? t("pros.noTeam")}</span>
                  </span>
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="text-[14px] text-faint px-2 py-4">{t("pros.none")}</li>}
          </ul>
        </Panel>

        <Panel className="p-6">
          <Detail p={current} />
        </Panel>
      </div>
      <p className="text-[13px] text-faint mt-4 max-w-[80ch]">
        {t("pros.footer", { d: fmtDate(data.updated) })}
      </p>
    </>
  );
}
