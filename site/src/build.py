"""Monta o site do CSBoost (csboost.com.br) em três idiomas a partir do tpl.html.

    python3 site/src/build.py      -> gera site/public/ (index, es/, en/, img/, sitemap.xml, robots.txt)

Edite o tpl.html (copy em português) e o lp_i18n.py (espanhol e inglês); nunca
o que está em public/, que é gerado. Prévia local: sirva site/public na raiz
(ex.: `python3 -m http.server -d site/public 8080`).
"""
import datetime
import json
import pathlib
import re
import runpy
import shutil
import sys

AQUI = pathlib.Path(__file__).parent
SAIDA = AQUI.parent / "public"
L = runpy.run_path(str(AQUI / "logo_paths.py"))
W, H, P = L["W"], L["H"], dict(L["P"])
# Nome em Orbitron Black (logo de out/2026): troca o traço do nome e a largura.
_wm = json.loads((AQUI / "logo" / "wordmark.json").read_text())
W, P["word"] = _wm["W"], _wm["d"]
I18N = runpy.run_path(str(AQUI / "lp_i18n.py"))
HELP = runpy.run_path(str(AQUI / "help_content.py"))["HELP"]
HELP_PAGE = runpy.run_path(str(AQUI / "help_page.py"))

SITE = "https://csboost.com.br"
LANGS = ["pt", "es", "en"]
PATH = {"pt": "", "es": "es/", "en": "en/"}
HREFLANG = {"pt": "pt-BR", "es": "es", "en": "en"}
SCREENS = ["painel", "raiox", "otimizacoes", "historico", "bench", "pros"]

VERSAO_URL = "https://github.com/JafetRamirez/csboost-releases/releases/latest"
SHA = "fed4fd2aad7416ab2705e9aba3bece0b9056611b81f2a96fa40ebaaf3fcca7e7"
VT = f"https://www.virustotal.com/gui/file/{SHA}"
GA = "G-WYPCC7WB42"


def ic(d, extra=""):
    return ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"{extra}>{d}</svg>')


