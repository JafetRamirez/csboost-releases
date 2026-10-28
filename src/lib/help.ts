// "Preciso de ajuda": copia o diagnóstico (sem dados pessoais) e abre a central
// de ajuda do site no idioma do app. O app não envia nada sozinho: quem decide
// colar o diagnóstico no chamado é o usuário.
import type { Report } from "./types";
import type { Toast } from "./store";
import { openUrl } from "./api";
import { diagnosticText } from "./diagnosticText";
import { getLang, t } from "../i18n";

const HELP: Record<"pt" | "es" | "en", string> = {
  pt: "https://csboost.com.br/ajuda/",
  es: "https://csboost.com.br/es/ayuda/",
  en: "https://csboost.com.br/en/help/",
};

export function helpUrl(): string {
  return HELP[getLang()];
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
