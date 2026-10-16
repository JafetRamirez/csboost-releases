# Site do CSBoost — csboost.com.br

Página do app em português, espanhol e inglês (`/`, `/es/`, `/en/`).

- `src/tpl.html` — página (copy em português). `src/lp_i18n.py` — espanhol e inglês.
- `src/build.py` — gera `public/` (HTML dos três idiomas, `sitemap.xml`, `robots.txt`). Rode depois de editar:
  `python3 site/src/build.py`
- `public/` — o que vai ao ar. Não edite à mão.

Hospedagem: Vercel (projeto com Root Directory `site`, sem build). O deploy só roda quando algo em `site/` muda.
O endereço antigo `jafetramirez.com.br/csboost` redireciona para cá.

Vercel: projeto `csboost` (Root Directory `site`, Framework Preset `Other`).
