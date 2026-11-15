import { dbReady, pipeline } from "./_db.js";

// Guarda os pedidos feitos no site (reserva de trilha, guia particular, fila de espera)
// para o Bruno ver na Área do guia e poder retornar.
const TTL = 60 * 60 * 24 * 180; // 180 dias
const clean = (v, n) => String(v ?? "").replace(/[<>]/g, "").trim().slice(0, n);
const TIPOS = new Set(["reserva", "particular", "espera"]);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).end();
  if (!dbReady()) return res.status(204).end();
  try {
    let b = req.body;
    if (typeof b === "string") b = JSON.parse(b || "{}");
    const id = clean(b.id, 40).replace(/[^\w-]/g, "");
    const tipo = TIPOS.has(b.tipo) ? b.tipo : "reserva";
    const name = clean(b.name, 80), phone = clean(b.phone, 20).replace(/\D/g, "");
    if (!id || (name.length < 2 && phone.length < 10)) return res.status(204).end();
    const key = `leo:lead:${id}`;
    const [apagado, existe] = await pipeline([["EXISTS", `leo:leadx:${id}`], ["EXISTS", key]]);
    if (apagado) return res.status(204).end();
    if (!existe) {
      const ip = String(req.headers["x-forwarded-for"] || "?").split(",")[0].trim().replace(/[^\w.:-]/g, "").slice(0, 60);
      const rk = `leo:leadrl:${ip}`;
      const [n] = await pipeline([["INCR", rk], ["EXPIRE", rk, 3600]]);
      if (+n > 12) return res.status(204).end();
    }
    const now = Date.now();
    const city = (() => { try { return decodeURIComponent(String(req.headers["x-vercel-ip-city"] || "")); } catch { return ""; } })();
    const fields = {
      id, tipo, name, phone, trilha: clean(b.trilha, 90), data: clean(b.data, 40), ad: clean(b.ad, 3), ch: clean(b.ch, 3),
      para: clean(b.para, 40), transp: clean(b.transp, 3), obs: clean(b.obs, 300), cidadeAprox: clean(city, 60),
      estadoAprox: clean(req.headers["x-vercel-ip-country-region"], 10), atualizado: String(now),
    };
    const cmds = [["HSET", key, ...Object.entries(fields).flat()], ["HSETNX", key, "criado", String(now)], ["EXPIRE", key, TTL], ["ZADD", "leo:leads2", now, id]];
    if (b.sent) cmds.push(["HSET", key, "enviado", "sim"], ["HSETNX", key, "enviadoEm", String(now)]);
    await pipeline(cmds);
    return res.status(204).end();
  } catch {
    return res.status(204).end();
  }
}
