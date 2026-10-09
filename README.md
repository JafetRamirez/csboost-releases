# CSBoost

Otimizador gratuito de Windows para Counter-Strike 2.

## Baixar

**[Baixe a versão mais recente em Releases](https://github.com/JafetRamirez/csboost-releases/releases/latest)** e rode o `CSBoost_x.y.z_x64-setup.exe`.

- Windows 10 e 11 (64 bits). O app pede permissão de administrador ao abrir.
- Todo ajuste pode ser desfeito pela tela Histórico, e o desinstalador oferece desfazer tudo.
- Não injeta nada no jogo e não mexe nos arquivos do CS2: compatível com o Trusted Mode da Valve. Veja [`CLAUDE.md`](CLAUDE.md) para as regras e o VAC guard que bloqueia o build se algo arriscado entrar no código.
- Depois de instalado, o CSBoost se atualiza sozinho.
- Cada release traz o SHA256 do instalador, para você conferir que o arquivo é o mesmo publicado aqui.

Enquanto o instalador não tiver certificado de assinatura, o Windows pode mostrar "O Windows protegeu o computador": clique em **Mais informações → Executar assim mesmo**.

Curtiu? [Me paga um café](https://buymeacoffee.com/fallback).

O CSBoost não é afiliado à Valve. Counter-Strike e Steam são marcas da Valve Corporation.

---

## Para desenvolvedores

Feito com **Tauri 2 + React + TypeScript + Tailwind** (interface) e **Rust** (núcleo que mexe no Windows).

> Planejamento completo, pesquisa de mercado e roadmap: [`docs/brainstorm-otimizador-cs2.md`](docs/brainstorm-otimizador-cs2.md)

---

## Rodando no Windows

### 1. Pré-requisitos (uma vez só)

| O quê | Como |
|---|---|
| Node.js 22 LTS | https://nodejs.org |
| Rust | https://rustup.rs (aceite o padrão, toolchain `stable-x86_64-pc-windows-msvc`) |
| Visual Studio Build Tools 2022 | https://visualstudio.microsoft.com/visual-cpp-build-tools/ → marque **"Desenvolvimento para desktop com C++"** |
| WebView2 | Já vem no Windows 10/11 |

### 2. Instalar dependências

```powershell
cd C:\Projects\csboost
npm install
```

### 3. Desenvolver

```powershell
# Só a interface, no navegador, com dados de exemplo (rápido para mexer no visual)
npm run dev            # abre http://localhost:1420

# O app de verdade (compila o Rust na primeira vez — demora alguns minutos)
npm run tauri dev
```

> **Administrador:** no `tauri dev` o app abre **sem** pedir UAC, para funcionar num terminal comum. Ajustes em `HKLM`, plano de energia e ponto de restauração precisam de admin — abra o terminal **como administrador** para testar tudo. No build final (`release`) o executável já pede administrador ao abrir.

### 4. Gerar o instalador

```powershell
npm run tauri build
```

Sai em `src-tauri\target\release\bundle\nsis\CSBoost_0.1.0_x64-setup.exe` — um instalador em etapas (wizard) em português:
boas-vindas → termos de uso → pasta de instalação → pasta no Menu Iniciar → instalação → concluir (com "Executar o CSBoost" e atalho na área de trabalho). Também cria o desinstalador em "Aplicativos instalados".

Arquivos do wizard em `src-tauri/installer/`:

| Arquivo | O quê |
|---|---|
| `sidebar.bmp` (164×314) | imagem lateral das telas de boas-vindas e conclusão |
| `header.bmp` (150×57) | logo no topo das demais telas |
| `termos.txt` | termos de uso exibidos na tela de licença (UTF-8 com BOM) |

> O instalador **não remove** o aviso "O Windows protegeu o computador" (SmartScreen). Isso só sai com o executável assinado por um certificado de assinatura de código (OV) — ver seção 8 do brainstorm. Quando tiver o certificado, configure `bundle > windows > certificateThumbprint` ou `signCommand` no `tauri.conf.json`.

### 5. Publicar uma atualização (o app se atualiza sozinho)

O CSBoost procura versões novas ao abrir, lendo
`https://github.com/JafetRamirez/csboost-releases/releases/latest/download/latest.json`.
O instalador baixado só roda se tiver a **assinatura do CSBoost** (chave em `keys/`).

**A cada versão nova:**
1. Aumente `version` em `src-tauri/tauri.conf.json`, `package.json` e `src-tauri/Cargo.toml` (ex.: 0.3.0 → 0.4.0) e faça o push.
2. No GitHub: **Actions → Publicar versão → Run workflow**, escreva o que mudou e confirme. O GitHub compila num Windows de verdade, assina a atualização, calcula o SHA256 e cria a release com o instalador, o `.sig` e o `latest.json`.
   - Uma vez só: em **Settings → Secrets and variables → Actions**, crie `TAURI_SIGNING_PRIVATE_KEY` (conteúdo de `keys/csboost-updater.key`) e `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (conteúdo de `keys/senha.txt`).
3. Alternativa manual: `.\scripts\publicar-versao.ps1 "O que mudou"` e suba os 3 arquivos da pasta `release/` numa release nova (tag `vX.Y.Z`).

Quem estiver com o app aberto vê o aviso "Versão X disponível — Atualizar agora". O histórico de otimizações é mantido.

> **A pasta `keys/` é o que prova que a atualização é sua.** Faça backup (pendrive / gerenciador de senhas) e nunca publique. Se perder a chave, os apps já instalados não aceitam mais atualizações e todos precisam reinstalar manualmente.

---

## O que já funciona (v0.4)

**Novo na 0.4:**
- **Três idiomas:** português, espanhol e inglês no app, no instalador e na LP (seletor em Configurações).
- **Placa de vídeo do CS2** (Counter-Strike 2): mostra em qual placa o jogo está rodando agora, lendo os contadores de GPU do Windows, e um guia por marca de notebook (MUX switch) quando está na integrada.
- **Manutenção:** ao abrir, o app confere os ajustes aplicados e oferece reaplicar o que o Windows desfez (comum depois de atualização).
- **Teste de rede** (Ferramentas): ping, variação e perda até os servidores da Valve, com aviso de Wi-Fi. Só mede; roda só quando você clica.
- Mensagens de "Acesso negado (erro 5)" agora dizem qual ajuste e qual chave o Windows bloqueou.
- Nova fonte (Orbitron) e logo refeito; licença GPL-3.0.

**Novo na 0.3:**
- **Benchmark** com o PresentMon (Intel, MIT, embutido em `src-tauri/resources/presentmon/`): FPS médio, 1% low, 0,1% low e engasgos, comparação antes × depois com gráfico de frametime e imagem para compartilhar.
- **Configs de pros**: 30 jogadores (`catalog/pros.json`), com código da mira, comandos, viewmodel, vídeo, periféricos e conversor de sensibilidade para o DPI do usuário. Só visualização e cópia; nada é aplicado sozinho.
- **Ferramentas**: limpeza de temporários/caches com tamanho liberado e teste de taxa de polling do mouse.
- **Desinstalador que oferece desfazer tudo** (`src-tauri/installer/hooks.nsh` + `csboost.exe --revert-all`). Não dispara em atualizações.


**Novo na 0.2:**
- **Histórico conferido:** relê o Windows na hora e mostra, para cada ajuste, o valor de antes, o que foi gravado e o que está lá agora — com "onde conferir no Windows" e aviso dos ajustes que só valem depois de reiniciar.
- **Atualização automática** assinada (ver seção 5).
- **Apoio:** link discreto para o Buy Me a Coffee (barra lateral e Configurações). Endereço em `src/components/Donate.tsx`.


**Raio-X do PC** (`src-tauri/src/diagnostics.rs`) — nota de 0 a 100 e lista de problemas por impacto:
- monitor rodando abaixo da taxa máxima → botão **Corrigir** troca o Hz (testa antes com `CDS_TEST`)
- notebook na bateria · plano de energia Economia/Equilibrado
- RAM provavelmente sem XMP/EXPO (DDR4 ≤ 2666 / DDR5 ≤ 4800) · canal único · pouca RAM
- CS2 podendo abrir na GPU integrada (PCs com 2 GPUs)
- driver de vídeo com 12+ meses · gravação em segundo plano ligada · disco cheio · Windows 10

**Motor de otimizações** (`engine.rs` + `catalog/tweaks.json`) — 14 ajustes, cada um com risco, evidência e presets:
- detecta o estado **real** do Windows (mostra "já estava no sistema" se outro programa aplicou)
- grava o valor anterior em `%LOCALAPPDATA%\CSBoost\journal.json` **antes** de escrever
- se uma ação falha no meio, desfaz as anteriores daquele ajuste
- reverter um, vários ou tudo · ponto de restauração do Windows antes do "Otimizar agora"
- **sem PowerShell e sem CMD** — só APIs oficiais (registro, powrprof, GDI, WMI, System Restore)

**Counter-Strike 2** (`cs2.rs`) — acha Steam e CS2 em qualquer biblioteca (`libraryfolders.vdf`), lê as opções de inicialização de cada conta, edita o `autoexec.cfg` (com backup no Histórico) e abre a verificação de arquivos da Steam.

**Telas:** Painel, Raio-X, Otimizações, Counter-Strike 2, Benchmark (placeholder honesto), Histórico, Configurações.

### Regra nº 1: nunca causar VAC ban (prioritária e inegociável)
- Nunca abrir, ler, escrever memória, injetar ou fazer hook no `cs2.exe`; nunca desenhar overlay dentro do jogo.
- Nunca mexer em binários/VPKs do jogo — só arquivos de configuração do usuário.
- Nunca sugerir `-allow_third_party_software`.
- **Garantido na compilação:** o `src-tauri/build.rs` (VAC guard) bloqueia o build se o código usar APIs de acesso a outros processos, crates de injeção ou launch options proibidas. Detalhes em [`CLAUDE.md`](CLAUDE.md).
- Todo ajuste novo precisa de `detect` + `apply` + `revert` funcionando.

---

## Estrutura

```
csboost/
├─ catalog/tweaks.json        ← catálogo de otimizações (adicione ajustes aqui)
├─ docs/                      ← brainstorm e pesquisa
├─ src/                       ← interface React
│  ├─ assets/brand/           ← logo (versão clara para fundo escuro), marca
│  ├─ assets/fonts/           ← fonte Counter-Strike (títulos)
│  ├─ components/             ← Sidebar, TitleBar, Gauge, IssueCard, ui
│  ├─ lib/                    ← api (ponte com o Rust), tipos, mock, store
│  └─ pages/                  ← uma tela por arquivo
└─ src-tauri/                 ← núcleo Rust
   ├─ src/platform/win.rs     ← TODA chamada ao Windows fica aqui
   ├─ src/engine.rs           ← detectar / aplicar / reverter
   ├─ src/journal.rs          ← backup das alterações
   ├─ src/diagnostics.rs      ← Raio-X
   ├─ src/cs2.rs + vdf.rs     ← Steam / CS2
   └─ src/commands.rs         ← comandos chamados pela interface
```

### Como adicionar uma otimização
1. Acrescente um item em `catalog/tweaks.json` (tipos de ação: `registry`, `power_plan`, `cs2_gpu_preference`).
2. Se precisar de um tipo novo, crie a variante em `catalog.rs` (`Action`), trate em `engine.rs` (`action_applied`, `apply_action`) e em `journal.rs` (`Change`) + `undo_change`.
3. Teste aplicar → reverter numa VM antes de liberar.

---

## Identidade visual

Cores tiradas do logo (`src/styles.css`, bloco `@theme`):

| Token | Hex | Uso |
|---|---|---|
| `amber` | `#F9AB19` | ação principal, raio, destaques |
| `navy` | `#28397F` | bloco da nota no Painel (ecoa a metade azul do logo) |
| `ink` | `#1C1C1C` | texto sobre botões âmbar (como no logo) |
| `base` / `panel` / `raised` | `#11142A` / `#181C36` / `#212647` | fundos, puxados para o azul do logo |

Tipografia: **Orbitron** (títulos em caixa alta, números grandes e o nome no logo) + **Barlow / Barlow Semi Condensed** (texto e interface). Todas com licença SIL Open Font License.
Logo: PNG em `src/assets/brand/` (usado no app) e SVG + PNG em `docs/brand/` (`light` = nome claro para fundo escuro; `dark` = nome escuro para fundo claro).

---

## Pendências e avisos

- **Benchmark:** próxima etapa — integrar o PresentMon (Intel, MIT) e mostrar FPS médio / 1% low antes × depois.
- **Assinatura de código:** pedido de assinatura gratuita na SignPath Foundation (projetos de código aberto). Passo a passo em `docs/SIGNPATH.md`; política em `docs/CODE_SIGNING_POLICY.md`.
- **Conta elevada diferente:** se um usuário comum autorizar o UAC com a senha de outro admin, os ajustes de `HKCU` vão para o perfil do admin. Caso raro; o Modo Sessão (serviço) resolve depois.
- **Ponto de restauração:** o Windows cria no máximo 1 a cada 24 h; se a Proteção do Sistema estiver desligada o app avisa e segue (o journal continua guardando tudo).
- **Atualização automática:** a primeira instalação da 0.2 é manual (a 0.1 não tinha atualizador); daí em diante é automático.
- Próximos itens do roadmap: Modo Sessão (serviço que liga/desliga ajustes quando o `cs2.exe` abre/fecha), perfil NVIDIA via NVAPI, licença + Mercado Pago, EN/ES.

## Licença

O CSBoost é software livre: você pode redistribuí-lo e modificá-lo sob os termos da
**GNU General Public License, versão 3 ou posterior** (`GPL-3.0-or-later`). Veja `LICENSE`.
Componentes de terceiros e suas licenças: `THIRD_PARTY_NOTICES.md`.

## Code signing policy

Free code signing provided by [SignPath.io](https://about.signpath.io), certificate by [SignPath Foundation](https://signpath.org).
Papéis, o que é assinado e a declaração de privacidade: [`docs/CODE_SIGNING_POLICY.md`](docs/CODE_SIGNING_POLICY.md).

## Privacidade

O CSBoost não coleta nem envia dados pessoais ou do computador. A única conexão automática é a consulta de novas versões no GitHub. O teste de rede só se conecta (lista pública de servidores da Steam + ping) quando você clica em Testar.

## Verificações feitas nesta versão
- `npm run build` (TypeScript + Vite) sem erros.
- `cargo check` e `cargo clippy` para `x86_64-pc-windows-msvc` sem erros nem avisos.
- Teste do leitor VDF (`libraryfolders.vdf`) e validação do catálogo.
- O app ainda **não foi executado num Windows real** — a primeira rodada de `npm run tauri dev` é o teste de verdade.
