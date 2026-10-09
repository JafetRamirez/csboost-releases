import { useEffect, useState } from "react";
import { Coffee, Languages, RefreshCw } from "lucide-react";
import { Button, PageHeader, Panel } from "../components/ui";
import { DONATE_URL } from "../components/Donate";
import { isTauri, openUrl } from "../lib/api";
import { useApp } from "../lib/store";
import { appVersion } from "../lib/updater";
import mark from "../assets/brand/mark.png";
import photo from "../assets/brand/jafet.png";
import { LANGS, t } from "../i18n";
import { useLang } from "../i18n/react";

export function SettingsPage() {
  const { report, update, checkUpdate } = useApp();
  const { lang, setLang } = useLang();
  const [version, setVersion] = useState("…");
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    appVersion().then(setVersion);
  }, []);

  const rows: [string, string][] = [
    [t("set.admin"), report ? (report.elevated ? t("set.yes") : t("set.no")) : "—"],
    [t("set.backups"), "%LOCALAPPDATA%\\CSBoost\\journal.json"],
    [t("set.env"), isTauri ? t("set.envApp") : t("set.envPreview")],
  ];

  return (
    <>
      <PageHeader title={t("nav.config")} />
      <div className="space-y-6 max-w-[720px]">
        <Panel className="p-6 flex items-center gap-5">
          <Languages size={22} className="text-amber shrink-0" />
          <div className="flex-1">
            <p className="font-cond font-bold text-[17px]">{t("set.language")}</p>
            <p className="text-dim text-[14px] mt-0.5">{t("set.languageHint")}</p>
          </div>
          <div role="radiogroup" aria-label={t("set.language")} className="flex gap-1.5">
            {LANGS.map((l) => (
              <button
                key={l.id}
                role="radio"
                aria-checked={lang === l.id}
                onClick={() => setLang(l.id)}
                className={`h-9 px-3 rounded-lg border text-[14px] font-cond font-semibold cursor-pointer transition-colors ${
                  lang === l.id ? "border-amber bg-amber/10 text-amber" : "border-line text-dim hover:text-fg hover:border-faint"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </Panel>
        <Panel className="p-6">
          <div className="flex items-center gap-4">
            <img src={mark} alt="" className="size-14" />
            <div className="flex-1">
              <p className="font-display text-[20px] leading-none uppercase">CSBoost</p>
              <p className="text-dim text-[14.5px] mt-1.5">{t("set.version", { v: version })}</p>
            </div>
            <Button
              busy={checking}
              icon={<RefreshCw size={16} />}
              onClick={async () => {
                setChecking(true);
                await checkUpdate(true);
                setChecking(false);
              }}
            >
              {t("set.checkUpdates")}
            </Button>
          </div>
          <p className="text-[14px] text-dim mt-4">
            {update
              ? t("set.updateReady", { v: update.version })
              : t("set.updateAuto")}
          </p>
          <dl className="divide-y divide-line/60 mt-4">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6 py-3 text-[15px]">
                <dt className="text-dim">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel className="p-6 flex items-center gap-5">
          <img src={photo} alt="Jafet Ramirez" className="size-16 rounded-full ring-1 ring-line" />
          <div className="flex-1">
            <p className="font-cond font-bold text-[17px]">{t("set.madeBy")}</p>
            <p className="text-dim text-[14.5px] mt-0.5 max-w-[48ch]">
              {t("set.coffeeBody")}
            </p>
          </div>
          <Button icon={<Coffee size={16} />} onClick={() => openUrl(DONATE_URL)}>
            {t("set.coffeeBtn")}
          </Button>
        </Panel>

        <p className="text-[13.5px] text-faint max-w-[64ch]">
          {t("set.valve")}
        </p>
      </div>
    </>
  );
}
