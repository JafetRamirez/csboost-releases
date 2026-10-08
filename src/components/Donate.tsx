import { Coffee } from "lucide-react";
import { openUrl } from "../lib/api";
import photo from "../assets/brand/jafet.png";

export const DONATE_URL = "https://buymeacoffee.com/fallback";

// Discreto de propósito: o app é gratuito, o café é opcional.
export function Donate() {
  return (
    <button
      onClick={() => openUrl(DONATE_URL)}
      className="group flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-left hover:bg-raised/60 transition-colors cursor-pointer"
    >
      <img src={photo} alt="" className="size-9 rounded-full ring-1 ring-line group-hover:ring-amber/60 transition-colors" draggable={false} />
      <span className="flex-1 min-w-0 leading-tight">
        <span className="block text-[13px] text-faint">CSBoost é gratuito</span>
        <span className="flex items-center gap-1.5 text-[14px] text-dim group-hover:text-amber transition-colors font-cond font-semibold">
          Me paga um café <Coffee size={14} />
        </span>
      </span>
    </button>
  );
}
