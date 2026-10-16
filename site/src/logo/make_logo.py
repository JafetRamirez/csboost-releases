"""Gera o logo do CSBoost com o nome em Orbitron Black (OFL) e o símbolo original."""
import runpy, pathlib
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

AQUI = pathlib.Path(__file__).parent
FONTE = "/tmp/claude-0/fonttest/node_modules/@fontsource/orbitron/files/orbitron-latin-900-normal.woff2"
L = runpy.run_path(str(AQUI.parent / "logo_paths.py"))
P = L["P"]

f = TTFont(FONTE); gs = f.getGlyphSet(); cmap = f.getBestCmap()
cap = f["OS/2"].sCapHeight or 720
TEXTO = "CSBOOST"
ALTURA = 312          # altura das maiúsculas no logo original (unidades do viewBox 513)
TOPO = 100            # topo das letras no original
X0 = 628              # início do nome no original
LARG_ALVO = 3166      # largura do nome no original
TRACK = 0.06          # espaçamento extra entre letras, em fração da altura

def montar(estica):
    k = ALTURA / cap
    x = 0.0; partes = []; minx = None; maxx = None
    for ch in TEXTO:
        gname = cmap[ord(ch)]; g = gs[gname]
        bp = BoundsPen(gs); g.draw(bp); b = bp.bounds
        partes.append((gname, x))
        gx0 = x + b[0] * k * estica; gx1 = x + b[2] * k * estica
        minx = gx0 if minx is None else min(minx, gx0); maxx = gx1 if maxx is None else max(maxx, gx1)
        x += g.width * k * estica + TRACK * ALTURA
    return partes, minx, maxx, k

partes, mn, mx, k = montar(1.0)
estica = min(LARG_ALVO / (mx - mn), 1.18)
partes, mn, mx, k = montar(estica)
desloc = X0 - mn
d = []
for gname, x in partes:
    sp = SVGPathPen(gs)
    # y da fonte cresce para cima; no SVG cresce para baixo
    tp = TransformPen(sp, (k * estica, 0, 0, -k, x + desloc, TOPO + ALTURA))
    gs[gname].draw(tp); d.append(sp.getCommands())
nome = " ".join(d)
W = round(X0 + (mx - mn)) + 2; H = 513
print(f"estica={estica:.3f} largura={mx-mn:.0f} viewBox={W}x{H}")

def svg(cor_nome, fundo=None):
    bg = f'<rect width="{W}" height="{H}" fill="{fundo}"/>' if fundo else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">{bg}'
            f'<path fill="#28397F" fill-rule="evenodd" d="{P["base"]}"/>'
            f'<path fill="#F9AB19" fill-rule="evenodd" d="{P["amber"]}"/>'
            f'<path fill="#FFFFFF" fill-rule="evenodd" d="{P["bolt"]}"/>'
            f'<path fill="{cor_nome}" d="{nome}"/></svg>')

(AQUI / "csboost-logo-light.svg").write_text(svg("#F2F2F2"))   # nome claro, para fundo escuro
(AQUI / "csboost-logo-dark.svg").write_text(svg("#1C1C1C"))    # nome escuro, para fundo claro
(AQUI / "wordmark.json").write_text(__import__("json").dumps({"W": W, "H": H, "d": nome}))
