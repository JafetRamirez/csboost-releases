import { useEffect, useState } from "react";
import { MonitorCog } from "lucide-react";
import { Button, Panel } from "./ui";
import { api, errorText } from "../lib/api";
import { useApp } from "../lib/store";
import type { VideoFile, VideoPreset } from "../lib/types";
import { t } from "../i18n";

const PRESETS: VideoPreset[] = ["max_fps", "balanced", "visibility"];

// Presets de vídeo (ROADMAP #8). O núcleo só troca valores que já existem no
// cs2_video.txt, com o jogo fechado, e guarda o original no Histórico.
export function VideoPresets({ cs2Running }: { cs2Running: boolean }) {
  const { notify } = useApp();
  const [files, setFiles] = useState<VideoFile[] | null>(null);
  const [busy, setBusy] = useState<VideoPreset | null>(null);

  const load = () => api.videoInfo().then(setFiles).catch((e) => notify("bad", errorText(e)));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function apply(p: VideoPreset) {
    setBusy(p);
    try {
      const r = await api.videoApply(p);
      notify(r.changed ? "good" : "info", r.changed ? t("video.applied", { name: t(`video.${p}`), n: r.changed }) : t("video.same"));
      await load();
    } catch (e) {
      notify("bad", errorText(e));
    } finally {
      setBusy(null);
    }
  }

  const current = files?.[0]?.preset ?? null;
  const none = files !== null && files.length === 0;

  return (
    <Panel className="p-6 mt-6">
      <h2 className="font-cond font-bold text-[18px] flex items-center gap-2"><MonitorCog size={18} className="text-amber" />{t("video.title")}</h2>
      <p className="text-dim text-[14.5px] mt-1 max-w-[75ch]">{t("video.lead")}</p>

      {none ? (
        <p className="mt-4 text-[14.5px] rounded-lg bg-base px-3 py-2">{t("video.none")}</p>
      ) : (
        <>
          <div className="grid gap-3 mt-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            {PRESETS.map((p) => (
              <div key={p} className={`rounded-xl border p-4 flex flex-col gap-3 ${current === p ? "border-amber bg-amber/5" : "border-line"}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-cond font-bold text-[16px]">{t(`video.${p}`)}</span>
                    {current === p && <span className="text-[12px] text-amber">· {t("video.current")}</span>}
                  </div>
                  <p className="text-dim text-[13.5px] mt-1">{t(`video.${p}.blurb`)}</p>
                </div>
                <Button
                  className="mt-auto self-start"
                  variant={current === p ? "ghost" : "primary"}
                  busy={busy === p}
                  disabled={cs2Running || busy !== null || files === null}
                  onClick={() => apply(p)}
                >
                  {t("video.apply")}
                </Button>
              </div>
            ))}
          </div>
          <p className="text-faint text-[13px] mt-3">{t("video.common")}</p>
          {cs2Running && <p className="text-warn text-[14px] mt-2">{t("video.running")}</p>}
          {files && files.length > 1 && (
            <ul className="mt-2 text-[13px] text-faint">
              {files.map((f) => (
                <li key={f.id3}>{t("video.account", { name: f.persona ?? f.id3, preset: f.preset ? t(`video.${f.preset}`) : t("video.custom") })}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </Panel>
  );
}
