"""Página da central de ajuda (/ajuda/, /es/ayuda/, /en/help/). Chamado pelo build.py."""
import html as _html
import json
import re

CSS = """
:root{--a:#F9AB19;--a2:#FFC04A;--navy:#28397F;--base:#11142A;--painel:#181C36;--elev:#212647;--txt:#F2F3F8;
--suave:rgba(226,229,242,.72);--borda:rgba(255,255,255,.10);--borda2:rgba(255,255,255,.20);--raio:16px;
--f:'Barlow',-apple-system,'Segoe UI',system-ui,sans-serif;--ft:'Barlow Semi Condensed','Barlow','Arial Narrow',sans-serif;
--gut:clamp(16px,5vw,40px)}
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:88px}
body{margin:0;background:var(--base);color:var(--txt);font-family:var(--f);font-size:clamp(1rem,1.1vw,1.06rem);line-height:1.65;-webkit-font-smoothing:antialiased;overflow-x:clip}
a{color:var(--a)}a:hover{color:var(--a2)}
:focus-visible{outline:2px solid var(--a);outline-offset:3px;border-radius:6px}
code{font-family:Consolas,Menlo,monospace;font-size:.9em;background:rgba(255,255,255,.08);padding:1px 6px;border-radius:6px}
.wrap{max-width:1080px;margin:0 auto;padding:0 var(--gut)}
header{position:sticky;top:0;z-index:20;background:rgba(17,20,42,.86);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 1px 0 var(--borda)}
.hd{display:flex;align-items:center;gap:20px;min-height:68px}
.logo{display:block;color:#fff;flex:none}
.hd nav.idi{margin-left:auto;display:flex;gap:2px;padding:3px;border-radius:999px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px var(--borda)}
.idi a{min-width:34px;height:30px;display:grid;place-items:center;padding:0 8px;border-radius:999px;font-size:.78rem;font-weight:700;letter-spacing:.06em;color:var(--suave);text-decoration:none}
.idi a[aria-current]{background:var(--a);color:#1C1C1C}
.bt{display:inline-flex;align-items:center;justify-content:center;gap:.5em;min-height:44px;padding:0 18px;border-radius:10px;font-weight:700;background:var(--a);color:#1C1C1C;text-decoration:none;border:0;font:inherit;font-weight:700;cursor:pointer}
.bt:hover{background:var(--a2);color:#1C1C1C}
.bt[disabled]{opacity:.6;cursor:wait}
.bt--f{background:transparent;color:var(--txt);box-shadow:inset 0 0 0 1px var(--borda2)}
.bt--f:hover{background:rgba(255,255,255,.06);color:#fff}
.hero{padding-top:clamp(48px,7vw,88px);padding-bottom:clamp(28px,4vw,44px)}
.kick{display:inline-block;font-size:.8rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--a)}
h1,h2,h3{font-family:var(--ft);line-height:1.08;margin:0}
h1{font-size:clamp(2.3rem,5vw,3.8rem);font-weight:800;margin-top:10px}
h1 em,h2 em{font-style:italic;color:var(--a)}
.lead{color:var(--suave);max-width:62ch;margin:16px 0 0}
.toc{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px;padding:0;list-style:none}
.toc a{display:inline-block;padding:8px 14px;border-radius:999px;background:var(--painel);box-shadow:inset 0 0 0 1px var(--borda);color:var(--txt);text-decoration:none;font-weight:600;font-size:.95rem}
.toc a:hover{box-shadow:inset 0 0 0 1px var(--a)}
section{padding:clamp(36px,5vw,64px) 0;border-top:1px solid var(--borda)}
.sh{display:flex;align-items:end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:24px}
h2{font-size:clamp(1.8rem,3.4vw,2.6rem);font-weight:800}
.passos{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));counter-reset:p;padding:0;margin:0;list-style:none}
.passos li{background:var(--painel);border:1px solid var(--borda);border-radius:var(--raio);padding:22px;counter-increment:p}
.passos h3{font-size:1.25rem;font-weight:700;display:flex;gap:10px;align-items:baseline}
.passos h3::before{content:counter(p,decimal-leading-zero);color:var(--a);font-size:.95rem}
.passos p{margin:10px 0 0;color:var(--suave)}
.faq{display:grid;gap:10px}
details{background:var(--painel);border:1px solid var(--borda);border-radius:var(--raio);overflow:hidden}
details[open]{border-color:var(--borda2)}
summary{list-style:none;cursor:pointer;padding:18px 54px 18px 22px;font-weight:700;font-size:1.06rem;position:relative}
summary::-webkit-details-marker{display:none}
summary::after{content:'+';position:absolute;right:22px;top:50%;transform:translateY(-50%);font-size:1.5rem;color:var(--a);line-height:1}
details[open] summary::after{content:'–'}
.res{padding:0 22px 20px;color:var(--suave)}
.res p,.res ul,.res ol{margin:0 0 12px}.res>*:last-child{margin-bottom:0}
.res ul,.res ol{padding-left:1.25em}.res li{margin:4px 0}
.res strong{color:var(--txt)}
details:target{border-color:var(--a)}
.telas{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))}
.tela{background:var(--painel);border:1px solid var(--borda);border-radius:var(--raio);padding:22px}
.tela h3{font-size:1.2rem;font-weight:700;color:#fff}
.tela p{margin:8px 0 0;color:var(--suave)}.tela strong{color:var(--txt)}
form{display:grid;gap:18px;background:var(--painel);border:1px solid var(--borda);border-radius:var(--raio);padding:clamp(20px,3vw,32px);margin-top:22px}
.lin{display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))}
label{display:grid;gap:6px;font-weight:600;font-size:.95rem}
input,select,textarea{width:100%;font:inherit;font-weight:400;color:var(--txt);background:var(--base);border:1px solid var(--borda2);border-radius:10px;padding:11px 13px}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--a);box-shadow:0 0 0 3px rgba(249,171,25,.2)}
textarea{min-height:130px;resize:vertical}
textarea#diagnostico{min-height:150px;font-family:Consolas,Menlo,monospace;font-size:.85rem}
.dica{font-weight:400;font-size:.85rem;color:var(--suave)}
.ok{display:flex;gap:10px;align-items:flex-start;font-weight:400;font-size:.92rem;color:var(--suave)}
.ok input{width:20px;height:20px;flex:none;margin-top:3px;accent-color:var(--a)}
.pote{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.msg{margin:0;padding:12px 14px;border-radius:10px;font-weight:600}
.msg.bom{background:rgba(58,200,120,.14);color:#9ff0c0}.msg.ruim{background:rgba(240,80,80,.14);color:#ffb3b3}
footer{border-top:1px solid var(--borda);padding:28px 0 40px;color:var(--suave);font-size:.85rem}
@media (max-width:640px){.hd .bt{display:none}.hd{gap:12px}}
"""

