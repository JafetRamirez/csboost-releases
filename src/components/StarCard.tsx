import { useState } from "react";
import { Star } from "lucide-react";
import { Button, Panel } from "./ui";
import { openUrl } from "../lib/api";
import { hideStarPrompt, starPromptHidden } from "../lib/prefsLocal";
import { t } from "../i18n";

export const REPO_URL = "https://github.com/JafetRamirez/csboost-releases";

// Pedido discreto de estrela no GitHub: ajuda a juntar os sinais públicos que a
// SignPath pede para a assinatura de código gratuita.
export function StarCard({ always = false, className = "" }: { always?: boolean; className?: string }) {
  const [hidden, setHidden] = useState(() => !always && starPromptHidden());
  if (hidden) return null;
  return (
    <Panel className={`p-5 flex flex-wrap items-center gap-4 ${className}`}>
      <Star size={22} className="text-amber shrink-0" />
      <div className="flex-1 min-w-[220px]">
        <p className="font-cond font-bold text-[17px]">{t("star.title")}</p>
        <p className="text-dim text-[14px] mt-0.5 max-w-[60ch]">{t("star.body")}</p>
      </div>
      <div className="flex gap-2">
        {!always && (
          <Button variant="ghost" onClick={() => { hideStarPrompt(); setHidden(true); }}>
            {t("star.dismiss")}
          </Button>
        )}
        <Button variant="primary" icon={<Star size={16} />} onClick={() => { hideStarPrompt(); openUrl(REPO_URL); if (!always) setHidden(true); }}>
          {t("star.cta")}
        </Button>
      </div>
    </Panel>
  );
}
