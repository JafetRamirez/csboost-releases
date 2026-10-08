import { useState } from "react";
import { Download } from "lucide-react";
import { errorText } from "../lib/api";
import { useApp } from "../lib/store";
import { Button } from "./ui";

export function UpdateBanner() {
  const { update, notify } = useApp();
  const [pct, setPct] = useState<number | null | undefined>(undefined);
  if (!update) return null;
  const installing = pct !== undefined;

  async function install() {
    setPct(null);
    try {
      await update!.install(setPct);
    } catch (e) {
      setPct(undefined);
      notify("bad", `A atualização falhou: ${errorText(e)}`);
    }
  }

  return (
    <div className="mx-10 mb-2 flex items-center gap-3 rounded-xl border border-navy-hi/40 bg-navy/30 px-4 py-2.5 text-[14.5px]">
      <Download size={18} className="text-navy-hi shrink-0" />
      <span className="flex-1">
        {installing
          ? `Baixando a versão ${update.version}${pct != null ? ` (${pct}%)` : ""}… o CSBoost vai reabrir sozinho.`
          : `Versão ${update.version} disponível. Suas otimizações e o histórico são mantidos.`}
      </span>
      {!installing && (
        <Button variant="primary" className="h-8 px-3 text-[14px]" onClick={install}>
          Atualizar agora
        </Button>
      )}
    </div>
  );
}
