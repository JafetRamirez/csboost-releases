// "Preciso de ajuda": copia o diagnóstico (sem dados pessoais) e abre a central
// de ajuda do site no idioma do app. O app não envia nada sozinho: quem decide
// colar o diagnóstico no chamado é o usuário.
import type { Report } from "./types";
import type { Toast } from "./store";
import { openUrl } from "./api";
import { diagnosticText } from "./diagnosticText";
import { getLang, t } from "../i18n";

const HELP: Record<"pt" | "es" | "en", string> = {
  pt: "https://www.csboost.com.br/ajuda/",
  es: "https://www.csboost.com.br/es/ayuda/",
  en: "https://www.csboost.com.br/en/help/",
};

export function helpUrl(): string {
  return HELP[getLang()];
}

// Guias do site por aviso do Raio-X. Os slugs são os mesmos de site/src/guides_content.py.
type Slugs = Record<"pt" | "es" | "en", string>;
const XMP: Slugs = { pt: "xmp-expo", es: "xmp-expo", en: "xmp-expo" };
const IGPU: Slugs = { pt: "cs2-placa-integrada", es: "cs2-grafica-integrada", en: "cs2-integrated-gpu" };
const DRIVER: Slugs = { pt: "driver-de-video", es: "driver-de-video", en: "graphics-driver" };
const FPS: Slugs = { pt: "aumentar-fps-cs2", es: "aumentar-fps-cs2", en: "increase-fps-cs2" };
const GUIDES: Record<string, Slugs> = {
  "ram.xmp": XMP,
  "ram.single_channel": XMP,
  "gpu.preference": IGPU,
  "gpu.monitor_on_igpu": IGPU,
  "gpu.no_driver": DRIVER,
  "gpu.driver": DRIVER,
  "power.plan": FPS,
  "power.on_battery": IGPU,
};

/** Endereço do guia completo para um aviso do Raio-X, ou null se não houver. */
export function guideUrl(issueId: string): string | null {
  const key = issueId.startsWith("gpu.driver.") ? "gpu.driver" : issueId;
  const g = GUIDES[key];
  return g ? HELP[getLang()] + g[getLang()] + "/" : null;
}

export async function openHelp(report: Report | null, notify: (tone: Toast["tone"], text: string) => void) {
  if (report) {
    try {
      await navigator.clipboard.writeText(await diagnosticText(report));
      notify("good", t("help.copied"));
    } catch {
      /* sem área de transferência: abre a central mesmo assim */
    }
  }
  await openUrl(helpUrl() + (report ? "#chamado" : ""));
}
