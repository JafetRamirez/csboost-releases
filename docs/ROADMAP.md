# CSBoost — Roadmap de melhorias

## Status (atualizado na v0.4.0)
- ✅ #1 Benchmark integrado (PresentMon) com comparação e imagem para compartilhar
- ✅ #3 Desinstalador oferece "Reverter tudo" (não dispara em atualização)
- ✅ #4 Código-fonte público no GitHub + SHA256 de cada instalador nas notas da versão
- ✅ #6 Limpeza de temporários e caches
- ✅ #9 Configs de pros (30 jogadores) + conversor de sensibilidade
- ✅ #11 Teste do mouse (taxa de polling)
- ✅ #2 Placa de vídeo em uso pelo CS2 (contadores do Windows) + guia de MUX por marca de notebook (v0.4)
- ✅ #12 Manutenção: ao abrir, avisa se o Windows desfez algum ajuste e reaplica com um clique (v0.4). Falta o lembrete mensal
- ✅ #13 Teste de rede grátis: ping, variação e perda até os relays da Valve + aviso de Wi-Fi (v0.4). Falta bufferbloat e ajustes da placa de rede
- ✅ #14 Português, espanhol e inglês no app, no instalador e na LP (v0.4)
- ⏳ #5 Assinatura de código: grátis pela SignPath Foundation (pedido em andamento; ver `docs/SIGNPATH.md`). Repositório já em GPL-3.0, fonte trocada para Orbitron (OFL) e logo refeito
- Próximos: #21 central de ajuda, #22 abrir chamado, #7 Modo Sessão, #8 presets de vídeo, #10 perfil NVIDIA

### Correções para o próximo update
- ✅ **Configs de pros → conversor de sensibilidade** (corrigido na v0.4) (`src/pages/Pros.tsx`, card "Mesma sensibilidade do … no seu mouse"): em janela estreita o card quebra. "Seu DPI" vira duas linhas, o resultado `sensitivity 1` quebra e o botão "Copiar" vaza para fora do card. Corrigir a responsividade: empilhar input e resultado quando faltar espaço, `whitespace-nowrap` no comando e botão dentro do card. (Visto em 08/10/2026, janela de ~1270 px.)
- ✅ **Workflows do GitHub:** `actions/checkout` e `actions/setup-node` já em `@v5`.


> Montado em 08/10/2026 a partir de: comentários do post de lançamento no grupo de CS2 (v0.2.0), pesquisa do **Hone** (o "H0nda" citado nos comentários — hone.gg) e de outros otimizadores (Razer Cortex, Wise Game Booster, EXMTweaks, Talon).
> **Regra nº 1 continua valendo para tudo aqui: nada pode arriscar VAC ban** (ver `CLAUDE.md`). Itens que esbarram nisso estão marcados com ⚠️ e a forma segura de fazer.

---

## 1. O que a comunidade disse (v0.2.0)

| Comentário | O que significa | Ação |
|---|---|---|
| Gustavo (GTX 1050 Ti, Ryzen 5 4500, 16 GB): 225 → 272 FPS no teste; Dust 2 de 150 (drops a 105) → 172–190 estável; "ms" de 10,4 → 5,5 | O ganho apareceu justamente num PC de entrada, e ele citou estabilidade, não só pico | Pedir permissão para usar como depoimento. Prova de que o **1% low / estabilidade** é o argumento, não o FPS máximo |
| Jones (Acer Nitro 5, RTX 3050): "o CS não usa a placa de vídeo do notebook", 120–150 FPS na integrada vs 280–340 na dedicada | Problema clássico de notebook com GPU híbrida | Já temos o ajuste "CS2 na GPU dedicada". Falta: **detectar em qual GPU o jogo está rodando** e orientar sobre MUX switch (NitroSense, Armoury Crate, Legion Vantage) |
| Everton: "Só não vai roubar minhas senhas!" / Vitor: "Repo só para release é foda" | Desconfiança natural com um .exe sem assinatura | **Transparência**: código aberto, link do VirusTotal em cada release, SHA256, certificado de assinatura |
| Ezequias: "É tipo o do H0nda? Ele tem algo muito parecido, só que pago" | O público já conhece o Hone e compara | Posicionar: **grátis, sem anúncio, leve, e você confere tudo** (ver seção 2) |
| Juan: "não jogo CS, vou testar no PUBG e FiveM" | Demanda por outros jogos | Ajustes do Windows já servem para qualquer jogo. Módulos por jogo só com cuidado de anti-cheat (seção 4) |
| Muitos "curte pra eu testar depois" | Interesse alto, conversão depende de facilidade | Página de download simples, vídeo curto de 30 s mostrando o Raio-X |

