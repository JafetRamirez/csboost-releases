# Componentes de terceiros

O CSBoost é distribuído sob a **GPL-3.0-or-later** (ver `LICENSE`). Ele inclui ou usa os
componentes abaixo, cada um com a própria licença. Todas são compatíveis com a GPL-3.0.

## Incluídos no instalador

| Componente | Uso | Licença | Origem |
|---|---|---|---|
| **PresentMon 2.x** (Intel) | Benchmark: lê os eventos de quadros do Windows (ETW). Distribuído sem modificação. | MIT — `src-tauri/resources/presentmon/LICENSE.txt` | https://github.com/GameTechDev/PresentMon |
| **Orbitron** (Matt McInerney) | Fonte dos títulos e do logo | SIL Open Font License 1.1 | https://fonts.google.com/specimen/Orbitron |
| **Barlow** e **Barlow Semi Condensed** (Jeremy Tribby) | Fonte do texto e da interface | SIL Open Font License 1.1 | https://fonts.google.com/specimen/Barlow |
| **Tauri 2** e plugins (updater, process, opener) | Base do app | MIT ou Apache-2.0 | https://tauri.app |
| **React 19** | Interface | MIT | https://react.dev |

## Bibliotecas

As dependências de Rust (`src-tauri/Cargo.lock`) e de JavaScript (`package-lock.json`) usam
licenças permissivas compatíveis com a GPL-3.0: MIT, Apache-2.0, BSD, ISC, Zlib, Unicode-3.0,
MPL-2.0, Unlicense, CC0 e CDLA-Permissive-2.0. A lista completa sai de
`cargo metadata` e de `npm ls --all`.

## Marcas

Counter-Strike, Counter-Strike 2 e Steam são marcas da Valve Corporation. O CSBoost é um
projeto independente, sem afiliação nem endosso da Valve. O símbolo e o logo do CSBoost são
arte original de Jafet Ramirez.
