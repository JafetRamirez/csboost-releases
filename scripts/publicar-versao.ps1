# Gera uma versão nova do CSBoost pronta para publicar.
# Antes: aumente "version" em src-tauri/tauri.conf.json, package.json e src-tauri/Cargo.toml.
# Uso (PowerShell, na pasta do projeto):  .\scripts\publicar-versao.ps1 "O que mudou nesta versão"
param([string]$Notas = "")

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz

# Chave que assina as atualizações (NUNCA publique a pasta keys/)
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content "$raiz\keys\csboost-updater.key" -Raw
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = (Get-Content "$raiz\keys\senha.txt" -Raw).Trim()

npm run tauri build -- --bundles nsis
node scripts/make-latest-json.mjs "$raiz\src-tauri\target\release\bundle\nsis" $Notas

Write-Host ""
Write-Host "Pronto. Na pasta release/ estão o instalador, o .sig e o latest.json."
Write-Host "Publique os três numa Release nova (tag vX.Y.Z) em github.com/JafetRamirez/csboost-releases."
