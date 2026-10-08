import { Activity, Crosshair, Gauge as GaugeIcon, History, ScanSearch, Settings, SlidersHorizontal, Users, Wrench } from "lucide-react";
import logo from "../assets/brand/logo-light.png";
import { Donate } from "./Donate";

export type Page = "painel" | "raiox" | "otimizacoes" | "cs2" | "pros" | "benchmark" | "ferramentas" | "historico" | "config";

const items: { id: Page; label: string; icon: typeof Activity }[] = [
  { id: "painel", label: "Painel", icon: GaugeIcon },
  { id: "raiox", label: "Raio-X do PC", icon: ScanSearch },
  { id: "otimizacoes", label: "Otimizações", icon: SlidersHorizontal },
  { id: "cs2", label: "Counter-Strike 2", icon: Crosshair },
  { id: "pros", label: "Configs de pros", icon: Users },
  { id: "benchmark", label: "Benchmark", icon: Activity },
  { id: "ferramentas", label: "Ferramentas", icon: Wrench },
  { id: "historico", label: "Histórico", icon: History },
];

export function Sidebar({ page, onNavigate, issueCount }: { page: Page; onNavigate: (p: Page) => void; issueCount: number }) {
  const row = (id: Page, label: string, Icon: typeof Activity, badge?: number) => {
    const active = page === id;
    return (
      <button
        key={id}
        onClick={() => onNavigate(id)}
        aria-current={active ? "page" : undefined}
        className={`group relative flex items-center gap-3 w-full h-11 px-4 rounded-xl text-left font-cond font-semibold text-[15.5px] transition-colors cursor-pointer ${
          active ? "bg-raised text-fg" : "text-dim hover:text-fg hover:bg-raised/60"
        }`}
      >
        {active && <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r bg-amber" />}
        <Icon size={18} className={active ? "text-amber" : ""} />
        <span className="flex-1">{label}</span>
        {badge ? (
          <span className="min-w-6 h-6 px-1.5 rounded-full bg-amber text-ink text-[12.5px] font-bold grid place-items-center num">
            {badge}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <aside data-tauri-drag-region className="w-[248px] shrink-0 bg-panel border-r border-line flex flex-col px-3 pb-4">
      <div data-tauri-drag-region className="h-[88px] flex items-center px-3">
        <img src={logo} alt="CSBoost" className="h-[26px] w-auto pointer-events-none" draggable={false} />
      </div>
      <nav className="flex flex-col gap-1">
        {items.map((i) => row(i.id, i.label, i.icon, i.id === "raiox" ? issueCount : undefined))}
      </nav>
      <div className="mt-auto space-y-2">
        <Donate />
        <div className="border-t border-line/60 pt-2">{row("config", "Configurações", Settings)}</div>
      </div>
    </aside>
  );
}
