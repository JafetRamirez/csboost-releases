// Gera release/latest.json (o arquivo que o app consulta para saber se há versão nova).
// Uso: node scripts/make-latest-json.mjs <pasta-do-bundle-nsis> "Notas da versão"
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const REPO = "JafetRamirez/csboost-releases";
const conf = JSON.parse(readFileSync(new URL("../src-tauri/tauri.conf.json", import.meta.url)));
const version = conf.version;
const bundleDir = process.argv[2];
const notes = process.argv[3] ?? `CSBoost ${version}`;

const exe = readdirSync(bundleDir).find((f) => f.endsWith(`${version}_x64-setup.exe`));
if (!exe) throw new Error(`Instalador da versão ${version} não encontrado em ${bundleDir}`);
const signature = readFileSync(join(bundleDir, `${exe}.sig`), "utf8").trim();

const out = new URL("../release/", import.meta.url);
mkdirSync(out, { recursive: true });
copyFileSync(join(bundleDir, exe), new URL(exe, out));
copyFileSync(join(bundleDir, `${exe}.sig`), new URL(`${exe}.sig`, out));
writeFileSync(
  new URL("latest.json", out),
  JSON.stringify(
    {
      version,
      notes,
      pub_date: new Date().toISOString(),
      platforms: {
        "windows-x86_64": {
          signature,
          url: `https://github.com/${REPO}/releases/download/v${version}/${exe}`,
        },
      },
    },
    null,
    2,
  ) + "\n",
);
console.log(`release/latest.json pronto para a versão ${version}`);
