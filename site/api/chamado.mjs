// Chamado de suporte do CSBoost (formulário da central de ajuda).
// Manda um e-mail para o Jafet pelo Resend e mais nada: não grava em banco,
// não manda e-mail para o endereço digitado (para o formulário não virar
// disparador de spam). Variáveis na Vercel:
//   RESEND_API_KEY      (obrigatória)
//   CHAMADO_TO          (opcional, padrão jafemisael@gmail.com)
//   CHAMADO_FROM        (opcional, precisa ser de um domínio verificado no Resend)

const TO = process.env.CHAMADO_TO || "jafemisael@gmail.com";
const FROM = process.env.CHAMADO_FROM || "CSBoost Suporte <hello@jafetramirez.com.br>";
const TIPOS = { bug: "Erro / bug", duvida: "Dúvida", sugestao: "Sugestão", outro: "Outro" };
const LIMITES = { nome: 80, email: 160, mensagem: 4000, diagnostico: 6000 };

// Limite simples por IP (memória da instância; zera quando a função esfria).
const vistos = new Map();
function muitoRapido(ip) {
  const agora = Date.now();
  const lista = (vistos.get(ip) || []).filter((t) => agora - t < 60 * 60 * 1000);
  lista.push(agora);
  vistos.set(ip, lista);
  return lista.length > 5;
}

function esc(s = "") {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function corpo(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try {
    return JSON.parse(req.body || "{}");
  } catch {
    return {};
  }
}

function linha(rotulo, valor, pre) {
  if (!valor) return "";
  const estilo = pre
    ? "white-space:pre-wrap;font-family:Consolas,Menlo,monospace;font-size:12.5px;background:#f6f7fb;border-radius:8px;padding:12px"
    : "white-space:pre-wrap";
  return `<tr><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.05em;width:26%;vertical-align:top">${esc(rotulo)}</td>
<td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;line-height:1.55"><div style="${estilo}">${esc(valor)}</div></td></tr>`;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  const b = corpo(req);
  // Robôs preenchem o campo escondido ou enviam rápido demais.
  if (b.site || (Number(b.t) && Date.now() - Number(b.t) < 3000)) {
    res.status(200).json({ ok: true });
    return;
  }

  const nome = String(b.nome || "").trim().slice(0, LIMITES.nome);
  const email = String(b.email || "").trim().slice(0, LIMITES.email);
  const tipo = TIPOS[b.tipo] ? b.tipo : "outro";
  const mensagem = String(b.mensagem || "").trim().slice(0, LIMITES.mensagem);
  const diagnostico = String(b.diagnostico || "").trim().slice(0, LIMITES.diagnostico);
  const idioma = ["pt", "es", "en"].includes(b.lang) ? b.lang : "pt";

  if (!nome || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || mensagem.length < 10 || b.consent !== true) {
    res.status(400).json({ ok: false, error: "invalid" });
    return;
  }

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "?";
  if (muitoRapido(ip)) {
    res.status(429).json({ ok: false, error: "rate_limited" });
    return;
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("[chamado] falta RESEND_API_KEY");
    res.status(500).json({ ok: false, error: "not_configured" });
    return;
  }

  const id = Math.random().toString(36).slice(2, 8).toUpperCase();
  const versao = (diagnostico.match(/^CSBoost\s+(\S+)/) || [])[1] || "";
  const assunto = `[CSBoost ${TIPOS[tipo]}] ${nome}${versao ? ` · v${versao}` : ""} · #${id}`;
  const html = `<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,sans-serif">
<div style="max-width:640px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
<div style="padding:22px 26px;background:#11142A;color:#fff">
<div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#F9AB19">Chamado #${esc(id)}</div>
<div style="font-size:21px;font-weight:600;margin-top:6px">${esc(TIPOS[tipo])} · ${esc(nome)}</div>
<div style="font-size:12px;opacity:.7;margin-top:4px">Idioma: ${esc(idioma)} · responda este e-mail para falar com a pessoa</div>
</div>
<table style="width:100%;border-collapse:collapse">
${linha("Nome", nome)}${linha("E-mail", email)}${linha("Tipo", TIPOS[tipo])}${linha("Mensagem", mensagem)}${linha("Diagnóstico", diagnostico, true)}
</table>
<div style="padding:14px 26px;color:#9ca3af;font-size:11px">Enviado pela central de ajuda em csboost.com.br. Não fica salvo em nenhum outro lugar.</div>
</div></body></html>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [TO], reply_to: email, subject: assunto, html }),
    });
    if (!r.ok) {
      console.error("[chamado] resend", r.status, (await r.text().catch(() => "")).slice(0, 200));
      res.status(502).json({ ok: false, error: "send_failed" });
      return;
    }
  } catch (e) {
    console.error("[chamado] resend", e && e.message);
    res.status(502).json({ ok: false, error: "send_failed" });
    return;
  }

  res.status(200).json({ ok: true, id });
};