---

## 2. Hone × CSBoost

**O que o Hone tem** (site oficial e Trustpilot):
- Grátis com limite de **10 otimizações** (+1 por indicação, até 15), **com anúncios**; Premium por assinatura mensal/anual remove anúncios e libera tudo.
- **Game Mode** (Balanced no grátis; Custom e Performance no Premium): gerencia processos e serviços em segundo plano durante o jogo.
- **Game Presets**: salva/importa conjuntos de configurações por jogo (presets "Premium" exclusivos).
- **Boost-Ups**: executa ou agenda tarefas agrupadas.
- Limpeza de arquivos inúteis, backups/ponto de restauração antes das mudanças, guias por jogo com "limitações conhecidas", recordes de FPS, changelog.
- App em **Electron (~122 MB)**, distribuído pela Epic Games Store e Overwolf.

**Onde os usuários do Hone reclamam** (nossa oportunidade):
- Reversão incompleta: serviços desligados e plano de energia que **não voltam ao desinstalar** ("levei um dia inteiro para desfazer tudo").
- Presets que quebraram o jogo (tela preta) e instabilidade/travamentos.
- Antivírus acusando o app.
- Plano grátis "dá pouco", paywall, anúncios.

**Onde o CSBoost já ganha:** 100% grátis e sem anúncio · ~2,6 MB · tudo reversível com o valor de antes salvo · conferência "antes → agora" · regra anti-VAC travada na compilação.

**Onde o Hone ainda ganha:** Game Mode automático, presets por jogo, limpeza, agendamento, vários jogos, presença em lojas (Epic/Overwolf), assinatura digital.

---

## 3. Prioridades

Legenda — **Impacto**: o quanto melhora o resultado ou a confiança · **Esforço**: P (dias), M (1–2 semanas), G (3+ semanas)

### Agora (v0.3 – v0.4)

| # | Melhoria | Por quê | Impacto | Esforço |
|---|---|---|---|---|
| 1 | **Benchmark integrado (PresentMon)** — FPS médio, 1% low, 0,1% low e gráfico de frametime antes × depois, com **card para compartilhar** | O Gustavo fez isso "na mão". É a prova que nenhum concorrente mostra e vira marketing orgânico nos grupos | Muito alto | M |
| 2 | **Detectar GPU em uso pelo CS2** (lendo os contadores de GPU do Windows, sem tocar no jogo) + guia de MUX switch por marca de notebook | Caso do Jones; notebook gamer é grande parte do público | Alto | P |
| 3 | **Desinstalador que oferece "Reverter tudo"** antes de remover o app | É a maior reclamação do Hone. Vira argumento de venda: "sai limpo" | Alto | P |
| 4 | **Transparência**: código-fonte público, link do VirusTotal e SHA256 em cada release, página "o que o CSBoost faz e não faz" | Responde direto ao medo de "roubar senha" | Alto | P |
| 5 | **Assinatura de código** grátis pela SignPath Foundation (projeto open source). O OV pago foi descartado pela regra de produto 100% gratuito | Reduz o aviso do Chrome e os alertas de antivírus; o SmartScreen melhora com a reputação | Alto | P (+ prazo de aprovação) |
| 6 | **Limpeza** (temporários, cache de shader do driver *só quando o usuário pede*, logs antigos) com tamanho liberado | Usuários do Hone elogiam; dá sensação de resultado imediato | Médio | P |

