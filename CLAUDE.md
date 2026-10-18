# CSBoost — regras do projeto

## REGRA Nº 1 (prioritária, acima de qualquer outra): nunca causar VAC ban

Nenhum recurso, ajuste ou atalho vale o risco de um usuário levar VAC ban.
Na dúvida, o recurso NÃO entra.

O CSBoost só pode mexer em:
- configurações do **Windows** (registro, plano de energia, monitor, ponto de restauração);
- arquivos de **configuração do usuário** do CS2 (`game/csgo/cfg/*.cfg`, opções de inicialização, e as opções de vídeo em `Steam/userdata/<conta>/730/local/cfg/cs2_video.txt` — ver "Presets de vídeo").

O CSBoost **nunca**:
- abre handle, lê ou escreve memória, injeta DLL/thread ou faz hook no `cs2.exe` (nem em nenhum outro processo);
- desenha overlay dentro do jogo;
- altera binários, VPKs ou qualquer arquivo do jogo que não seja `.cfg` do usuário;
- sugere ou grava `-allow_third_party_software` (desliga o Trusted Mode);
- liga recursos de driver que atuam dentro do processo do jogo sem confirmação pública de compatibilidade com o VAC (lembrar do AMD Anti-Lag+ em 2023).

### Como isso é garantido no código
`src-tauri/build.rs` tem o **VAC guard**: a compilação falha se aparecer
`OpenProcess`, `ReadProcessMemory`, `WriteProcessMemory`, `CreateRemoteThread`,
`SetWindowsHookEx` e afins no Rust, crates de injeção no `Cargo.toml`,
launch options com `-allow_third_party_software` na interface, ou tipo de ação
não aprovado no catálogo. Não remova itens da lista; se um recurso "precisa"
de uma dessas APIs, o recurso está errado.

### Para recursos futuros
- **Modo Sessão (v0.6, versão 1):** um vigia a cada 5 s olha a lista de processos do Windows (sem abrir o cs2.exe); com o jogo aberto, ativa o plano de energia de desempenho e, ao fechar o jogo (ou o app), volta o plano de antes se o usuário não trocou no meio. Também só lista apps conhecidos que pesam em segundo plano (não fecha nada). Prioridade de processo do jogo continua fora: `PerfOptions` no registro (IFEO) é chave que antivírus vigia; só entra depois de validar.
- **Benchmark (implementado na 0.3):** o CSBoost só inicia o PresentMon oficial da Intel (embutido, sem modificação) como processo filho. O PresentMon lê eventos ETW do Windows; o CSBoost não abre o processo do jogo. É a mesma base do NVIDIA FrameView e do CapFrameX.
- **Placa de vídeo em uso pelo CS2 (v0.4):** o CSBoost lê os contadores de desempenho do Windows (PDH, `\GPU Engine(*)\Utilization Percentage`, os mesmos do Gerenciador de Tarefas) e a lista de placas pelo DXGI (`CreateDXGIFactory1`, só enumera adaptadores). O PID do cs2.exe vem da lista de processos do Windows (`CreateToolhelp32Snapshot` com `TH32CS_SNAPPROCESS`), sem abrir o processo. Nenhuma API do VAC guard é usada.
- **Teste de rede (v0.4):** só mede. Baixa a lista pública de relays da Valve (`GetSDRConfig`, appid 730) pelo WinHTTP do Windows e manda ping ICMP (`IcmpSendEcho`); a placa de rede vem de `GetBestInterface`/`GetIfEntry2`. Não mexe em rota, firewall nem no jogo, não usa servidor próprio e só roda quando o usuário clica.
- **Manutenção (v0.4):** ao abrir, o app relê os ajustes aplicados; se o Windows desfez algum, oferece reaplicar. Reaplicar grava de novo o valor do CSBoost e mantém o "anterior" original no journal.
- **Presets de vídeo (v0.6):** o CSBoost edita `Steam\userdata\<conta>\730\local\cfg\cs2_video.txt`, o arquivo onde o próprio CS2 grava o menu Vídeo. Regras: só com o cs2.exe fechado (o jogo regrava o arquivo ao sair); só troca o valor de chaves que já existem (nunca cria chave nova nem mexe em outra linha); o conteúdo anterior vai para o Histórico e dá para desfazer. Não é arquivo do jogo nem binário: é a mesma coisa que mudar o vídeo no menu.
- **Perfil NVIDIA (v0.6):** pela NVAPI oficial (DRS, headers públicos em github.com/NVIDIA/nvapi), a `nvapi64.dll` é carregada só no processo do CSBoost e grava no perfil do cs2.exe do driver — o mesmo banco do Painel de Controle da NVIDIA. Só dois ajustes de driver que não atuam dentro do jogo: "Modo de gerenciamento de energia = Preferir desempenho máximo" e "Filtragem de textura - qualidade = Alto desempenho". Ficam de fora Low Latency/Ultra, injeção de FPS limiter, sharpening e qualquer coisa que o driver faça dentro do processo do jogo. Valor anterior no Histórico (`None` = volta ao padrão do driver).
- **Overlay de FPS:** se existir um dia, só como janela externa — nunca dentro do jogo.
- Qualquer recurso novo que interaja com o jogo precisa de justificativa escrita aqui antes de ser implementado.

## Produto 100% gratuito (decisão do Jafet)
O CSBoost é e continua 100% gratuito, sem anúncio e sem versão paga. Isso define o produto:
- Nada que gere custo para o usuário final (assinatura, compra, serviço pago indicado pelo app).
- Nada que gere custo alto para manter, principalmente no início (servidores, rede própria, APIs pagas).
- Ideias que dependem disso vão para a seção "Só com patrocínio" do `docs/ROADMAP.md` e só voltam com patrocínio.
- O único apoio aceito é o "Me paga um café" (voluntário).

## Configs de pros (`catalog/pros.json`)
- Só exibição e cópia. O app nunca grava a config de um pro no jogo sozinho.
- Cada jogador tem fonte e data de conferência. Nunca preencher valor de memória: se não achou numa fonte aberta, fica `null`.
- `launch_options` nunca contém `-allow_third_party_software` (o VAC guard bloqueia o build).

## Outras regras
- Todo ajuste precisa de `detect` + `apply` + `revert` e grava o valor anterior no journal.
- Nada de PowerShell/CMD executado pelo app.
- Interface em três idiomas: português (pt-BR, a fonte), espanhol e inglês. Texto novo na interface vai em `src/i18n/pt.ts`, `es.ts` e `en.ts` (o TypeScript não compila se faltar chave); texto gerado no núcleo usa `tr!("pt", "es", "en")`; tweak novo no catálogo leva o bloco `i18n` com `es` e `en`. O espanhol é revisado pelo Jafet.
- Cores do logo (ver README).
