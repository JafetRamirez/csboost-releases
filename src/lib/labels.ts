import type { Evidence, Preset, Risk } from "./types";

export const categoryLabel: Record<string, string> = {
  energia: "Energia e processador",
  graficos: "Gráficos e GPU",
  latencia: "Latência",
  entrada: "Mouse e teclado",
  rede: "Rede",
  segundo_plano: "Segundo plano",
};

export const categoryOrder = ["energia", "graficos", "latencia", "entrada", "rede", "segundo_plano"];

export const riskLabel: Record<Risk, string> = {
  safe: "Seguro",
  moderate: "Moderado",
  advanced: "Avançado",
};

export const evidenceLabel: Record<Evidence, string> = {
  proven: "Ganho comprovado",
  situational: "Depende do PC",
  weak: "Efeito pequeno",
};

export const presets: { id: Preset; name: string; blurb: string }[] = [
  { id: "seguro", name: "Seguro", blurb: "Só ajustes sem risco e com efeito claro. Ideal para a primeira vez." },
  { id: "competitivo", name: "Competitivo", blurb: "Seguro + ajustes de latência e menos coisa rodando em segundo plano." },
  { id: "pc_fraco", name: "PC fraco", blurb: "Corta efeitos visuais e apps escondidos para sobrar CPU para o jogo." },
];

export function scoreVerdict(score: number) {
  if (score >= 90) return "Seu PC está pronto para jogar.";
  if (score >= 70) return "Bom, mas tem desempenho sobrando na mesa.";
  if (score >= 45) return "Tem coisa segurando o seu FPS.";
  return "Seu PC está bem abaixo do que pode entregar.";
}