### Próximo (v0.5 – v0.7)

| # | Melhoria | Por quê | Impacto | Esforço |
|---|---|---|---|---|
| 7 | **Modo Sessão** (o "Game Mode" do Hone, melhorado): ao abrir o CS2, pausa atualizações do Windows/OneDrive/Steam downloads, liga Não Perturbe e plano de máximo desempenho; **ao fechar, desfaz tudo sozinho** | Recurso mais valorizado do Hone e que ele cobra | Muito alto | M |
| 8 | **Presets de vídeo do CS2** (FPS máximo, Equilibrado, Visibilidade) gravando o `cs2_video.txt` com o jogo fechado | Equivale aos "Game Presets" do Hone | Alto | M |
| 9 | **Configs de pros** (sensibilidade, crosshair, viewmodel) + **conversor de eDPI** | Muito pedido em grupos de CS; ótimo para engajamento | Médio | M |
| 10 | **Perfil do driver NVIDIA** (NVAPI): modo de energia "máximo desempenho" e filtragem de texturas para o cs2.exe | Ajuste no driver, sem tocar no jogo. Ganho real em placas NVIDIA | Médio | M |
| 11 | **Teste do mouse** (taxa de polling medida dentro da janela do CSBoost) e aviso de mouse em 125 Hz | Fácil, visual e útil | Médio | P |
| 12 | **Rotina de manutenção** (o "Boost-Ups" do Hone): lembrete mensal para rodar Raio-X + limpeza e reaplicar o que o Windows desfez após updates | O Windows desfaz ajustes em atualizações grandes; nossa conferência já detecta isso | Médio | P |
| 13 | **Rede (versão grátis)**: ping, jitter e perda até os relays da Valve na América do Sul (validar se respondem a ping), teste de bufferbloat, aviso de Wi-Fi e de downloads em segundo plano, ajustes reversíveis da placa de rede | Muita gente fala de "ms". Diagnostica e tira o que atrapalha do lado do PC; nunca promete "menos ping" | Médio | M |
| 14 | ✅ **Inglês e espanhol** (feito na v0.4: app, instalador e LP) | Grupos LATAM de CS são enormes | Médio | P |
| 21 | **Central de ajuda** em `jafetramirez.com.br/csboost/ajuda` (e `/es/ayuda`, `/en/help`): documentação de cada tela, FAQ, "como resolver" (erro 5 / acesso negado, aviso do SmartScreen e antivírus, CS2 na placa integrada, ajuste que o Windows desfez, como desinstalar e desfazer tudo) | Tira dúvida antes de virar mensagem e ajuda no orgânico (cada problema vira uma página que o Google encontra) | Alto | M |
| 22 | **Abrir chamado**: formulário na central de ajuda (nome, contato, versão, Windows, o que aconteceu, print opcional) e botão **"Copiar diagnóstico"** no app (versão, build do Windows, placas de vídeo, últimos erros) para colar no chamado | Hoje o suporte é comentário no Facebook. Custo zero: reaproveita a API do site (`api/lead.js` já grava no Google Sheets e manda e-mail). ⚠️ Botão de WhatsApp só com número separado do pessoal (WhatsApp Business ou chip de suporte), porque número público em grupo de jogo atrai spam. Bugs técnicos também podem ir para as Issues do GitHub | Alto | P |

### Depois (v1.0+)

