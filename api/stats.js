import crypto from "node:crypto";
import { dbReady, dbMissing, pipeline, dayKey, V, falhasLogin, credOk } from "./_db.js";

const tries = new Map();
const toObj = (a, raw) => { const o = {}; if (Array.isArray(a)) for (let i = 0; i < a.length; i += 2) o[a[i]] = raw ? a[i + 1] : (+a[i + 1] || 0); else if (a) Object.assign(o, a); return o; };
const sumInto = (acc, o) => { for (const [k, v] of Object.entries(o)) acc[k] = (acc[k] || 0) + (+v || 0); return acc; };
const isDay = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d || ""));

export default async function handler(req, res) {
  try { return await main(req, res); }
  catch (e) { return res.status(500).json({ erro: String((e && e.message) || e) }); }
}

async function main(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ erro: "Use POST" });
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0] || "?";
  const t = tries.get(ip) || { n: 0, at: 0 };
  if ((t.n >= 8 && Date.now() - t.at < 10 * 60e3) || (await falhasLogin(ip)) >= 8) return res.status(429).json({ erro: "Muitas tentativas. Espere 15 minutos." });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  // "manter conectado": um código guardado no aparelho no lugar da senha (vale 90 dias, renova a cada uso)
  const tok = String(body?.tok || "").replace(/[^a-f0-9]/g, "").slice(0, 64);
  let porTok = false;
  if (tok.length === 64 && dbReady()) {
    const [ok] = await pipeline([["GET", `leo:adm:sess:${tok}`]]);
    if (ok) { porTok = true; await pipeline([["EXPIRE", `leo:adm:sess:${tok}`, 60 * 60 * 24 * 90]]); }
    else return res.status(401).json({ erro: "Sua sessão expirou. Entre de novo.", sair: true });
  }
  let porGestao = false;
  if (body.acao === "sair") {
    if (porTok) await pipeline([["DEL", `leo:adm:sess:${tok}`]]);
    return res.status(200).json({ ok: true });
  }
  if (!porTok && !porGestao && !credOk(body?.user, body?.pass)) {
    tries.set(ip, { n: t.n + 1, at: Date.now() });
    await falhasLogin(ip, true);
    return res.status(401).json({ erro: "Login ou senha incorretos." });
  }
  tries.delete(ip);
  if (!dbReady()) return res.status(503).json({ erro: `O banco ainda não foi conectado na Vercel (falta ${dbMissing()}). Veja o passo a passo no LEIA-ME.` });

  // ações sobre pedidos
  if (body.acao === "contatado" && body.id) {
    const id = String(body.id).replace(/[^\w-]/g, "").slice(0, 40);
    await pipeline([["HSET", `leo:lead:${id}`, "contatado", body.valor ? String(Date.now()) : ""]]);
    return res.status(200).json({ ok: true });
  }
  if (body.acao === "apagar" && body.id) {
    const id = String(body.id).replace(/[^\w-]/g, "").slice(0, 40);
    await pipeline([["DEL", `leo:lead:${id}`], ["ZREM", "leo:leads", id], ["SET", `leo:leadx:${id}`, "1", "EX", 60 * 60 * 24 * 120]]);
    return res.status(200).json({ ok: true });
  }

  // período
  let to = isDay(body.ate) ? body.ate : dayKey();
  let from = isDay(body.de) ? body.de : dayKey(new Date(Date.now() - 29 * 864e5));
  if (from > to) [from, to] = [to, from];
  const days = [];
  for (let d = new Date(from + "T12:00:00Z"); d <= new Date(to + "T12:00:00Z") && days.length < 400; d = new Date(d.getTime() + 864e5)) days.push(d.toISOString().slice(0, 10));

  const per = ["day", "dev", "src", "pais", "estado", "cidade", "ret", "trilha_trilhas", "trilha_reserva", "trilha_espera"];
  const cmds = [["PFCOUNT", `${V}uniq:all`], ["PFCOUNT", ...days.map((d) => `${V}uniq:${d}`)]];
  days.forEach((d) => { cmds.push(["PFCOUNT", `${V}uniq:${d}`]); per.forEach((p) => cmds.push(["HGETALL", `${V}${p}:${d}`])); });
  cmds.push(["ZREVRANGE", "leo:leads", 0, 199]);
  const r = await pipeline(cmds);

  const out = { de: from, ate: to, pessoasTotal: +r[0] || 0, pessoasPeriodo: +r[1] || 0, dias: [], dispositivo: {}, origem: {}, pais: {}, estado: {}, cidade: {}, retorno: {}, trilhaVista: {}, trilhaReserva: {}, trilhaEspera: {} };
  let i = 2;
  for (const d of days) {
    const pessoas = +r[i++] || 0;
    const parts = per.map(() => toObj(r[i++]));
    out.dias.push({ dia: d, pessoas, ...parts[0] });
    sumInto(out.dispositivo, parts[1]); sumInto(out.origem, parts[2]); sumInto(out.pais, parts[3]);
    sumInto(out.estado, parts[4]); sumInto(out.cidade, parts[5]); sumInto(out.retorno, parts[6]);
    sumInto(out.trilhaVista, parts[7]); sumInto(out.trilhaReserva, parts[8]); sumInto(out.trilhaEspera, parts[9]);
  }
  const ids = r[i] || [];
  let leads = [];
  if (ids.length) {
    const lr = await pipeline(ids.map((id) => ["HGETALL", `leo:lead:${id}`]));
    leads = lr.map((x) => toObj(x, true)).filter((l) => l.id && (l.name || l.phone));
  }
  out.pedidos = leads;
  out.agora = new Date().toISOString();
  if (!porTok && (body.lembrar || porGestao)) { out.tok = crypto.randomBytes(32).toString("hex"); await pipeline([["SET", `leo:adm:sess:${out.tok}`, "1", "EX", 60 * 60 * 24 * 90]]); }
  return res.status(200).json(out);
}
