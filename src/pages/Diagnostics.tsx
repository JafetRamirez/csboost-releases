import { CircleCheck, RotateCcw } from "lucide-react";
import { IssueCard } from "../components/IssueCard";
import { Button, Loading, PageHeader, Panel } from "../components/ui";
import { useApp } from "../lib/store";

export function Diagnostics() {
  const { report, scanning, rescan } = useApp();
  if (!report) return <Loading label="Analisando o seu PC…" />;

  return (
    <>
      <PageHeader
        title="Raio-X do PC"
        lead="Problemas que realmente roubam FPS, do maior impacto para o menor. Alguns o CSBoost corrige na hora; outros pedem um passo seu (como ativar o XMP na BIOS)."
        actions={
          <Button onClick={rescan} busy={scanning} icon={<RotateCcw size={16} />}>
            Analisar de novo
          </Button>
        }
      />
      <div className="space-y-3">
        {report.issues.map((i) => (
          <IssueCard key={i.id} issue={i} />
        ))}
        {report.issues.length === 0 && (
          <Panel className="p-8 text-center text-dim">Nenhum problema encontrado neste PC.</Panel>
        )}
      </div>

      {report.checks_passed.length > 0 && (
        <Panel className="p-6 mt-6">
          <h2 className="font-cond font-bold text-[18px] mb-3">Já está certo</h2>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
            {report.checks_passed.map((c) => (
              <li key={c} className="flex items-center gap-2.5 text-[15px]">
                <CircleCheck size={17} className="text-good shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
