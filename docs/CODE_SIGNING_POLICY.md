# Code signing policy

Free code signing provided by [SignPath.io](https://about.signpath.io), certificate by [SignPath Foundation](https://signpath.org).

> Status: pedido de assinatura gratuita para projeto de código aberto em análise pela SignPath Foundation.
> Até a aprovação, os instaladores do CSBoost são publicados **sem assinatura**, com o SHA256 nas notas de cada versão.

## O que é assinado

Somente o que é compilado a partir deste repositório, pelo workflow
[`Publicar versão`](../.github/workflows/release.yml) no GitHub Actions:

- `csboost.exe` (o app);
- `CSBoost_<versão>_x64-setup.exe` (o instalador NSIS).

O `PresentMon.exe` incluído no instalador é distribuído sem modificação e já vem assinado pela Intel.
Nenhum arquivo é assinado fora do GitHub Actions, e nenhum binário de terceiros é assinado com o certificado do projeto.

## Papéis

| Papel | Quem | Responsabilidade |
|---|---|---|
| Autor (committer) | [Jafet Ramirez](https://github.com/JafetRamirez) | Escreve e envia o código para o repositório |
| Revisor | [Jafet Ramirez](https://github.com/JafetRamirez) | Revisa toda contribuição de fora antes de entrar na `main` |
| Aprovador | [Jafet Ramirez](https://github.com/JafetRamirez) | Aprova manualmente cada pedido de assinatura na SignPath |

Todos os membros usam autenticação em dois fatores no GitHub e na SignPath.

## Privacidade

O CSBoost não coleta nem envia dados pessoais ou informações do computador. O diagnóstico, o histórico de ajustes e as medições de FPS ficam só no computador do usuário.

A única conexão automática é a consulta de novas versões no GitHub
(`https://github.com/JafetRamirez/csboost-releases/releases/latest/download/latest.json`), que não envia dados do usuário.
O **Teste de rede** (Ferramentas) só roda quando o usuário clica em Testar: baixa a lista pública de servidores da Steam (`https://api.steampowered.com/ISteamApps/GetSDRConfig/v1/?appid=730`) e envia pings (ICMP) para eles. Nenhum dado do usuário é enviado.
Os links do app (código-fonte, "Me paga um café", fontes das configs de pros) só abrem no navegador quando o usuário clica.

This program will not transfer any information to other networked systems unless specifically requested by the user or the person installing or operating it.

## Alterações no sistema

O CSBoost altera configurações do Windows (registro, plano de energia, taxa do monitor) e arquivos de configuração do usuário do CS2. Antes de qualquer alteração ele mostra o que vai mudar, cria um ponto de restauração quando o Windows permite e guarda o valor anterior de cada ajuste. Tudo pode ser desfeito pela tela Histórico, e o desinstalador oferece desfazer todos os ajustes.

O CSBoost não abre o processo de nenhum jogo, não lê nem escreve memória, não injeta código e não altera arquivos do jogo além dos `.cfg` do usuário (ver `CLAUDE.md`, Regra nº 1).
