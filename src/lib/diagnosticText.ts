// Texto do "Copiar diagnóstico": o que ajuda a resolver um problema, sem nada
// pessoal (sem nome de usuário, sem caminhos de pasta, sem IDs da Steam).
import type { Report } from "./types";
import { appVersion } from "./updater";
import { getLang } from "../i18n";

export async function diagnosticText(r: Report): Promise<string> {
  const v = await appVersion();
  const h = r.hardware;
  const ram = h.ram_modules.length
    ? `${Math.round(h.ram_modules.reduce((s, m) => s + m.capacity_gb, 0))} GB, ${h.ram_modules.length}x, ${h.ram_modules
        .map((m) => m.configured_mts ?? "?")
        .join("/")} MT/s (${h.ram_modules.map((m) => m.rated_mts ?? "?").join("/")} MT/s)`
    : "?";
  const lines = [
    `CSBoost ${v} (${getLang()})`,
    `Windows: ${h.os_name} (build ${h.os_build})`,
    `PC: ${[h.manufacturer, h.board].filter(Boolean).join(" · ") || "?"}`,
    `CPU: ${h.cpu} (${h.cpu_cores}C/${h.cpu_threads}T)`,
    ...h.gpus.map((g) => `GPU: ${g.name} · driver ${g.driver_version ?? "?"} (${g.driver_date ?? "?"})`),
    `RAM: ${ram}`,
    ...r.displays.map((d) => `Monitor: ${d.name} ${d.width}x${d.height} ${d.current_hz}/${d.max_hz} Hz${d.primary ? " (principal)" : ""}`),
    `Energia: ${r.power_plan.name}${r.power.has_battery ? `, notebook ${r.power.on_ac ? "na tomada" : "na bateria"}` : ""}`,
    `Admin: ${r.elevated ? "sim" : "não"} · CS2: ${r.cs2_found ? "encontrado" : "não encontrado"} · Nota: ${r.score}`,
    "",
    "Avisos:",
    ...(r.issues.length ? r.issues.map((i) => `- [${i.severity}] ${i.id}: ${i.title}`) : ["- nenhum"]),
  ];
  if (r.dismissed.length) lines.push("Ignorados:", ...r.dismissed.map((i) => `- ${i.id}: ${i.title}`));
  return lines.join("\n");
}