| # | Melhoria | Observação |
|---|---|---|
| 15 | **Outros jogos** (Valorant, Fortnite, PUBG, FiveM…) | ⚠️ Só os ajustes do **Windows** valem para todos. Mexer em config de jogo com anti-cheat de kernel (Vanguard, BattlEye, EAC) só depois de checar a política de cada um. Começar listando "o CSBoost funciona com qualquer jogo no nível do Windows" |
| 16 | **Recordes de FPS por hardware** (opt-in, anônimo): "Ryzen 5 4500 + GTX 1050 Ti: média de +X% no 1% low em N medições" | Prova coletiva; precisa de backend e LGPD. 💰 Só se couber em plano gratuito de hospedagem; senão, vai para a lista de patrocínio |
| 17 | **Guias de BIOS** por fabricante (XMP/EXPO, Resizable BAR) com prints | O Hone cobra por "BIOS tweaks"; aqui vira guia grátis |
| 18 | **Distribuição na Microsoft Store / Epic** | Confiança e alcance; exige assinatura e empacotamento |
| 19 | **Comunidade no Discord** com canal de suporte e de resultados | Os comentários já pedem um lugar para conversar |
| 20 | **Overlay de FPS** | ⚠️ Só como **janela externa** sempre visível, nunca desenhado dentro do jogo. Avaliar se vale; o próprio CS2 já tem telemetria de FPS |

### Só com patrocínio 💰

Ideias boas que hoje geram custo para o usuário ou custo alto para manter. Ficam paradas até existir patrocínio que pague por elas (ver "Produto 100% gratuito" no `CLAUDE.md`).

| Ideia | Por que está aqui |
|---|---|
| **Otimização de rota** (tipo ExitLag / NoPing): desviar o tráfego do jogo por uma rede própria de servidores | Exige rede de servidores no mundo todo (custo mensal alto) e driver de rede (certificado mais caro, mais alerta de antivírus). No CS2 o ganho é menor porque o jogo já usa a rede de relays da Valve (SDR); testar antes de prometer. Se um dia entrar, revisar contra a Regra nº 1 |
| **Indicação paga de serviços de rota** (link de afiliado no diagnóstico de rede) | Leva o usuário a pagar por algo; conflita com o produto 100% gratuito |

---

## 4. Cuidados para não quebrar a Regra nº 1

- **Modo Sessão (#7):** o CSBoost **não pode abrir o processo do CS2** (o VAC guard bloqueia `OpenProcess`). Para "pausar" coisas, usar caminhos do próprio Windows: parar **serviços** pelo gerenciador de serviços, pausar o Windows Update/Delivery Optimization por política, e prioridade do jogo via registro (`PerfOptions` do cs2.exe), que o Windows aplica sozinho. Encerrar outros programas (Discord etc.) também exigiria abrir processos: fica de fora, ou só pedindo ao próprio app para fechar (mensagem de janela), validando antes.
- **Detectar GPU em uso (#2):** ler os **contadores de desempenho do Windows** (o mesmo que o Gerenciador de Tarefas mostra), nunca o processo do jogo.
- **Benchmark (#1):** PresentMon lê eventos do Windows (ETW) e é usado por FrameView, CapFrameX e OCCT. Mesmo assim: testar em conta secundária antes de liberar e documentar.
- **Perfil NVIDIA (#10):** só configurações que o Painel de Controle da NVIDIA já oferece. Nada de recurso de driver que "entra" no jogo sem confirmação de compatibilidade com o VAC (lembrar do AMD Anti-Lag+ em 2023).
- **Outros jogos (#15):** anti-cheats diferentes, regras diferentes. Nenhum módulo por jogo sem pesquisar a política antes.

---

## 5. Próximos passos sugeridos

1. **v0.3.0** = Benchmark (#1) + GPU em uso (#2) + desinstalador com reversão (#3). Serve também para testar a atualização automática.
2. Abrir o código (#4) e pedir ao Gustavo autorização para usar o depoimento dele.
3. Pedir a assinatura gratuita na SignPath Foundation (#5).

## Fontes
- Hone — Premium: https://hone.gg/premium · CS2: https://hone.gg/pt/jogo/counter-strike-2 · Overwolf: https://overwolf.com/app/auraside_inc-hone
- Reviews do Hone no Trustpilot: https://www.trustpilot.com/review/hone.gg?page=10
- Comparativo de otimizadores (esports.gg): https://esports.gg/guides/gaming/best-pc-gaming-optimizers-2025/
- Comentários do post de lançamento no grupo de CS2 (Facebook), 08/10/2026
