// Idiomas do CSBoost: português (padrão), espanhol e inglês.
//
// Os textos ficam em pt.ts (a fonte), es.ts e en.ts. O TypeScript obriga os
// três arquivos a terem as mesmas chaves, então nenhum texto fica sem tradução.
//
// `t()` funciona em qualquer lugar (componentes, funções de rótulo). Ao trocar
// de idioma, o App remonta a árvore inteira (key={lang}), então tudo é
// redesenhado no idioma novo e os dados do núcleo Rust são recarregados.

import { pt } from "./pt";
import { es } from "./es";
import { en } from "./en";

export type Lang = "pt" | "es" | "en";
export type Key = keyof typeof pt;
export type Dict = Record<Key, string>;

export const LANGS: { id: Lang; label: string; locale: string }[] = [
  { id: "pt", label: "Português (Brasil)", locale: "pt-BR" },
  { id: "es", label: "Español", locale: "es" },
  { id: "en", label: "English", locale: "en" },
];

const dicts: Record<Lang, Dict> = { pt, es, en };
const STORAGE = "csboost.lang";

function detect(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE);
    if (saved === "pt" || saved === "es" || saved === "en") return saved;
  } catch {
    /* sem storage: segue para o idioma do sistema */
  }
  const sys = (navigator.languages?.[0] ?? navigator.language ?? "pt").toLowerCase();
  if (sys.startsWith("pt")) return "pt";
  if (sys.startsWith("es")) return "es";
  return "en";
}

let current: Lang = detect();

export function getLang(): Lang {
  return current;
}

export function setLangValue(l: Lang) {
  current = l;
  try {
    localStorage.setItem(STORAGE, l);
  } catch {
    /* ignora */
  }
  document.documentElement.lang = locale();
}

/** Locale para números e datas (pt-BR, es, en). */
export function locale(): string {
  return LANGS.find((l) => l.id === current)!.locale;
}

/** Texto traduzido. `{nome}` no texto é trocado por vars.nome. */
export function t(key: Key, vars?: Record<string, string | number>): string {
  let s = dicts[current][key] ?? pt[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}

/** Escolhe a forma singular/plural. */
export function tn(n: number, one: Key, many: Key, vars?: Record<string, string | number>): string {
  return t(n === 1 ? one : many, { n, ...vars });
}

document.documentElement.lang = locale();
