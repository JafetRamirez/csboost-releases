import { useEffect, useState } from "react";
import { Copy, FileCheck2, Save, ShieldCheck } from "lucide-react";
import { Button, Dot, Loading, PageHeader, Panel } from "../components/ui";
import { api, errorText, openUrl } from "../lib/api";
import { useApp } from "../lib/store";
import type { Cs2Info } from "../lib/types";
import { t } from "../i18n";
import { GpuCard } from "../components/GpuCard";

// Launch options enxutas. Muitas opções antigas do CS:GO não fazem nada no
// CS2 — a lista é curada e NUNCA inclui -allow_third_party_software.
const RECOMMENDED_LAUNCH = "-console +exec autoexec";

const autoexecTemplate = () => `// ${t("cs2.tplLine1")}
// ${t("cs2.tplLine2")}

fps_max "0"
cl_hud_telemetry_frametime_show "1"
cl_hud_telemetry_ping_show "1"

echo "autoexec do CSBoost carregado"
`;

export function Cs2() {
  const { notify } = useApp();
  const [info, setInfo] = useState<Cs2Info | null>(null);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .cs2Info()
      .then((i) => {
        setInfo(i);
        setText(i.autoexec ?? autoexecTemplate());
      })
      .catch((e) => notify("bad", errorText(e)));
  }, [notify]);

  if (!info) return <Loading label={t("cs2.loading")} />;

  if (!info.found) {
    return (
      <>
        <PageHeader title="Counter-Strike 2" />
        <Panel className="p-8 max-w-[62ch]">
          <h2 className="font-cond font-bold text-[20px]">{info.steam_found ? t("cs2.notInstalled") : t("cs2.noSteam")}</h2>
          <p className="text-dim mt-2">
            {info.steam_found
              ? t("cs2.notInstalledBody")
              : t("cs2.noSteamBody")}
          </p>
        </Panel>
      </>
    );
  }

  async function save() {
    setSaving(true);
    try {
      const p = await api.writeAutoexec(text);
      notify("good", t("cs2.saved", { path: p }));
    } catch (e) {
      notify("bad", errorText(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Counter-Strike 2"
        lead={t("cs2.lead")}
      />

      <div className="grid grid-cols-[1fr_1.2fr] gap-6">
        <Panel className="p-6">
          <h2 className="font-cond font-bold text-[18px] mb-4">{t("cs2.install")}</h2>
          <dl className="space-y-3 text-[14.5px]">
            <div>
              <dt className="text-faint text-[13px]">{t("cs2.folder")}</dt>
              <dd className="break-all">{info.install_dir}</dd>
            </div>
            <div className="flex gap-8">
              <div>
                <dt className="text-faint text-[13px]">Steam</dt>
                <dd className="flex items-center gap-2"><Dot tone={info.steam_running ? "good" : "faint"} />{info.steam_running ? t("cs2.steamOpen") : t("cs2.steamClosed")}</dd>
              </div>
              <div>
                <dt className="text-faint text-[13px]">CS2</dt>
                <dd className="flex items-center gap-2"><Dot tone={info.cs2_running ? "good" : "faint"} />{info.cs2_running ? t("cs2.running") : t("cs2.closed")}</dd>
              </div>
            </div>
          </dl>
          <div className="flex items-start gap-3 mt-5 rounded-xl bg-good/10 text-[14px] p-3.5">
            <ShieldCheck size={18} className="text-good shrink-0 mt-0.5" />
            <span>{t("cs2.never")}</span>
          </div>
          <Button className="mt-4" icon={<FileCheck2 size={16} />} onClick={() => openUrl("steam://validate/730")}>
            {t("cs2.verify")}
          </Button>
        </Panel>

        <Panel className="p-6">
          <h2 className="font-cond font-bold text-[18px]">{t("cs2.launchTitle")}</h2>
          <p className="text-dim text-[14.5px] mt-1 max-w-[60ch]">
            {t("cs2.launchLead")}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-base border border-line px-3 py-2 text-[14.5px] text-amber select-text">{RECOMMENDED_LAUNCH}</code>
            <Button
              icon={<Copy size={15} />}
              onClick={async () => {
                await navigator.clipboard.writeText(RECOMMENDED_LAUNCH);
                notify("good", t("cs2.copied"));
              }}
            >
              {t("copy.copy")}
            </Button>
          </div>
          {info.users.length > 0 && (
            <ul className="mt-5 space-y-2">
              {info.users.map((u) => (
                <li key={u.id3} className="text-[14.5px]">
                  <span className="text-faint">{t("cs2.todayIn")} </span>
                  <span className="font-semibold">{u.persona ?? t("cs2.account", { id: u.id3 })}</span>
                  <span className="text-faint">: </span>
                  <span className="text-dim">{u.launch_options?.trim() || t("cs2.noOptions")}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <GpuCard />

      <Panel className="p-6 mt-6">
        <div className="flex items-end justify-between gap-4 mb-3">
          <div>
            <h2 className="font-cond font-bold text-[18px]">Autoexec</h2>
            <p className="text-dim text-[14.5px] mt-1">
              {info.autoexec ? t("cs2.autoexecCurrent") : t("cs2.autoexecNew")}
            </p>
          </div>
          <Button variant="primary" busy={saving} icon={<Save size={16} />} onClick={save}>
            {t("cs2.saveAutoexec")}
          </Button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          aria-label={t("cs2.autoexecAria")}
          className="w-full h-64 rounded-xl bg-base border border-line p-4 font-[Consolas,monospace] text-[14px] leading-relaxed resize-y focus:border-amber outline-none"
        />
      </Panel>
    </>
  );
}
