import type { Evidence, Preset, Risk } from "./types";
import { t, type Key } from "../i18n";

const categoryKeys: Record<string, Key> = {
  energia: "cat.energia",
  graficos: "cat.graficos",
  latencia: "cat.latencia",
  entrada: "cat.entrada",
  rede: "cat.rede",
  segundo_plano: "cat.segundo_plano",
};

export function categoryLabel(id: string): string {
  const k = categoryKeys[id];
  return k ? t(k) : id;
}

export const categoryOrder = ["energia", "graficos", "latencia", "entrada", "rede", "segundo_plano"];

export function riskLabel(r: Risk): string {
  return t(`risk.${r}` as Key);
}

export function evidenceLabel(e: Evidence): string {
  return t(`evidence.${e}` as Key);
}

export function presets(): { id: Preset; name: string; blurb: string }[] {
  return (["seguro", "competitivo", "pc_fraco"] as Preset[]).map((id) => ({
    id,
    name: t(`preset.${id}.name` as Key),
    blurb: t(`preset.${id}.blurb` as Key),
  }));
}

export function scoreVerdict(score: number) {
  if (score >= 90) return t("verdict.great");
  if (score >= 70) return t("verdict.good");
  if (score >= 45) return t("verdict.mid");
  return t("verdict.low");
}
