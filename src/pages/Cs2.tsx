import { useEffect, useState } from "react";
import { Copy, FileCheck2, Save, ShieldCheck } from "lucide-react";
import { Button, Dot, Loading, PageHeader, Panel } from "../components/ui";
import { api, errorText, openUrl } from "../lib/api";
import { useApp } from "../lib/store";
import type { Cs2Info } from "../lib/types";

// Launch options enxutas. Muitas opções antigas do CS:GO não fazem nada no
// CS2 — a lista é curada e NUNCA inclui -allow_third_party_software.
const RECOMMENDED_LAUNCH = "-console +exec autoexec";

const AUTOEXEC_TEMPLATE = `// Autoexec gerado pelo CSBoost — edite à vontade.
// Carregado ao abrir o jogo com +exec autoexec nas opções de inicialização.

fps_max "0"
cl_hud_telemetry_frametime_show "1"
cl_hud_telemetry_ping_show "1"

echo "autoexec do CSBoost carregado"
`;

export function Cs2() {
  const { notify } = useApp();
  const [info, setInfo] = useState<Cs2Info | null>(null);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .cs2Info()
      .then((i) => {
        setInfo(i);
        setText(i.autoexec ?? AUTOEXEC_TEMPLATE);
      })
      .catch((e) => notify("bad", errorText(e)));
  }, [notify]);

  if (!info) return <Loading label="Procurando a Steam e o CS2…" />;

  if (!info.found) {
    return (
      <>
        <PageHeader title="Counter-Strike 2" />
        <Panel className="p-8 max-w-[62ch]">
          <h2 className="font-cond font-bold text-[20px]">{info.steam_found ? "CS2 não está instalado nesta Steam" : "Steam não encontrada"}</h2>
          <p className="text-dim mt-2">
            {info.steam_found
              ? "Instale o Counter-Strike 2 pela Steam e volte aqui. As otimizações do Windows continuam funcionando normalmente."
              : "Instale a Steam e o Counter-Strike 2 para liberar as configurações do jogo."}
          </p>
        </Panel>
      </>
    );
  }

  async function save() {
    setSaving(true);
    try {
      const p = await api.writeAutoexec(text);
      notify("good", `Autoexec salvo em ${p}. A versão anterior ficou guardada no Histórico.`);
    } catch (e) {
      notify("bad", errorText(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Counter-Strike 2"
        lead="Configurações do jogo que não tocam no processo nem nos arquivos do CS2 — só arquivos de configuração do seu usuário. Compatível com o Trusted Mode da Valve."
      />

      <div className="grid grid-cols-[1fr_1.2fr] gap-6">
        <Panel className="p-6">
          <h2 className="font-cond font-bold text-[18px] mb-4">Instalação</h2>
          <dl className="space-y-3 text-[14.5px]">
            <div>
              <dt className="text-faint text-[13px]">Pasta do jogo</dt>
              <dd className="break-all">{info.install_dir}</dd>
            </div>
            <div className="flex gap-8">
              <div>
                <dt className="text-faint text-[13px]">Steam</dt>
                <dd className="flex items-center gap-2"><Dot tone={info.steam_running ? "good" : "faint"} />{info.steam_running ? "Aberta" : "Fechada"}</dd>
              </div>
              <div>
                <dt className="text-faint text-[13px]">CS2</dt>
                <dd className="flex items-center gap-2"><Dot tone={info.cs2_running ? "good" : "faint"} />{info.cs2_running ? "Rodando" : "Fechado"}</dd>
              </div>
            </div>
          </dl>
          <div className="flex items-start gap-3 mt-5 rounded-xl bg-good/10 text-[14px] p-3.5">
            <ShieldCheck size={18} className="text-good shrink-0 mt-0.5" />
            <span>O CSBoost nunca injeta nada no cs2.exe e nunca pede a opção -allow_third_party_software.</span>
          </div>
          <Button className="mt-4" icon={<FileCheck2 size={16} />} onClick={() => openUrl("steam://validate/730")}>
            Verificar arquivos do jogo
          </Button>
        </Panel>

        <Panel className="p-6">
          <h2 className="font-cond font-bold text-[18px]">Opções de inicialização</h2>
          <p className="text-dim text-[14.5px] mt-1 max-w-[60ch]">
            Na Steam: botão direito no CS2, Propriedades, Geral. Recomendamos poucas opções — a maioria das antigas do CS:GO não tem efeito no CS2.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-base border border-line px-3 py-2 text-[14.5px] text-amber select-text">{RECOMMENDED_LAUNCH}</code>
            <Button
              icon={<Copy size={15} />}
              onClick={async () => {
                await navigator.clipboard.writeText(RECOMMENDED_LAUNCH);
                notify("good", "Opções copiadas.");
              }}
            >
              Copiar
            </Button>
          </div>
          {info.users.length > 0 && (
            <ul className="mt-5 space-y-2">
              {info.users.map((u) => (
                <li key={u.id3} className="text-[14.5px]">
                  <span className="text-faint">Hoje em </span>
                  <span className="font-semibold">{u.persona ?? `conta ${u.id3}`}</span>
                  <span className="text-faint">: </span>
                  <span className="text-dim">{u.launch_options?.trim() || "nenhuma opção"}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel className="p-6 mt-6">
        <div className="flex items-end justify-between gap-4 mb-3">
          <div>
            <h2 className="font-cond font-bold text-[18px]">Autoexec</h2>
            <p className="text-dim text-[14.5px] mt-1">
              {info.autoexec ? "Seu autoexec.cfg atual." : "Você ainda não tem um autoexec.cfg. Este é um ponto de partida."}
            </p>
          </div>
          <Button variant="primary" busy={saving} icon={<Save size={16} />} onClick={save}>
            Salvar autoexec
          </Button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          aria-label="Conteúdo do autoexec.cfg"
          className="w-full h-64 rounded-xl bg-base border border-line p-4 font-[Consolas,monospace] text-[14px] leading-relaxed resize-y focus:border-amber outline-none"
        />
      </Panel>
    </>
  );
}
