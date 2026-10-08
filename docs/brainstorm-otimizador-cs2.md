# Brainstorm — Otimizador de Windows para CS2 (concorrente do TogsBoost)

> Documento de pesquisa e planejamento para construir um executável Windows, com interface bonita, que otimize o PC para Counter-Strike 2 — no mínimo igual ao TogsBoost, com a meta de ser melhor.
> Pesquisa feita em 07/10/2026. Itens marcados com **[verificar]** precisam ser confirmados em máquina real antes de entrar no produto.

---

## 0. Resumo executivo

- **O que o TogsBoost é:** um app Windows (Win10/11 64-bit, depende de .NET Framework e DirectX — provavelmente C#/WPF) que aplica "30+ opções de otimização" em 1 clique, com ajustes reversíveis, licença de uso único ou vitalícia por PC, pagamento via Mercado Pago (Pix/cartão), suporte e comunidade no Discord, e upsell de cursos de CS2 em combo.
- **Achado importante:** os números de CS2 que o TogsBoost exibe (503 → 622 FPS, +23,6%) são **idênticos** aos que o Hone.gg publica na sua página de CS2 (teste com i9-10900K + RTX 4090), e a estrutura de recursos do site ("Boost de FPS", "Suporte ao Game Boost", "Redução da latência", "Suporte prioritário", "Atualizações constantes") espelha a do Hone. Ou seja: o TogsBoost se posiciona como um "Hone brasileiro" com marca de jogador pro (togs, rifler da ODDIK). Isso abre espaço para um concorrente que ganhe em **transparência e prova real**.
- **Como ser melhor (tese do produto):**
  1. **Prova, não promessa** — benchmark embutido antes/depois (FPS médio, 1% low, frametime) usando PresentMon, sem injetar nada no jogo.
  2. **Diagnóstico de hardware** — achar os problemas que realmente roubam FPS (monitor em 60 Hz, XMP/EXPO desligado, jogo rodando na GPU integrada, plano de energia errado, throttling térmico). Esses dão ganhos maiores que qualquer tweak de registro.
  3. **Modo Sessão** — otimizações que ligam quando `cs2.exe` abre e se desfazem sozinhas quando fecha.
  4. **Tweaks transparentes** — cada ajuste mostra o que faz, o nível de risco, a evidência e permite reverter individualmente.
  5. **Módulo CS2 dedicado** — launch options, autoexec, config de vídeo, perfil de driver da GPU, tudo 100% compatível com o Trusted Mode da Valve.
- **Stack recomendada (para o seu perfil React/Tailwind):** **Tauri 2 + React + TypeScript + Tailwind** na interface, **Rust** no núcleo que mexe no Windows. Alternativa: .NET 8 + WPF (WPF-UI/Fluent).
- **Assinatura de código:** como pessoa/empresa no Brasil você **não** consegue usar o Azure Artifact Signing (antigo Trusted Signing); o caminho é um **certificado OV** de CA comercial emitido para o seu CNPJ.

---

## 1. Pesquisa de mercado

### 1.1 TogsBoost (referência principal)

| Item | O que o site diz |
|---|---|
| Promessa | Otimizar o PC "com 1 clique", +45% FPS médio, −60% input lag, +30 opções de otimização, +10 mil otimizações/usuários |
| Como funciona | Ajustes em processos em segundo plano, energia, memória, serviços e agendamento de CPU; "sem CMD, sem scripts"; otimizações reversíveis |
| Fluxo do app | Etapas: análise do sistema → preparação do Windows → otimizações em jogos → ajustes finos de input lag. Mostra o que está sendo aplicado e permite reverter |
| Níveis | Do "modo seguro" até "ajustes avançados" |
| Jogos | Diz suportar 150+ jogos; mostra CS2, Dota 2, Fortnite, LoL, Roblox, Valorant, Rocket League |
| Requisitos | Windows 10/11 64-bit, .NET Framework e DirectX instalados |
| App em segundo plano | Não precisa — aplica e fecha, ajustes persistem |
| Frequência | Recomendam rodar mensalmente |
| Licença | Uso único **ou** vitalícia, 1 PC por vez; formatou = compra de novo (no vitalício, reativa pelo Discord) |
| Pagamento | Mercado Pago (Pix/cartão); combos com cursos 15–25% off; timer de "oferta por tempo limitado" |
| Garantia | 7 dias (CDC art. 49) |
| Suporte | Discord (comunidade VIP) |
| Upsell | Cursos de CS2 ("Segredo dos Mapas" com mapas avulsos), plataforma de alunos |
| Idiomas | PT, EN, ES |
| Conflitos | FAQ admite que otimizações anteriores de outros programas podem impedir o app de abrir |

**Pontos fracos que dá para explorar:**
- Números genéricos de marketing (os mesmos do Hone), depoimentos sem método de teste.
- Licença presa à formatação/1 PC sem autoatendimento (precisa chamar no Discord).
- Sem medição embutida — o usuário só "sente" a diferença.
- Conflito com tweaks anteriores (não detecta o estado atual da máquina).

### 1.2 Concorrentes e referências

| Produto | Modelo | O que copiar / aprender |
|---|---|---|
| **Hone.gg** | Freemium (10 otimizações grátis, +1 por indicação, até 15; Premium mensal/anual) — 2,5 mi+ usuários, distribuído pela Epic Games Store e Overwolf | Backups, reversão total, otimizações por jogo, ajuste de Windows + GPU + configs do jogo, programa de indicação, Discord. Reviews no Trustpilot citam casos de *queda* de FPS — risco de tweaks "one size fits all" |
| **Razer Cortex** | Grátis | "Game Booster" que encerra processos ao abrir o jogo e restaura depois (= ideia do Modo Sessão) |
| **Process Lasso** | Pago | Regras persistentes por processo (prioridade, afinidade, plano de energia automático por jogo) |
| **Chris Titus WinUtil** | Open source (PowerShell) | Organiza em *Essential / Advanced / Additional tweaks*; regra do projeto: **todo tweak tem undo obrigatório**; import/export de seleção em JSON; em 2026 removeram o tweak de desativar Fullscreen Optimizations (sinal de que tweaks "clássicos" envelhecem) |
| **hellzerg Optimizer** | Open source (C#) | Templates de automação reutilizáveis, "unsafe mode" escondendo ajustes perigosos, publica SHA256 de cada release, 20+ idiomas |
| **Talon (RavenDevTeam)** | Open source | Posicionamento por transparência |
| **Tier1Timer / ISLC** | Ferramentas de timer resolution | Lidam com a mudança do Windows 11 (resolução do timer por processo/janela em foco) |
| **NoPing / ExitLag** | Assinatura | Atacam ping por rota — algo que um otimizador local **não** consegue fazer de verdade |
| **Atlas OS / ReviOS** | Windows modificado | Mostram até onde vai o "debloat" — e o custo em segurança/compatibilidade. Não é o caminho para um app comercial |

### 1.3 Público e posicionamento

- Jogador de CS2 brasileiro, 14–30 anos, PC médio/entrada (GTX 1650, RX 6600, RTX 3060/4060, Ryzen 5/7, i5), muitas vezes notebook.
- Dor real: FPS instável (1% low baixo), stutter, "PC não entrega o que deveria", desconfiança de programas que "estragam o Windows".
- **Posicionamento sugerido:** *"O otimizador que prova o que faz."* Benchmark antes/depois na tela, tudo reversível, 100% seguro com o Trusted Mode do CS2.

---

## 2. Regras de ouro (o que NÃO pode acontecer)

### 2.1 Anti-cheat / VAC — inegociável

- O CS2 roda por padrão em **Trusted Mode**: bloqueia software de terceiros que tenta injetar no processo do jogo. A Valve atualizou a política para incluir **VAC ban por adulteração direcionada do processo**, e no Trusted Mode qualquer injeção é considerada intencional.
- Para usar software que injeta, o jogador precisa da launch option `-allow_third_party_software`, que desliga o Trusted Mode (relatos da comunidade apontam impacto no Trust Factor).
- **Portanto o app NUNCA:**
  - injeta DLL, faz hook ou lê/escreve memória do `cs2.exe`;
  - desenha overlay dentro do jogo (overlay só como janela externa "always on top", ou nada);
  - modifica arquivos do jogo (VPK, binários) — só arquivos de **configuração do usuário** (`.cfg`, `cs2_video.txt`, launch options);
  - recomenda `-allow_third_party_software`.
- **Caso histórico para lembrar:** em outubro de 2023 o recurso **AMD Anti-Lag+** (que atuava dentro do processo via driver) gerou VAC bans em CS2; a Valve depois reverteu. Lição: nunca ativar automaticamente recursos de driver que mexem dentro do processo do jogo sem checar compatibilidade. **[verificar o estado atual do Anti-Lag 2 no CS2]**
- Medição de FPS deve usar **ETW via PresentMon**, que observa eventos do sistema e não toca no processo.

### 2.2 Tweaks que não entram (ou só em "modo perigoso", escondido)

| Tweak | Por quê evitar |
|---|---|
| Desativar Windows Defender | Risco de segurança enorme, vira argumento de "malware" contra você |
| Desativar Windows Update permanentemente | Segurança + quebra drivers |
| Desativar mitigações Spectre/Meltdown | Ganho pequeno, risco de segurança real |
| `bcdedit /set useplatformclock true` (forçar HPET) | Costuma **piorar** latência em hardware moderno |
| Desligar SysMain/Prefetch em HDD | Piora carregamento |
| Remover Microsoft Store / Xbox / Game Bar em PCs com Ryzen X3D de 2 CCDs | O driver de V-Cache da AMD usa a detecção de jogo da Game Bar para estacionar núcleos — remover pode **reduzir** FPS **[verificar com AMD 7950X3D/9950X3D]** |
| "Limpadores de registro" | Zero ganho, risco de quebrar |
| Desativar paginação (pagefile) | Crashes em jogos com picos de RAM |
| Editar arquivos do CS2 | VAC / "arquivos do jogo detectados" |

### 2.3 Honestidade nos números

Marketing com "+45% FPS" sem método é propaganda que pode dar problema (CDC, CONAR). Estratégia: **mostre os números da própria máquina do usuário** medidos pelo app. Isso é o seu maior diferencial.

---

## 3. Funcionalidades — escopo completo

Organizado em módulos. Coluna **Fase** indica MVP (1), v1.x (2), futuro (3).

### 3.1 Diagnóstico ("Raio-X do PC") — o diferencial nº 1

Antes de otimizar, o app escaneia e dá uma nota (0–100) com problemas priorizados por impacto.

| Check | Como detectar | Ganho típico | Fase |
|---|---|---|---|
| Monitor rodando abaixo da taxa máxima (ex.: 144 Hz em 60 Hz) | `EnumDisplaySettings` / DXGI comparando modos suportados | Enorme (percepção) | 1 |
| RAM sem XMP/EXPO | WMI `Win32_PhysicalMemory` (`ConfiguredClockSpeed` vs `Speed`) | 5–20% em CPU-bound (CS2 é CPU-bound) | 1 |
| Jogo rodando na GPU integrada (notebook) | `HKCU\Software\Microsoft\DirectX\UserGpuPreferences` + enumeração DXGI | Enorme | 1 |
| Notebook na bateria / modo economia | `GetSystemPowerStatus` | Grande | 1 |
| Plano de energia "Economia" | `PowerGetActiveScheme` | Médio | 1 |
| Driver de vídeo muito antigo | Versão via DXGI/NVAPI/ADLX vs data | Médio | 1 |
| Throttling térmico (CPU/GPU) | Sensores via LibreHardwareMonitor (lib) | Grande | 2 |
| Pouca RAM / single channel | WMI (`BankLabel`, quantidade de pentes) | Médio | 1 |
| Disco quase cheio / jogo em HDD | `GetDiskFreeSpaceEx`, tipo de mídia (MSFT_PhysicalDisk) | Carregamento/stutter | 1 |
| Resizable BAR desligado | NVAPI/ADLX **[verificar]** | Pequeno no CS2 | 2 |
| Muitos apps na inicialização / processos pesados abertos | Startup keys + Task Scheduler + `EnumProcesses` | Médio | 1 |
| Overlays conflitantes (Discord, GeForce, Afterburner) | Lista de processos | Estabilidade | 1 |
| Windows desatualizado/versão sem suporte (Win10 saiu de suporte em out/2025) | `RtlGetVersion` | Segurança | 1 |

Cada problema vira um card: **o que é → por que importa → botão "Corrigir" ou tutorial** (XMP precisa da BIOS: mostrar guia por fabricante de placa-mãe).

### 3.2 Otimizações do Windows (catálogo de tweaks)

Cada tweak é um item de dados (ver §5.3) com: id, título, descrição em linguagem simples, risco (Seguro / Moderado / Avançado), evidência (Comprovado / Situacional / Fraco), compatibilidade (Win10/Win11/build mínima, desktop/notebook), `detect`, `apply`, `revert`.

**Energia e CPU**
| Tweak | Implementação | Risco | Evidência |
|---|---|---|---|
| Plano de energia "Alto desempenho"/"Desempenho máximo" (duplicar `e9a42b02-d5df-448d-aa00-03f14749eb61`) | API `PowerDuplicateScheme`/`PowerSetActiveScheme` | Seguro (desktop); avisar em notebook | Comprovado em PCs presos em economia |
| Desativar estacionamento de núcleos (core parking) no plano | `PowerWriteACValueIndex` (subgrupo processador) | Moderado | Situacional — **não** aplicar em Ryzen X3D 2 CCD nem em Intel híbrido sem teste |
| Estado mínimo do processador 100% durante sessão | idem | Seguro | Situacional |
| `Win32PrioritySeparation` | `HKLM\SYSTEM\CurrentControlSet\Control\PriorityControl` | Moderado | Fraco/debatido — só modo avançado |

**Gráficos / Windows Gaming**
| Tweak | Implementação | Risco | Evidência |
|---|---|---|---|
| Modo de Jogo ligado | `HKCU\Software\Microsoft\GameBar\AutoGameModeEnabled=1` | Seguro | Situacional |
| Desativar gravação em segundo plano (Game DVR) | `HKCU\System\GameConfigStore\GameDVR_Enabled=0` e política `AllowGameDVR=0` | Seguro | Comprovado (custo de captura) |
| Agendamento de GPU acelerado por hardware (HAGS) | `HKLM\SYSTEM\CurrentControlSet\Control\GraphicsDrivers\HwSchMode=2` (reboot) | Moderado | Situacional — oferecer A/B com benchmark |
| Preferência de GPU de alto desempenho para `cs2.exe` | `UserGpuPreferences` → `GpuPreference=2;` | Seguro | Comprovado em notebook |
| Otimizações para jogos em janela (Win11) | `HKCU\Software\Microsoft\DirectX\UserGpuPreferences\DirectXUserGlobalSettings` **[verificar chave]** | Seguro | Situacional |
| Fullscreen Optimizations off para `cs2.exe` | `AppCompatFlags\Layers` | Moderado | Fraco — o próprio WinUtil removeu esse tweak em 2026 |

**Latência / timer**
| Tweak | Implementação | Risco | Evidência |
|---|---|---|---|
| `GlobalTimerResolutionRequests=1` (Win11) | `HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\kernel` (reboot) | Moderado | Situacional. Desde o Win10 2004 a resolução do timer passou a ser por processo; no Win11 processos minimizados/ocultos também deixam de ter a resolução garantida; esse valor restaura o comportamento global |
| Timer resolution 0,5 ms durante a sessão | `NtSetTimerResolution` chamado pelo próprio serviço do app enquanto `cs2.exe` roda | Moderado | Situacional — medir frametime antes/depois |
| MMCSS (`SystemResponsiveness`, `NetworkThrottlingIndex`, perfil "Games") | `HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile` | Moderado | Fraco — só avançado |

**Segundo plano / "debloat leve"**
| Tweak | Risco |
|---|---|
| Desativar apps de inicialização pesados (lista com toggle, nunca automático para antivírus/drivers) | Seguro |
| Desativar apps em segundo plano da Store | Seguro |
| Desativar telemetria (serviço DiagTrack, políticas de telemetria) | Seguro |
| Widgets, notícias, Copilot, sugestões/anúncios do Windows | Seguro |
| Efeitos visuais (animações, transparência) | Seguro — ganho mínimo, mas "sensação de PC rápido" |
| Notificações durante o jogo (Foco/Não Perturbe automático) | Seguro |
| Indexação de pesquisa em discos de jogos | Seguro |
| Desativar Delivery Optimization (upload de updates P2P) | Seguro — ajuda na rede |

**Mouse / entrada**
| Tweak | Risco |
|---|---|
| Desligar "Aumentar precisão do ponteiro" (no Windows; CS2 já usa raw input) | Seguro |
| Detectar polling rate alto + build antiga do Win11 com stutter de mouse (corrigido por update de 2023) → sugerir atualizar | Seguro |

**Rede (honesto)**
Um otimizador local não "baixa ping" da rota. O que dá para fazer de verdade:
- Detectar Wi-Fi vs cabo e recomendar cabo.
- Pausar consumidores de banda durante a sessão (OneDrive, Steam downloads, Delivery Optimization, Windows Update).
- Teste de bufferbloat/jitter (link para teste externo ou ping contínuo para relays da Valve **[verificar endpoints]**).
- Ajustes de placa de rede (Interrupt Moderation, economia de energia da NIC) — **modo avançado**, porque variam por driver.
- Não vender "redução de ping" como promessa.

**Limpeza**
| Item | Risco |
|---|---|
| Temporários do Windows e do usuário | Seguro |
| Cache de shader **(só reconstruir quando houver stutter após update de driver; explicar que a 1ª partida fica pior)** | Moderado |
| Logs/dumps antigos | Seguro |

### 3.3 Módulo CS2 (o "coração" do produto)

| Recurso | Detalhe técnico | Fase |
|---|---|---|
| Localizar Steam e CS2 | Registro `HKCU\Software\Valve\Steam\SteamPath` → `steamapps\libraryfolders.vdf` → biblioteca com app 730 | 1 |
| Detectar contas Steam | `Steam\userdata\<steamid3>` e `config\loginusers.vdf` | 1 |
| Launch options otimizadas | Editar `userdata\<id>\config\localconfig.vdf` (chave do app 730 → `LaunchOptions`). **Steam precisa estar fechada** — o app fecha/reabre com permissão. Nunca incluir `-allow_third_party_software`. Muitas opções antigas do CS:GO não funcionam mais no CS2 — manter lista curada | 1 |
| Autoexec | Gerar `autoexec.cfg` em `...\Counter-Strike Global Offensive\game\csgo\cfg\` + `+exec autoexec` nas launch options. Editor visual (crosshair, viewmodel, binds, `fps_max`) | 1 |
| Presets de vídeo | Ler/escrever `userdata\<id>\730\local\cfg\cs2_video.txt` **[verificar caminho/chaves na build atual]**; presets "FPS máximo", "Equilibrado", "Visibilidade competitiva" | 1 |
| NVIDIA Reflex / limite de FPS | Recomendar Reflex "Ativado + Boost" e cap de FPS levemente abaixo do máximo para estabilizar frametime (explicar trade-off) | 1 |
| Perfil de driver NVIDIA para `cs2.exe` | NVAPI DRS: modo de energia "Desempenho máximo preferido", qualidade de filtragem de textura "Alto desempenho", cache de shader. Referência de implementação: Nvidia Profile Inspector (open source) | 2 |
| Perfil AMD | ADLX SDK — **nunca** ligar recursos que atuem dentro do processo sem lista de compatibilidade (lembrar do Anti-Lag+) | 2 |
| Config de jogadores pro | Importar configs públicas (sensibilidade, crosshair) — fonte própria/licenciada, sem raspar sites de terceiros | 3 |
| Verificar integridade | Botão que abre `steam://validate/730` | 1 |

### 3.4 Benchmark embutido — o diferencial nº 2

- Captura via **PresentMon** (Intel, open source, MIT): FPS médio, **1% low**, 0,1% low, frametime, variação. Desde a 2.x roda sem admin e já é usado por OCCT, HWiNFO e FrameView.
  - Integração: rodar o `PresentMon` console como subprocesso com saída CSV, ou usar a API/serviço do PresentMon 2. Em .NET existe o pacote NuGet `PresentMonFps`.
- Fluxo: **"Medir agora"** → o usuário joga 60–90 s (ou roda um mapa de benchmark da Workshop) → app grava → aplica otimizações → mede de novo → **gráfico antes × depois** compartilhável (imagem para Instagram/Discord — marketing orgânico).
- Histórico por data e por mudança (ex.: "depois de ativar HAGS: 1% low +8%").
- **A/B automático para tweaks situacionais** (HAGS, timer, core parking): aplica, mede, mantém só se melhorou.

### 3.5 Modo Sessão (auto-boost)

- Serviço Windows leve (ou tarefa agendada com privilégio) que observa a criação de `cs2.exe` (ETW ou WMI `Win32_ProcessStartTrace`).
- Ao abrir o jogo: prioridade do processo, plano de energia de jogo, timer resolution, pausar apps pesados/sincronizações, Não Perturbe, limpar standby list **[situacional]**.
- Ao fechar: **reverte tudo** para o estado anterior.
- Isso resolve a crítica de "otimizar o Windows inteiro de forma permanente" e é algo que o TogsBoost não comunica.

### 3.6 Segurança e reversão (obrigatório desde o MVP)

1. **Ponto de restauração** antes da primeira aplicação (`SRSetRestorePoint` / WMI `SystemRestore`) — avisar se a Proteção do Sistema estiver desligada e oferecer ligar.
2. **Journal próprio**: antes de cada mudança, gravar o valor anterior (registro, serviço, plano de energia, arquivo) em um banco SQLite local. Reverter = ler o journal ao contrário.
3. **Reverter individual, por categoria ou tudo.**
4. **Detecção de estado atual**: o app lê o estado real de cada tweak (não presume). Resolve o problema do TogsBoost com tweaks anteriores de outros programas: mostra "já aplicado por outro programa" em vez de quebrar.
5. **Exportar relatório** (JSON/TXT) para o suporte.

### 3.7 Extras que agregam valor

- **Atualização remota do catálogo de tweaks** (JSON assinado), sem lançar novo executável.
- **Monitor ao vivo** (fora do jogo): CPU/GPU uso, temperatura, clocks, RAM — via LibreHardwareMonitor.
- **Gerenciador de inicialização** e **desinstalador de bloatware** com lista curada.
- **Modo "PC fraco"**: preset agressivo de gráficos do CS2 + debloat mais forte.
- **Perfis**: "Competitivo", "Stream" (mantém OBS/Discord), "Notebook na tomada".
- **Multi-idioma** PT/EN/ES desde o início (o TogsBoost já tem os 3).

---

## 4. Stack tecnológica

### 4.1 Opções avaliadas

| Opção | Prós | Contras | Veredito |
|---|---|---|---|
| **Tauri 2 + React/TS + Tailwind + Rust** | Você já domina React/Tailwind → UI linda e rápida de iterar; instalador pequeno (poucos MB, contra ~85–240 MB do Electron) e menos memória; Rust tem acesso completo à Win32 via crate `windows`; updater oficial com assinatura | Curva do Rust; depende do WebView2 (já vem no Win10/11); Tauri gera `.exe`/`.msi` (sem MSIX) | **Recomendado** |
| .NET 8 + WPF (lib WPF-UI) ou WinUI 3 | Melhor acesso nativo a Windows (WMI, serviços, registro, NVAPI wrappers prontos); ecossistema enorme; o TogsBoost provavelmente usa .NET | XAML é outro mundo vs. web; UI "bonita" dá mais trabalho | Boa alternativa |
| Electron + helper C#/Rust | Fácil para quem é web | Pesado; app de "otimização" que consome 300 MB de RAM é contraditório | Evitar |
| Python (PyInstaller) + PySide | Você usa Python todo dia | Executáveis empacotados são campeões de falso positivo em antivírus; lento para abrir | Evitar para o produto (ok para protótipos/scripts de pesquisa) |

### 4.2 Arquitetura recomendada (Tauri)

```
┌───────────────────────────────────────────────┐
│  UI (WebView2) — React + TS + Tailwind        │
│  telas, gráficos (Recharts), i18n, animações  │
└───────────────▲───────────────────────────────┘
                │ invoke() / events (IPC Tauri)
┌───────────────┴───────────────────────────────┐
│  Core Rust (processo do app, elevado via UAC) │
│  • tweak_engine (detect/apply/revert)         │
│  • journal (SQLite) + restore point           │
│  • diagnostics (WMI, DXGI, power, display)    │
│  • cs2 (Steam/VDF/cfg)                        │
│  • gpu (NVAPI / ADLX via FFI)                 │
│  • bench (PresentMon subprocess + parser CSV) │
│  • license (verificação Ed25519 offline)      │
└───────────────▲───────────────────────────────┘
                │ named pipe (comandos assinados)
┌───────────────┴───────────────────────────────┐
│  Serviço Windows "Session Agent" (fase 2)     │
│  detecta cs2.exe → aplica/reverte sessão      │
└───────────────────────────────────────────────┘
          ▲ HTTPS
┌─────────┴──────────────────────────────────────┐
│ Backend: licenças, webhooks Mercado Pago,      │
│ catálogo de tweaks assinado, updates, métricas │
│ (Firebase/Cloud Functions ou Supabase)         │
└────────────────────────────────────────────────┘
```

- **Elevação:** MVP com manifesto `requireAdministrator` (simples, igual ao que a concorrência faz). Fase 2: app roda sem admin e o serviço faz o trabalho privilegiado (UX melhor, sem UAC toda hora).
- **Crates Rust úteis:** `windows` (Win32/WMI/COM), `winreg`, `wmi`, `serde`/`serde_json`, `rusqlite`, `keyvalues-parser` ou `vdf` (arquivos da Steam), `sysinfo`, `ed25519-dalek`, `tracing`.
- **Front:** React + TS, Tailwind, Framer Motion (transições), Recharts/visx (gráficos), i18next, Zustand (estado), shadcn/ui como base de componentes.
- **Hardware sensors:** LibreHardwareMonitor é .NET — opções: rodar um pequeno sidecar .NET, ou começar só com o que vem de NVAPI/ADLX/WMI.

### 4.3 Estrutura de pastas

```
cs2boost/
├─ apps/desktop/               # Tauri
│  ├─ src/                     # React (UI)
│  │  ├─ pages/ (Home, RaioX, Otimizar, CS2, Benchmark, Sessao, Historico, Config)
│  │  ├─ components/
│  │  └─ i18n/ (pt-BR, en, es)
│  └─ src-tauri/
│     ├─ src/
│     │  ├─ tweaks/ (engine.rs, registry.rs, services.rs, power.rs, files.rs)
│     │  ├─ diagnostics/
│     │  ├─ cs2/
│     │  ├─ gpu/ (nvapi.rs, adlx.rs)
│     │  ├─ bench/
│     │  ├─ journal/
│     │  └─ license/
│     ├─ resources/presentmon/
│     └─ tauri.conf.json
├─ catalog/                    # tweaks em JSON (versionado, assinado no CI)
├─ service/                    # Session Agent (Rust, windows-service crate)
├─ backend/                    # Cloud Functions / Supabase
└─ lab/                        # scripts de benchmark e matriz de testes
```

---

## 5. Motor de tweaks (design)

### 5.1 Princípios

- **Data-driven:** tweaks em JSON → você adiciona/ajusta sem recompilar; atualização remota do catálogo.
- **Idempotente:** aplicar duas vezes = mesmo resultado.
- **Sempre detectar antes**, sempre gravar o valor original, sempre ter revert.
- **Tipos primitivos** (o motor só sabe fazer estes): `registry`, `service_start_type`, `power_setting`, `scheduled_task`, `file_write`, `appx_remove` (avançado), `custom` (código Rust nomeado, para casos como NVAPI).
- Sem PowerShell/CMD executado pelo app (heurística de antivírus + o TogsBoost usa "sem CMD" como argumento de venda — você também deve poder dizer isso).

### 5.2 Ciclo de vida

```
detect() → estado: Default | Aplicado | Personalizado | NãoSuportado
apply()  → journal.save(valor_antigo) → escreve → verifica → ok/rollback
revert() → journal.load() → restaura → verifica
```

### 5.3 Exemplo de definição

```json
{
  "id": "gamedvr.disable",
  "version": 2,
  "category": "graficos",
  "title": { "pt-BR": "Desativar gravação em segundo plano", "en": "Disable background recording" },
  "description": { "pt-BR": "O Windows pode gravar os últimos minutos de jogo o tempo todo. Isso consome GPU e disco." },
  "risk": "safe",
  "evidence": "proven",
  "requires_reboot": false,
  "applies_to": { "os": ["win10", "win11"], "min_build": 19045, "form_factor": ["desktop", "laptop"] },
  "actions": [
    { "type": "registry", "hive": "HKCU", "path": "System\\GameConfigStore", "name": "GameDVR_Enabled", "kind": "DWORD", "value": 0 },
    { "type": "registry", "hive": "HKLM", "path": "SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR", "name": "AllowGameDVR", "kind": "DWORD", "value": 0 }
  ],
  "presets": ["seguro", "competitivo", "pc_fraco"]
}
```

### 5.4 Esqueleto em Rust (registro com journal)

```rust
pub fn apply_registry(a: &RegAction, j: &Journal, tweak_id: &str) -> Result<()> {
    let key = open_or_create(a.hive, &a.path)?;
    let previous = read_value(&key, &a.name).ok(); // None = não existia
    j.record(tweak_id, Change::Registry {
        hive: a.hive, path: a.path.clone(), name: a.name.clone(), previous,
    })?;
    write_value(&key, &a.name, &a.value)?;
    ensure!(read_value(&key, &a.name)? == a.value, "verificação falhou");
    Ok(())
}

pub fn revert(j: &Journal, tweak_id: &str) -> Result<()> {
    for change in j.changes_for(tweak_id)?.into_iter().rev() {
        change.undo()?; // previous None => apaga o valor; Some(v) => restaura v
    }
    j.mark_reverted(tweak_id)
}
```

### 5.5 Presets (o "1 clique")

| Preset | Público | Conteúdo |
|---|---|---|
| **Seguro** (padrão) | Todo mundo | Só `risk=safe` + `evidence` ≥ situacional com detecção de hardware |
| **Competitivo** | Quem joga ranqueada | Seguro + timer/sessão + presets CS2 + perfil de GPU |
| **PC fraco** | Entrada/notebook | Competitivo + debloat mais forte + vídeo mínimo |
| **Avançado** | Entusiasta | Tudo, item a item, com aviso de risco e A/B por benchmark |

O botão grande "OTIMIZAR" = rodar Raio-X → aplicar preset recomendado para aquela máquina → oferecer benchmark depois.

---

## 6. Interface (UX/UI)

### 6.1 Direção visual
- Dark mode nativo (público gamer), acento em cor própria (evitar o azul-marinho `#0B0940` do TogsBoost e o vermelho do Hone para não parecer clone).
- Janela sem moldura padrão (custom titlebar), cantos arredondados, efeito Mica/Acrylic do Windows 11 quando disponível (Tauri tem suporte via `window-vibrancy`).
- Microanimações ao aplicar (progress por etapa, checks animados) — o "1 clique" precisa *parecer* trabalho sendo feito, mas de forma honesta (cada etapa = ação real).
- Tipografia forte para números (FPS grande, mono para valores técnicos).

### 6.2 Telas

1. **Onboarding** (1ª execução): termos curtos, criar ponto de restauração, ativar licença, escolher idioma.
2. **Home / Painel**: nota do PC (0–100), FPS médio/1% low da última medição, botão gigante "OTIMIZAR", status do Modo Sessão, alertas.
3. **Raio-X**: lista de problemas por impacto, cada um com "Corrigir" ou "Como resolver".
4. **Otimizações**: categorias (Energia, Gráficos, Latência, Segundo plano, Rede, Limpeza) com toggles; badge de risco e evidência; "Aplicar selecionados"; "Reverter tudo".
5. **CS2**: launch options (editor visual), autoexec, presets de vídeo, Reflex/FPS cap, perfil da GPU, validar arquivos.
6. **Benchmark**: medir, comparar, histórico, exportar imagem para compartilhar.
7. **Modo Sessão**: ligar/desligar, o que acontece ao abrir/fechar o jogo, apps a pausar.
8. **Histórico / Backups**: linha do tempo de alterações, reverter por item/data, pontos de restauração.
9. **Configurações / Conta**: licença, dispositivos, idioma, atualização, suporte (abrir Discord), exportar relatório.

### 6.3 Ferramentas para desenhar
Você pode prototipar no Figma/Claude Design e já construir os componentes direto em React + Tailwind (mesmo vocabulário que você usa nas LPs). Vale montar um mini design system (tokens de cor, espaçamentos, componentes Card/Toggle/Badge/Metric) desde o começo.

---

## 7. Licenciamento, vendas e backend

### 7.1 Modelo de licença (comparativo)
| Modelo | Exemplo | Comentário |
|---|---|---|
| Uso único por PC | TogsBoost | Receita rápida, mas frustra quem formata |
| Vitalícia 1 PC | TogsBoost | Bom ticket; transferência manual via Discord é fricção |
| Freemium + assinatura | Hone | Escala, mas brasileiro resiste a assinatura em ferramenta |
| **Sugestão** | — | **Grátis**: Raio-X + preset Seguro + 1 benchmark (gera confiança e boca a boca). **Pro vitalício**: tudo + Modo Sessão + CS2 completo + A/B, **2 PCs**, com **autoatendimento** para desativar um PC e ativar outro (1 troca/mês). Combos com cursos/configs como o concorrente |

### 7.2 Fluxo técnico
1. Checkout Mercado Pago (Pix/cartão) no site → **webhook** → Cloud Function cria licença no banco (Firestore/Supabase) e envia e-mail com a chave.
2. App ativa: envia chave + **HWID** (hash de `MachineGuid` + serial da placa-mãe + serial do disco do sistema) → backend devolve um **arquivo de licença assinado com Ed25519** (chave pública embutida no app).
3. App valida offline; revalida online a cada X dias (tolerância para quem joga sem internet).
4. Portal do cliente: ver dispositivos, desativar, baixar app, recuperar chave (o TogsBoost tem página "Recuperar Key").
- Alternativa pronta: **Keygen.sh** (licenças + ativação por máquina + offline) e integrar só o pagamento.
- Pirataria: aceitar que vai existir; foco em valor contínuo (catálogo atualizado online, benchmark, suporte) que cópia pirata não recebe.

### 7.3 Atualizações
- `tauri-plugin-updater` com manifesto assinado (canal estável/beta).
- Catálogo de tweaks separado e assinado (atualiza sem reinstalar).

### 7.4 Telemetria (opt-in, LGPD)
- Só agregados anônimos: hardware (modelo de CPU/GPU), tweaks aplicados, ganho medido no benchmark. Isso vira **o seu dataset de prova** ("média de +X% de 1% low em RTX 3060 + Ryzen 5 5600 em 1.200 medições") — marketing que ninguém mais tem.
- Política de privacidade e termos claros; botão para apagar dados.

---

## 8. Distribuição, assinatura e antivírus

### 8.1 Code signing (crítico)
- Sem assinatura → SmartScreen "O Windows protegeu o computador" + antivírus desconfiando = conversão despenca.
- **Azure Artifact Signing** (antigo Trusted Signing, ~US$ 9,99/mês) só atende **organizações dos EUA, Canadá, UE e Reino Unido** e **indivíduos dos EUA e Canadá** → **não serve para você no Brasil**.
- Caminho: **certificado OV** de uma CA (Sectigo, DigiCert, Certum, SSL.com etc.), na faixa de US$ 150–300/ano, emitido para o seu **CNPJ**. Hoje exige token de hardware ou HSM em nuvem.
- Desde 1º/03/2026 certificados de code signing valem no máximo ~458–460 dias → renovação anual.
- EV já não dá confiança instantânea no SmartScreen; a reputação acumula com downloads ao longo do tempo. OV é suficiente.
- Publique SHA256 de cada release (como o Optimizer do hellzerg).

### 8.2 Falsos positivos
Apps que mexem em registro/serviços são alvo natural de heurísticas. Mitigações:
- Não usar packers/ofuscadores agressivos; não baixar e executar scripts; não usar PowerShell.
- Assinar **todos** os binários (app, serviço, PresentMon embarcado já é assinado pela Intel).
- Enviar cada release para análise: Microsoft Defender (portal WDSI), e principais AVs populares no Brasil (Avast/AVG, Kaspersky, ESET, Norton).
- Testar no VirusTotal antes de publicar.

### 8.3 Canais
- Site próprio (LP no seu estilo — você já faz isso) + download direto.
- Discord (suporte + comunidade), Instagram/TikTok (vídeos de antes/depois), parcerias com streamers/pros brasileiros (o TogsBoost usa o nome de um pro como marca).
- Futuro: Microsoft Store (MSIX — exige outro empacotamento), Epic/Overwolf como o Hone.

---

## 9. Laboratório de testes e QA

- **Máquinas virtuais** (Hyper-V/VMware) com snapshots: Win10 22H2, Win11 23H2, 24H2, 25H2 — para validar apply/revert (não para medir FPS).
- **Máquinas reais** para benchmark (mínimo 3 perfis): entrada (GTX 1650 / i5 notebook), médio (RTX 3060 / Ryzen 5 5600), alto (RTX 4070+ / Ryzen 7 X3D). Incluir pelo menos 1 notebook com GPU híbrida e 1 Intel híbrido (12ª gen+).
- **Protocolo de benchmark:** mesma demo/mapa, 3 execuções, descartar a 1ª (shader cache), reportar média, 1% low e desvio. Sem isso, os números não valem.
- **Testes automatizados:** cada tweak com teste `apply → detect == Aplicado → revert → detect == estado original` rodando em VM no CI (GitHub Actions com runner Windows).
- **Beta fechado** com 30–50 jogadores do Discord antes do lançamento; coletar relatórios exportados.

---

## 10. Jurídico e negócio

- **CNPJ** e nota fiscal (você já opera como empresa).
- **Termos de uso** com limitação de responsabilidade + **política de privacidade** (LGPD) + direito de arrependimento de 7 dias (CDC art. 49).
- **Marcas:** "Counter-Strike", "CS2", "Valve" e "Steam" são marcas da Valve — usar só de forma descritiva ("otimizador para CS2"), sem logo oficial como se fosse parceria. Escolher um nome próprio e checar no INPI.
- **Publicidade:** claims de FPS baseados em teste documentado (método publicado). Evitar "100% seguro, sem risco de ban" como garantia absoluta; dizer "não interage com o processo do jogo e é compatível com o Trusted Mode".
- **Licenças open source:** PresentMon (MIT) — incluir aviso de licença. Ao se inspirar em WinUtil/Optimizer, não copie código (verificar licença de cada um); copie *ideias*.

---

## 11. Roadmap sugerido

| Fase | Duração estimada | Entregas |
|---|---|---|
| **0 — Lab e validação** | 2 semanas | Montar máquinas de teste, protocolo de benchmark, medir ~25 tweaks candidatos individualmente no CS2, descartar os placebos. Saída: catálogo v0 com evidência real |
| **1 — MVP** | 6–8 semanas | Tauri + React; Raio-X (monitor Hz, XMP, GPU integrada, energia, startup); motor de tweaks com journal e ponto de restauração; preset Seguro/Competitivo; módulo CS2 (launch options, autoexec, preset de vídeo); benchmark antes/depois com PresentMon; licença + Mercado Pago; assinatura OV; PT-BR |
| **2 — Diferenciação** | 4–6 semanas | Modo Sessão (serviço), A/B automático, perfil NVIDIA (NVAPI), monitor de temperaturas, histórico, compartilhamento de resultados, EN/ES, portal do cliente |
| **3 — Escala** | contínuo | AMD ADLX, outros jogos (Valorant tem anti-cheat de kernel — cuidado redobrado), configs de pros, dataset público de ganhos, programa de afiliados/indicação, Microsoft Store |

**Equipe mínima:** você (design + front + produto) + apoio em Rust/Windows (freela ou desenvolvimento assistido por IA) + 1 pessoa de suporte/comunidade no lançamento.

---

## 12. Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Tweak quebra o Windows de alguém | Suporte, reputação | Journal + restore point + VM tests + rollout gradual do catálogo |
| Falso positivo de antivírus | Vendas | Assinatura, sem PowerShell/packers, envio prévio aos AVs |
| Mudança da Valve no Trusted Mode/VAC | Crítico | Nunca tocar no processo; acompanhar atualizações do CS2; só arquivos de config |
| Ganhos pequenos em PCs já bem configurados | Reembolso/frustração | Raio-X mostra antes de vender; benchmark honesto; plano grátis |
| Concorrência com marca de pro player | Aquisição | Diferenciar por prova (dados reais) + parcerias com creators |
| Mudanças do Windows (ex.: timer no 24H2) invalidam tweaks | Médio | Catálogo remoto com `min_build`/`max_build` por tweak |
| Win10 sem suporte desde out/2025 | Médio | Manter compatibilidade, mas alertar usuário |

---

## 13. Checklist "ser melhor que o TogsBoost"

- [ ] Benchmark embutido com 1% low (eles não têm)
- [ ] Raio-X de hardware com correções que dão FPS de verdade (monitor Hz, XMP, GPU certa)
- [ ] Modo Sessão que reverte ao fechar o jogo
- [ ] Cada tweak explicado + risco + evidência + revert individual
- [ ] Detecção de tweaks de outros programas (eles admitem conflito)
- [ ] Licença com autoatendimento de troca de PC (eles exigem Discord)
- [ ] Plano grátis para gerar confiança
- [ ] Números de marketing medidos pelos próprios usuários (opt-in)
- [ ] Módulo CS2 profundo (launch options, autoexec, vídeo, perfil de GPU) 100% compatível com Trusted Mode
- [ ] Instalador pequeno, app leve (Tauri), sem dependência manual de .NET/DirectX
- [ ] Interface própria, moderna, PT/EN/ES

---

## 14. Próximos passos imediatos

1. Definir nome e identidade visual (e checar INPI + domínio).
2. Montar o lab de benchmark (Fase 0) e testar os tweaks candidatos — esse dado decide o catálogo e vira o marketing.
3. Scaffold: `npm create tauri-app@latest` (template React + TS) + Tailwind + estrutura de pastas da §4.3.
4. Implementar o motor de tweaks com journal e 5 tweaks seguros ponta a ponta (apply/detect/revert).
5. Integrar PresentMon e fazer a primeira tela de benchmark — é a "demo" que convence.
6. Orçar certificado OV para o CNPJ (prazo de validação pode levar dias/semanas).

---

## Fontes

- [TogsBoost — Home](https://togsboost.com.br/) · [Sobre](https://togsboost.com.br/sobre) · [FAQ](https://togsboost.com.br/faq) · [Planos](https://togsboost.com.br/comprar)
- [Hone.gg — CS2](https://hone.gg/games) · [Hone Premium](https://hone.gg/premium) · [Trustpilot Hone](https://au.trustpilot.com/review/hone.gg?page=3)
- [esports.gg — Best PC gaming optimizers](https://esports.gg/guides/gaming/best-pc-gaming-optimizers-2025/)
- [Steam Support — CS2 Trusted Mode](https://help.steampowered.com/faqs/view/09A0-4879-4353-EF95)
- [Refrag — Best launch options for CS2](https://refrag.gg/blog/best-launch-options-for-cs2)
- [ChrisTitusTech/winutil — releases](https://github.com/ChrisTitusTech/winutil/releases)
- [hellzerg/optimizer — releases](https://github.com/hellzerg/optimizer/releases?page=1)
- [PresentMon 2.3 (KitGuru)](https://www.kitguru.net/page/127/!https:/www.kitguru.net/gaming/joao-silva/presentmon-2-3-adds-support-for-xefg-xell-and-amd-fluid-motion-frames/) · [PresentMonFps (NuGet)](https://nuget.org/packages/PresentMonFps)
- [Wagnardsoft — GlobalTimerResolutionRequests](https://www.wagnardsoft.com/forums/viewtopic.php?p=11479) · [TechPowerUp — timer resolution no Win11](https://techpowerup.com/forums/posts/5059460)
- [Microsoft Learn — Code signing options](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options) · [Microsoft Q&A — Artifact Signing elegibilidade](https://learn.microsoft.com/en-us/answers/questions/5915697/can-an-irish-sole-trader-(non-incorporated)-qualif) · [Code signing 2026 (codenote)](https://codenote.net/en/posts/windows-desktop-app-code-signing-distribution-japan-2026/)
- [Tauri 2 vs Electron (noqta)](https://noqta.tn/en/blog/tauri-2-desktop-apps-rust-web-technologies-2026) · [Electron vs Tauri (DoltHub)](https://www.dolthub.com/blog/2025-11-13-electron-vs-tauri/)
