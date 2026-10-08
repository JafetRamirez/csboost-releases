import { useEffect, useState } from "react";
import { Coffee, RefreshCw } from "lucide-react";
import { Button, PageHeader, Panel } from "../components/ui";
import { DONATE_URL } from "../components/Donate";
import { isTauri, openUrl } from "../lib/api";
import { useApp } from "../lib/store";
import { appVersion } from "../lib/updater";
import mark from "../assets/brand/mark.png";
import photo from "../assets/brand/jafet.png";

export function SettingsPage() {
  const { report, update, checkUpdate } = useApp();
  const [version, setVersion] = useState("…");
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    appVersion().then(setVersion);
  }, []);

  const rows: [string, string][] = [
    ["Permissão de administrador", report ? (report.elevated ? "Sim" : "Não") : "—"],
    ["Backups dos ajustes", "%LOCALAPPDATA%\\CSBoost\\journal.json"],
    ["Ambiente", isTauri ? "Aplicativo" : "Pré-visualização no navegador (dados de exemplo)"],
  ];

  return (
    <>
      <PageHeader title="Configurações" />
      <div className="space-y-6 max-w-[720px]">
        <Panel className="p-6">
          <div className="flex items-center gap-4">
            <img src={mark} alt="" className="size-14" />
            <div className="flex-1">
              <p className="font-display text-[22px] leading-none">CSBoost</p>
              <p className="text-dim text-[14.5px] mt-1.5">Versão {version}</p>
            </div>
            <Button
              busy={checking}
              icon={<RefreshCw size={16} />}
              onClick={async () => {
                setChecking(true);
                await checkUpdate(true);
                setChecking(false);
              }}
            >
              Procurar atualizações
            </Button>
          </div>
          <p className="text-[14px] text-dim mt-4">
            {update
              ? `A versão ${update.version} está pronta para instalar — use o aviso no topo da tela.`
              : "O CSBoost procura atualizações sozinho ao abrir. Cada atualização é verificada com a assinatura do CSBoost antes de instalar."}
          </p>
          <dl className="divide-y divide-line/60 mt-4">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6 py-3 text-[15px]">
                <dt className="text-dim">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel className="p-6 flex items-center gap-5">
          <img src={photo} alt="Jafet Ramirez" className="size-16 rounded-full ring-1 ring-line" />
          <div className="flex-1">
            <p className="font-cond font-bold text-[17px]">Feito por Jafet Ramirez</p>
            <p className="text-dim text-[14.5px] mt-0.5 max-w-[48ch]">
              O CSBoost é gratuito. Se ele ajudou no seu jogo e você quiser apoiar o projeto, um café já faz diferença.
            </p>
          </div>
          <Button icon={<Coffee size={16} />} onClick={() => openUrl(DONATE_URL)}>
            Pagar um café
          </Button>
        </Panel>

        <p className="text-[13.5px] text-faint max-w-[64ch]">
          O CSBoost não é afiliado à Valve. Counter-Strike e Steam são marcas da Valve Corporation.
        </p>
      </div>
    </>
  );
}