ICONES = {
    "ICON_WIN": ic('<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>'),
    "ICON_CHECK": ic('<path d="m5 12 5 5L20 7"/>'),
    "ICON_X": ic('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
    "ICON_CHECK_CIRC": ic('<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>'),
    "ICON_X_CIRC": ic('<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>'),
    "ICON_SHIELD": ic('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>'),
    "ICON_LOCK": ic('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
    "ICON_CODE": ic('<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>'),
    "ICON_CHART": ic('<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>'),
    "ICON_EYE": ic('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    "ICON_BROOM": ic('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/>'),
    "ICON_MOUSE": ic('<rect x="6" y="3" width="12" height="18" rx="6"/><path d="M12 7v4"/>'),
    "ICON_REFRESH": ic('<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'),
    "ICON_UNDO": ic('<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-4"/>'),
}

MARQUEE_PT = ["Raio-X do PC", "GPU dedicada no notebook", "Plano de energia", "Game DVR desligado",
              "Aceleração do mouse", "Benchmark com 1% low", "Configs de 30 pros", "Limpeza de cache",
              "Teste de polling", "Desfaz tudo"]

simbolo = (f'<symbol id="csb-logo-simbolo" viewBox="0 0 {W} {H}">'
           f'<path fill="#28397F" fill-rule="evenodd" d="{P["base"]}"/>'
           f'<path fill="#F9AB19" fill-rule="evenodd" d="{P["amber"]}"/>'
           f'<path fill="#FFFFFF" fill-rule="evenodd" d="{P["bolt"]}"/>'
           f'<path fill="currentColor" d="{P["word"]}"/></symbol>')


def url_of(lang):
    return f"{SITE}/{PATH[lang]}"


def lang_links(lang):
    out = []
    for l in LANGS:
        cur = ' aria-current="true"' if l == lang else ""
        out.append(f'<a href="/{PATH[l]}" hreflang="{HREFLANG[l]}" lang="{HREFLANG[l]}"{cur}>{l.upper()}</a>')
    return "".join(out)


def translate(html, lang):
    if lang == "pt":
        return html
    idx = 0 if lang == "es" else 1
    for raw in I18N["RAW"]:
        if raw[0] not in html:
            sys.exit(f"RAW não encontrado: {raw[0][:70]}")
        html = html.replace(raw[0], raw[1 + idx])
    faltou = []
    for pt in sorted(I18N["T"], key=len, reverse=True):
        alvo = I18N["T"][pt][idx]
        n_txt = len(re.findall(r">\s*" + re.escape(pt) + r"\s*<", html))
        n_attr = html.count(f'="{pt}"')
        if not n_txt and not n_attr:
            faltou.append(pt)
            continue
        html = re.sub(r"(>\s*)" + re.escape(pt) + r"(\s*<)", lambda m: m.group(1) + alvo + m.group(2), html)
        html = html.replace(f'="{pt}"', f'="{alvo}"')
    if faltou:
        sys.exit(f"[{lang}] textos sem correspondência no HTML: {faltou}")
    for name in SCREENS:
        html = html.replace(f"img/csboost-{name}.webp", f"img/csboost-{name}-{lang}.webp")
    html = html.replace("img/csboost-og.jpg", f"img/csboost-og-{lang}.jpg")
    return html


def page(lang):
    html = (AQUI / "tpl.html").read_text(encoding="utf-8")
    marquee = MARQUEE_PT if lang == "pt" else I18N["MARQUEE"][lang]
    html = html.replace("{{LOGO_SYMBOL}}", simbolo)
    html = html.replace("{{MARQUEE}}", "\n        ".join(f"<li>{m}</li>" for m in marquee))
    html = html.replace("{{DL}}", VERSAO_URL).replace("{{VT}}", VT).replace("{{SHA}}", SHA)
    html = html.replace("{{LANG_LINKS}}", lang_links(lang))
    for k, v in ICONES.items():
        html = html.replace("{{%s}}" % k, v)
    assert "{{" not in html, html[html.index("{{"):html.index("{{") + 40]
    html = translate(html, lang)

    # URLs por idioma (og:url, JSON-LD, canonical) e alternativas para o Google
    html = html.replace(f'content="{SITE}/"', f'content="{url_of(lang)}"')
    html = html.replace(f'"url": "{SITE}/"', f'"url": "{url_of(lang)}"')
    alts = "\n".join(f'<link rel="alternate" hreflang="{HREFLANG[l]}" href="{url_of(l)}">' for l in LANGS)
    alts += f'\n<link rel="alternate" hreflang="x-default" href="{url_of("en")}">'
    head = f'<link rel="canonical" href="{url_of(lang)}">\n{alts}\n<link rel="icon" href="/img/favicon.png">\n'

    # caminhos absolutos (a página fica em /, /es/ e /en/)
    html = html.replace('src="img/', 'src="/img/')
    html = re.sub(r'content="img/(csboost-og[^"]*)"', rf'content="{SITE}/img/\1"', html)
    html = html.replace("</head>", analytics(lang) + "</head>", 1)
    html = html.replace('<meta name="theme-color"', head + '<meta name="theme-color"', 1)
    assert "jafetramirez.com.br/csboost" not in html
    return html


def analytics(lang, grupo="csboost"):
    return (
        '<!-- analytics -->\n'
        f'<script async src="https://www.googletagmanager.com/gtag/js?id={GA}"></script>\n'
        "<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}"
        f"gtag('js',new Date());gtag('config','{GA}',{{content_group:'{grupo}',language:'{HREFLANG[lang]}'}});</script>\n"
        '<!-- Vercel Web Analytics e Speed Insights (só no site; o app não envia nada) -->\n'
        "<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};"
        "window.si=window.si||function(){(window.siq=window.siq||[]).push(arguments)};</script>\n"
        '<script defer src="/_vercel/insights/script.js"></script>\n'
        '<script defer src="/_vercel/speed-insights/script.js"></script>\n'
    )


def sitemap():
    hoje = datetime.date.today().isoformat()
    urls = []
    for l in LANGS:
        alts = "".join(f'\n    <xhtml:link rel="alternate" hreflang="{HREFLANG[o]}" href="{url_of(o)}"/>' for o in LANGS)
        alts += f'\n    <xhtml:link rel="alternate" hreflang="x-default" href="{url_of("en")}"/>'
        urls.append(f"  <url>\n    <loc>{url_of(l)}</loc>\n    <lastmod>{hoje}</lastmod>{alts}\n  </url>")
    for l in LANGS:
        alts = "".join(f'\n    <xhtml:link rel="alternate" hreflang="{HREFLANG[o]}" href="{SITE}/{HELP[o]['path']}"/>' for o in LANGS)
        urls.append(f"  <url>\n    <loc>{SITE}/{HELP[l]['path']}</loc>\n    <lastmod>{hoje}</lastmod>{alts}\n  </url>")
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
            + "\n".join(urls) + "\n</urlset>\n")


def main():
    if SAIDA.exists():
        shutil.rmtree(SAIDA)
    for lang in LANGS:
        d = SAIDA / PATH[lang]
        d.mkdir(parents=True, exist_ok=True)
        (d / "index.html").write_text(page(lang), encoding="utf-8")
        print("ok", lang)
    for lang in LANGS:
        d = SAIDA / HELP[lang]["path"]
        d.mkdir(parents=True, exist_ok=True)
        (d / "index.html").write_text(HELP_PAGE["render"](lang, HELP, LANGS, simbolo, analytics(lang, "csboost-ajuda"), SITE), encoding="utf-8")
        print("ok ajuda", lang)
    shutil.copytree(AQUI / "img", SAIDA / "img")
    (SAIDA / "sitemap.xml").write_text(sitemap(), encoding="utf-8")
    (SAIDA / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n", encoding="utf-8")
    print("gerado em", SAIDA)


main()
