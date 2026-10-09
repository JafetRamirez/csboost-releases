import { useState } from "react";
import { CircleCheck, CircleAlert, Info, ShieldAlert } from "lucide-react";
import { Sidebar, type Page } from "./components/Sidebar";
import { TitleBar } from "./components/TitleBar";
import { UpdateBanner } from "./components/UpdateBanner";
import { AppProvider, useApp } from "./lib/store";
import { Dashboard } from "./pages/Dashboard";
import { Diagnostics } from "./pages/Diagnostics";
import { Tweaks } from "./pages/Tweaks";
import { Cs2 } from "./pages/Cs2";
import { Benchmark } from "./pages/Benchmark";
import { ProsPage } from "./pages/Pros";
import { ToolsPage } from "./pages/Tools";
import { HistoryPage } from "./pages/History";
import { SettingsPage } from "./pages/Settings";
import { t } from "./i18n";
import { LangProvider } from "./i18n/react";

function Shell() {
  const [page, setPage] = useState<Page>("painel");
  const { report, toasts } = useApp();
  const issueCount = report?.issues.filter((i) => i.severity !== "info").length ?? 0;

  const pages: Record<Page, React.ReactNode> = {
    painel: <Dashboard go={setPage} />,
    raiox: <Diagnostics />,
    otimizacoes: <Tweaks />,
    cs2: <Cs2 />,
    pros: <ProsPage />,
    benchmark: <Benchmark />,
    ferramentas: <ToolsPage />,
    historico: <HistoryPage />,
    config: <SettingsPage />,
  };

  return (
    <div className="h-full flex">
      <Sidebar page={page} onNavigate={setPage} issueCount={issueCount} />
      <div className="flex-1 min-w-0 flex flex-col">
        <TitleBar />
        {report && !report.elevated && (
          <div className="mx-10 mb-2 flex items-center gap-3 rounded-xl bg-warn/10 text-warn px-4 py-2.5 text-[14.5px]">
            <ShieldAlert size={18} className="shrink-0" />
            {t("app.noAdmin")}
          </div>
        )}
        <UpdateBanner />
        <main className="scroll flex-1 overflow-y-auto px-10 pb-12 pt-4">
          <div className="max-w-[1080px]">{pages[page]}</div>
        </main>
      </div>

      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50 max-w-[420px]" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-start gap-3 rounded-xl bg-raised border border-line px-4 py-3 shadow-2xl shadow-black/40 text-[14.5px]"
          >
            {toast.tone === "good" && <CircleCheck size={18} className="text-good mt-0.5 shrink-0" />}
            {toast.tone === "bad" && <CircleAlert size={18} className="text-bad mt-0.5 shrink-0" />}
            {toast.tone === "info" && <Info size={18} className="text-navy-hi mt-0.5 shrink-0" />}
            <span>{toast.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </LangProvider>
  );
}