JS = """
(function(){
  var f=document.getElementById('form-chamado');if(!f)return;
  var T=__T__;var t0=Date.now();var out=document.getElementById('chamado-msg');var b=f.querySelector('button[type=submit]');
  function show(cls,txt){out.className='msg '+cls;out.textContent=txt;out.hidden=false;out.focus&&out.focus();}
  f.addEventListener('submit',function(e){
    e.preventDefault();out.hidden=true;
    var d=new FormData(f);
    var body={nome:d.get('nome'),email:d.get('email'),tipo:d.get('tipo'),mensagem:d.get('mensagem'),diagnostico:d.get('diagnostico'),
      consent:!!d.get('consent'),site:d.get('site'),t:t0,lang:T.lang};
    if(!body.nome||!body.email||String(body.mensagem||'').trim().length<10||!body.consent){show('ruim',T.invalid);return;}
    b.disabled=true;var lbl=b.textContent;b.textContent=T.sending;
    fetch('/api/chamado',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
      .then(function(r){return r.json().then(function(j){return {s:r.status,j:j};});})
      .then(function(x){
        if(x.j&&x.j.ok){f.reset();show('bom',T.ok+(x.j.id||'')+'. '+T.ok2);
          try{window.gtag&&gtag('event','chamado_enviado',{tipo:body.tipo});}catch(_){}}
        else show('ruim',x.s===400?T.invalid:x.s===429?T.limit:T.err);
      })
      .catch(function(){show('ruim',T.err);})
      .then(function(){b.disabled=false;b.textContent=lbl;});
  });
  if(location.hash==='#chamado'){var ta=document.getElementById('diagnostico');setTimeout(function(){ta&&ta.focus({preventScroll:true});},400);}
  var all=document.getElementById('abrir-todas');
  if(all)all.addEventListener('click',function(){var ds=document.querySelectorAll('.faq details');var abrir=[].some.call(ds,function(x){return !x.open;});
    ds.forEach(function(x){x.open=abrir;});});
  if(location.hash){var el=document.getElementById(location.hash.slice(1));if(el&&el.tagName==='DETAILS')el.open=true;}
})();
"""


def _plain(s):
    return _html.unescape(re.sub(r"<[^>]+>", " ", s)).replace("  ", " ").strip()


