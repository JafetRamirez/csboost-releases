import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { t } from "../i18n";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

export function CopyButton({ text, label, className = "" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        await copyText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[14px] font-cond font-semibold transition-colors cursor-pointer ${
        done ? "bg-good/15 text-good" : "bg-raised text-fg hover:bg-line border border-line"
      } ${className}`}
    >
      {done ? <Check size={15} /> : <Copy size={14} />}
      {done ? t("copy.done") : label ?? t("copy.copy")}
    </button>
  );
}
