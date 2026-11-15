import { dbReady, pipeline, dayKey, V } from "./_db.js";

// Conta visitas e cliques (sem guardar IP). Eventos: view, whatsapp, reserva, particular, espera, trilhas
const EVENTS = new Set(["view", "whatsapp", "reserva", "particular", "espera", "trilhas", "video"]);
const TTL = 60 * 60 * 24 * 400;
const dec = (v) => { try { return decodeURIComponent(String(v || "")).slice(0, 60); } catch { return String(v || "").slice(0, 60); } };

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).end();
  if (!dbReady()) return res.status(204).end();
  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body || "{}");
    const ev = EVENTS.has(body?.e) ? body.e : null;
    const vid = String(body?.v || "").slice(0, 64);
    if (!ev || !vid) return res.status(400).end();
    const ua = String(req.headers["user-agent"] || "");
    if (!ua || /bot|crawl|spider|preview|facebookexternalhit|whatsapp|headless|lighthouse|screenshot|puppeteer|playwright|phantom|selenium|python|curl|wget|node-fetch|axios|go-http|vercel|slack|telegram|discord|skype|linkedin|pinterest|embedly|google-inspectiontool/i.test(ua)) return res.status(204).end();
    const day = dayKey();
    const k = (name) => `${V}${name}:${day}`;
    const cmds = [["HINCRBY", `${V}total`, ev, 1], ["HINCRBY", `${V}day:${day}`, ev, 1], ["EXPIRE", `${V}day:${day}`, TTL]];
    if (ev === "view") {
      cmds.push(["PFADD", `${V}uniq:${day}`, vid], ["EXPIRE", `${V}uniq:${day}`, TTL], ["PFADD", `${V}uniq:all`, vid]);
      const device = /Mobi|Android|iPhone/i.test(ua) ? "celular" : "computador";
      const ref = String(body?.r || "").replace(/^www\./, "").slice(0, 60);
      // visitas vindas do painel da Vercel, do GitHub ou do Claude são testes de quem faz o site: não contam
      if (/vercel\.com|github\.com|claude\.ai|anthropic|localhost/.test(ref)) return res.status(204).end();
      const src = !ref ? "direto" : /instagram|linktr/.test(ref) ? "instagram" : /facebook|fb\./.test(ref) ? "facebook" : /google/.test(ref) ? "google" : /whatsapp|wa\.me/.test(ref) ? "whatsapp" : /wikiloc|strava|alltrails/.test(ref) ? "apps de trilha" : ref.includes("vercel.app") || ref.includes("leopardo") ? null : ref;
      let city = dec(req.headers["x-vercel-ip-city"]), region = dec(req.headers["x-vercel-ip-country-region"]), country = dec(req.headers["x-vercel-ip-country"]);
      const tz = String(body?.tz || "").slice(0, 40);
      const tzBR = /^America\/(Sao_Paulo|Bahia|Fortaleza|Recife|Belem|Maceio|Araguaina|Manaus|Cuiaba|Campo_Grande|Porto_Velho|Boa_Vista|Rio_Branco|Santarem|Eirunepe|Noronha)$/.test(tz);
      if (country && country !== "BR") {
        // acesso de fora do Brasil: só conta se o aparelho estiver no fuso do Brasil (ex.: VPN, roaming)
        if (!tzBR) return res.status(204).end();
        country = "BR"; region = ""; city = "";
      }
      const add = (name, field) => { if (field) cmds.push(["HINCRBY", k(name), field, 1], ["EXPIRE", k(name), TTL]); };
      add("dev", device);
      if (src) add("src", src);
      if (country) add("pais", country);
      if (region && country) add("estado", `${region}|${country}`);
      if (city) add("cidade", `${city}|${region}|${country}`);
      cmds.push(["SADD", `${V}seen`, vid]);
    }
    if (ev === "trilhas" || ev === "reserva" || ev === "espera") {
      const t = String(body?.t || "").replace(/[<>|]/g, "").slice(0, 80);
      if (t) cmds.push(["HINCRBY", k("trilha_" + ev), t, 1], ["EXPIRE", k("trilha_" + ev), TTL]);
    }
    const r = await pipeline(cmds);
    if (ev === "view") {
      const added = r[r.length - 1];
      await pipeline([["HINCRBY", `${V}ret:${day}`, added ? "novos" : "voltaram", 1], ["EXPIRE", `${V}ret:${day}`, TTL]]);
    }
    return res.status(204).end();
  } catch {
    return res.status(204).end();
  }
}