def render(lang, C, all_langs, simbolo, analytics, site):
    H = C[lang]
    u = H["ui"]
    fm = H["form"]
    url = f"{site}/{H['path']}"
    home = {"pt": "/", "es": "/es/", "en": "/en/"}[lang]
    alts = "\n".join(f'<link rel="alternate" hreflang="{C[l]["html_lang"]}" href="{site}/{C[l]["path"]}">' for l in all_langs)
    alts += f'\n<link rel="alternate" hreflang="x-default" href="{site}/{C["en"]["path"]}">'
    cur = ' aria-current="true"'
    idi = "".join(
        f'<a href="/{C[l]["path"]}" hreflang="{C[l]["html_lang"]}" lang="{C[l]["html_lang"]}"{cur if l == lang else ""}>{l.upper()}</a>'
        for l in all_langs)
    valve = {"pt": "Counter-Strike 2 e Steam são marcas da Valve Corporation. O CSBoost não é afiliado à Valve.",
             "es": "Counter-Strike 2 y Steam son marcas de Valve Corporation. CSBoost no está afiliado a Valve.",
             "en": "Counter-Strike 2 and Steam are trademarks of Valve Corporation. CSBoost is not affiliated with Valve."}[lang]
    faq_ld = {"@context": "https://schema.org", "@type": "FAQPage", "inLanguage": H["html_lang"],
              "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": _plain(a)}}
                             for _, q, a in H["fixes"]]}
    passos = "".join(f"<li><h3>{t}</h3>{b}</li>" for t, b in H["start"])
    faq = "".join(f'<details id="{i}"><summary>{q}</summary><div class="res">{a}</div></details>' for i, q, a in H["fixes"])
    telas = "".join(f'<div class="tela"><h3>{n}</h3><p>{d}</p></div>' for n, d in H["screens"])
    tipos = "".join(f'<option value="{v}">{n}</option>' for v, n in fm["types"])
    js_t = json.dumps({"lang": lang, "invalid": fm["invalid"], "sending": fm["sending"], "ok": fm["ok"], "ok2": fm["ok2"],
                       "err": fm["err"], "limit": fm["limit"]}, ensure_ascii=False)
    return f"""<!DOCTYPE html>
<html lang="{H['html_lang']}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{H['title']}</title>
<meta name="description" content="{H['desc']}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="{url}">
{alts}
<link rel="icon" href="/img/favicon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="CSBoost">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{H['title']}">
<meta property="og:description" content="{H['desc']}">
<meta property="og:image" content="{site}/img/csboost-og{'' if lang == 'pt' else '-' + lang}.jpg">
<meta name="theme-color" content="#11142A">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Barlow+Semi+Condensed:ital,wght@0,700;0,800;1,800&display=swap" rel="stylesheet">
<script type="application/ld+json">{json.dumps(faq_ld, ensure_ascii=False)}</script>
<style>{CSS}</style>
{analytics}</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true">{simbolo}</svg>
<header><div class="wrap hd">
  <a class="logo" href="{home}" aria-label="CSBoost — {u['home']}"><svg viewBox="0 0 3631 513" width="160" height="23" role="img" aria-label="CSBoost"><use href="#csb-logo-simbolo"/></svg></a>
  <nav class="idi" aria-label="Idioma">{idi}</nav>
  <a class="bt" href="https://github.com/JafetRamirez/csboost-releases/releases/latest">{u['download']}</a>
</div></header>
<main>
<div class="wrap hero">
  <span class="kick">{u['kicker']}</span>
  <h1>{u['h1']}</h1>
  <p class="lead">{u['lead']}</p>
  <ul class="toc">
    <li><a href="#comecar">{u['s_start']}</a></li>
    <li><a href="#resolver">{u['s_fix']}</a></li>
    <li><a href="#telas">{u['s_screens']}</a></li>
    <li><a href="#chamado">{u['s_ticket']}</a></li>
  </ul>
</div>
<section id="comecar"><div class="wrap">
  <div class="sh"><h2>{u['s_start']}</h2></div>
  <ol class="passos">{passos}</ol>
</div></section>
<section id="resolver"><div class="wrap">
  <div class="sh"><h2>{u['s_fix']}</h2><button class="bt bt--f" id="abrir-todas" type="button">{u['open_all']}</button></div>
  <div class="faq">{faq}</div>
</div></section>
<section id="telas"><div class="wrap">
  <div class="sh"><h2>{u['s_screens']}</h2></div>
  <div class="telas">{telas}</div>
</div></section>
<section id="chamado"><div class="wrap">
  <div class="sh"><h2>{u['s_ticket']}</h2></div>
  <p class="lead">{fm['lead']}</p>
  <form id="form-chamado" novalidate>
    <div class="lin">
      <label>{fm['name']}<input name="nome" autocomplete="nickname" maxlength="80" required></label>
      <label>{fm['email']}<input name="email" type="email" autocomplete="email" maxlength="160" required></label>
      <label>{fm['type']}<select name="tipo">{tipos}</select></label>
    </div>
    <label>{fm['msg']}<textarea name="mensagem" maxlength="4000" placeholder="{fm['msg_ph']}" required></textarea></label>
    <label>{fm['diag']}<textarea id="diagnostico" name="diagnostico" maxlength="6000" placeholder="{fm['diag_ph']}"></textarea><span class="dica">{fm['diag_hint']}</span></label>
    <label class="pote" aria-hidden="true">Site<input name="site" tabindex="-1" autocomplete="off"></label>
    <label class="ok"><input type="checkbox" name="consent" value="1" required><span>{fm['consent']}</span></label>
    <p id="chamado-msg" class="msg" role="status" tabindex="-1" hidden></p>
    <div><button class="bt" type="submit">{fm['send']}</button></div>
  </form>
</div></section>
</main>
<footer><div class="wrap">
  <p><a href="{home}">{u['home']}</a> · <a href="https://github.com/JafetRamirez/csboost-releases" target="_blank" rel="noopener">GitHub</a></p>
  <p>© 2026 Jafet Ramirez · {valve}</p>
</div></footer>
<script>{JS.replace('__T__', js_t)}</script>
</body>
</html>
"""
