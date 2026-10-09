# Assinatura gratuita com a SignPath Foundation

A SignPath Foundation assina de graça projetos de código aberto. O certificado sai no nome da
SignPath Foundation e vale como um OV: some o "Vírus detectado" do Chrome e a maior parte dos
alertas de antivírus. O SmartScreen ainda pode avisar nas primeiras semanas, até a assinatura
ganhar reputação (isso vale para qualquer certificado).

Termos: https://signpath.org/terms

## O que já está pronto no repositório

- [x] Licença de código aberto aprovada pela OSI: `LICENSE` (GPL-3.0-or-later)
- [x] Nada proprietário no pacote: a fonte de fã do CS saiu; fontes agora são OFL (`THIRD_PARTY_NOTICES.md`)
- [x] Build automático a partir do código, no GitHub Actions (`.github/workflows/release.yml`)
- [x] Aprovação manual de cada versão (o workflow só roda quando você dispara)
- [x] Página "Code signing policy" com papéis, atribuição e privacidade (`docs/CODE_SIGNING_POLICY.md`,
      linkada no README e na LP https://www.jafetramirez.com.br/csboost/)
- [x] Avisa antes de alterar o sistema e desinstala limpo
- [x] Workflow já tem os passos de assinatura; ligam sozinhos quando as variáveis existirem

## O que você faz (uma vez)

1. **Verificação em duas etapas no GitHub** (Settings → Password and authentication), se ainda não tiver.
2. **Pedir o plano gratuito** em https://signpath.org (botão de aplicar para open source). Dados úteis:
   - Projeto: CSBoost — otimizador gratuito de Windows para Counter-Strike 2
   - Repositório: https://github.com/JafetRamirez/csboost-releases
   - Licença: GPL-3.0-or-later
   - Página do projeto: https://www.jafetramirez.com.br/csboost/
   - Política: https://github.com/JafetRamirez/csboost-releases/blob/main/docs/CODE_SIGNING_POLICY.md
   - Build: GitHub Actions, workflow "Publicar versão"
   - Arquivos assinados: `csboost.exe` e o instalador NSIS `CSBoost_<versão>_x64-setup.exe`
3. **Depois da aprovação**, no painel da SignPath:
   - Ligue a verificação em duas etapas na conta da SignPath.
   - Em *Trusted Build Systems*, adicione o **GitHub.com** e vincule ao projeto.
   - Crie duas *artifact configurations* no projeto, com estes slugs:
     - `app` → um `zip-file` contendo `csboost.exe` (`pe-file` com `authenticode-sign`)
     - `installer` → um `zip-file` contendo `*_x64-setup.exe` (`pe-file` com `authenticode-sign`)
   - Anote o **Organization ID**, o **slug do projeto** e o **slug da signing policy** (ex.: `release-signing`).
   - Crie um usuário de CI com permissão de *submitter* e gere um **API token**.
4. **No GitHub** (Settings → Secrets and variables → Actions):
   - Secret `SIGNPATH_API_TOKEN` = o API token
   - Variables `SIGNPATH_ORGANIZATION_ID`, `SIGNPATH_PROJECT_SLUG`, `SIGNPATH_POLICY_SLUG`
5. Rode "Publicar versão". O workflow para em cada pedido de assinatura até você aprovar na SignPath.

## Como o workflow assina

1. Compila o app (`tauri build --no-bundle`).
2. Manda o `csboost.exe` para a SignPath e espera voltar assinado.
3. Monta o instalador com o app assinado (`tauri bundle --bundles nsis`).
4. Manda o instalador para a SignPath e espera voltar assinado.
5. Refaz a assinatura do atualizador (`.sig`), porque o arquivo mudou ao ser assinado.
6. Gera o `latest.json` e publica a release com SHA256, link do VirusTotal e a frase de atribuição.

O `PresentMon.exe` entra no instalador como veio da Intel (já assinado por ela) e não é reassinado.

## Depois de aprovado

- Atualize o status no topo de `docs/CODE_SIGNING_POLICY.md` ("instaladores assinados a partir da versão X").
- Tire da LP e do README o aviso "Mais informações → Executar assim mesmo".
