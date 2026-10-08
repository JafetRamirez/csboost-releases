import { Minus, Square, X } from "lucide-react";
import { isTauri } from "../lib/api";

async function win() {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  return getCurrentWindow();
}

// Barra de título própria (a janela não tem moldura do Windows).
export function TitleBar() {
  const btn = "h-full w-12 grid place-items-center text-dim hover:text-fg hover:bg-raised transition-colors";
  return (
    <div data-tauri-drag-region className="h-10 shrink-0 flex items-stretch justify-end">
      {isTauri && (
        <>
          <button className={btn} aria-label="Minimizar" onClick={async () => (await win()).minimize()}>
            <Minus size={16} />
          </button>
          <button className={btn} aria-label="Maximizar" onClick={async () => (await win()).toggleMaximize()}>
            <Square size={13} />
          </button>
          <button
            className={`${btn} hover:!bg-bad hover:!text-white`}
            aria-label="Fechar"
            onClick={async () => (await win()).close()}
          >
            <X size={17} />
          </button>
        </>
      )}
    </div>
  );
}
