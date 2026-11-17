"""Páginas de guia (/ajuda/<slug>/ etc.) e o bloco de guias da central. Chamado pelo build.py."""
import json
import re

ART_CSS = """
.crumb{font-size:.9rem;color:var(--suave);margin:0 0 14px}.crumb a{color:var(--suave)}
article.guia{max-width:760px}
article.guia h2{font-size:clamp(1.45rem,2.6vw,1.9rem);font-weight:800;margin:38px 0 10px}
article.guia p,article.guia li{color:var(--suave)}
article.guia strong{color:var(--txt)}
article.guia ul,article.guia ol{padding-left:1.25em}article.guia li{margin:6px 0}
article.guia pre{background:var(--painel);border:1px solid var(--borda);border-radius:12px;padding:16px;overflow-x:auto}
article.guia pre code{background:none;padding:0;font-size:.9rem;color:var(--txt)}
article.guia code{word-break:break-word}
.cta{margin:44px 0 0;padding:24px;border-radius:var(--raio);background:linear-gradient(135deg,rgba(40,57,127,.55),rgba(249,171,25,.12));border:1px solid var(--borda2)}
.cta h2{margin:0 0 8px!important;font-size:1.5rem!important}
.cta p{margin:0 0 16px}
.rel{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));margin-top:14px}
.gcard{display:block;background:var(--painel);border:1px solid var(--borda);border-radius:var(--raio);padding:18px 20px;text-decoration:none;color:var(--txt)}
.gcard:hover{border-color:var(--a);color:var(--txt)}
.gcard strong{display:block;font-family:var(--ft);font-size:1.15rem;line-height:1.2}
.gcard span{display:block;margin-top:6px;color:var(--suave);font-size:.92rem}
.guias{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))}
"""


def guide_path(g, lang, help_c):
    return f"/{help_c[lang]['path']}{g['slug'][lang]}/"


def _links(html, lang, guides, help_c):
    by_id = {g["id"]: g for g in guides}

    def sub(m):
        g = by_id[m.group(1)]
        title = re.sub(r"<[^>]+>", "", g[lang]["h1"])
        return f'<a href="{guide_path(g, lang, help_c)}">{title}</a>'
    return re.sub(r"\{\{g:([a-z-]+)\}\}", sub, html)


def cards(lang, guides, help_c, ids=None):
    sel = guides if ids is None else [g for i in ids for g in guides if g["id"] == i]
    return "".join(
        f'<a class="gcard" href="{guide_path(g, lang, help_c)}"><strong>{re.sub(r"<[^>]+>", "", g[lang]["h1"])}</strong>'
        f'<span>{g[lang]["card"]}</span></a>' for g in sel)


def render(g, lang, guides, ui, help_c, all_langs, simbolo, analytics, site, css, hoje, dl):
    G, U, H = g[lang], ui[lang], help_c[lang]
    hu = H["ui"]
    url = f"{site}{guide_path(g, lang, help_c)}"
    home = {"pt": "/", "es": "/es/", "en": "/en/"}[lang]
    alts = "\n".join(f'<link rel="alternate" hreflang="{help_c[l]["html_lang"]}" href="{site}{guide_path(g, l, help_c)}">' for l in all_langs)
    alts += f'\n<link rel="alternate" hreflang="x-default" href="{site}{guide_path(g, "en", help_c)}">'
    cur = ' aria-current="true"'
    idi = "".join(
        f'<a href="{guide_path(g, l, help_c)}" hreflang="{help_c[l]["html_lang"]}" lang="{help_c[l]["html_lang"]}"{cur if l == lang else ""}>{l.upper()}</a>'
        for l in all_langs)
    valve = {"pt": "Counter-Strike 2 e Steam são marcas da Valve Corporation. O CSBoost não é afiliado à Valve.",
             "es": "Counter-Strike 2 y Steam son marcas de Valve Corporation. CSBoost no está afiliado a Valve.",
             "en": "Counter-Strike 2 and Steam are trademarks of Valve Corporation. CSBoost is not affiliated with Valve."}[lang]
    body = _links(G["body"], lang, guides, help_c)
    assert "{{" not in body, body[body.index("{{"):body.index("{{") + 30]
    h1_plain = re.sub(r"<[^>]+>", "", G["h1"])
    help_url = f"/{H['path']}"
    ld = [
        {"@context": "https://schema.org", "@type": "TechArticle", "headline": G["title"], "description": G["desc"],
         "inLanguage": H["html_lang"], "dateModified": hoje, "url": url, "image": f"{site}/img/csboost-og{'' if lang == 'pt' else '-' + lang}.jpg",
         "author": {"@type": "Person", "name": "Jafet Ramirez"},
         "publisher": {"@type": "Organization", "name": "CSBoost", "url": f"{site}/"}},
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "CSBoost", "item": f"{site}{home}"},
            {"@type": "ListItem", "position": 2, "name": U["help"], "item": f"{site}{help_url}"},
            {"@type": "ListItem", "position": 3, "name": h1_plain, "item": url}]},
    ]
    ld_html = "".join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in ld)
    return f"""<!DOCTYPE html>
<html lang="{H['html_lang']}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{G['title']}</title>
<meta name="description" content="{G['desc']}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="{url}">
{alts}
<link rel="icon" href="/img/favicon.png">
<meta property="og:type" content="article">
<meta property="og:site_name" content="CSBoost">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{G['title']}">
<meta property="og:description" content="{G['desc']}">
<meta property="og:image" content="{site}/img/csboost-og{'' if lang == 'pt' else '-' + lang}.jpg">
<meta name="theme-color" content="#11142A">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Barlow+Semi+Condensed:ital,wght@0,700;0,800;1,800&display=swap" rel="stylesheet">
{ld_html}
<style>{css}{ART_CSS}</style>
{analytics}</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true">{simbolo}</svg>
<header><div class="wrap hd">
  <a class="logo" href="{home}" aria-label="CSBoost - {hu['home']}"><svg viewBox="0 0 3631 513" width="160" height="23" role="img" aria-label="CSBoost"><use href="#csb-logo-simbolo"/></svg></a>
  <nav class="idi" aria-label="Idioma">{idi}</nav>
  <a class="bt" href="{dl}">{hu['download']}</a>
</div></header>
<main>
<div class="wrap hero">
  <p class="crumb"><a href="{home}">CSBoost</a> › <a href="{help_url}">{U['help']}</a> › <a href="{help_url}#guias">{U['guides']}</a></p>
  <h1>{G['h1']}</h1>
  <p class="lead">{G['lead']}</p>
</div>
<section><div class="wrap">
  <article class="guia">
{body}
    <div class="cta">
      <h2>{U['cta_t']}</h2>
      <p>{U['cta_d']}</p>
      <a class="bt" href="{dl}">{U['cta_b']}</a>
    </div>
    <p style="margin-top:22px"><a href="{help_url}#chamado">{U['ticket']}</a></p>
  </article>
</div></section>
<section><div class="wrap">
  <div class="sh"><h2>{U['related']}</h2></div>
  <div class="rel">{cards(lang, guides, help_c, g['related'])}</div>
</div></section>
</main>
<footer><div class="wrap">
  <p><a href="{home}">{hu['home']}</a> · <a href="{help_url}">{U['help']}</a> · <a href="https://github.com/JafetRamirez/csboost-releases" target="_blank" rel="noopener">GitHub</a></p>
  <p>© 2026 Jafet Ramirez · {valve}</p>
</div></footer>
</body>
</html>
"""
