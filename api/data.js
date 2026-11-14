import crypto from "node:crypto";
import { dbReady, pipeline, credOk, falhasLogin, limparFalhas } from "./_db.js";

// Dados do site (trilhas, datas, vídeos, fotos, WhatsApp), fila de espera e envio de fotos.
// GET  /api/data            → dados públicos do site
// POST /api/data {acao,...}  → ações (as do guia pedem login e senha)
const KEY = "leo:dados";
const ESP = "leo:espera";
const MAXIMG = 1_400_000; // ~1 MB de foto já comprimida pelo navegador

const ipOf = (req) => String(req.headers["x-forwarded-for"] || "?").split(",")[0].trim();
const clean = (v, n) => String(v ?? "").replace(/[<>]/g, "").trim().slice(0, n);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!dbReady()) return res.status(200).json({ semBanco: true });
  try {
    if (req.method === "GET") {
      const [raw] = await pipeline([["GET", KEY]]);
      res.setHeader("Cache-Control", "public, max-age=0, s-maxage=10, stale-while-revalidate=60");
      if (!raw) return res.status(200).json({ vazio: true });
      return res.status(200).send(raw);
    }
    if (req.method !== "POST") return res.status(405).end();
    let b = req.body;
    if (typeof b === "string") { try { b = JSON.parse(b || "{}"); } catch { b = {}; } }
    b = b || {};

    // ---- público: entrar na fila de espera
    if (b.acao === "espera") {
      const it = b.item || {};
      const nome = clean(it.nome, 60), wa = clean(it.whatsapp, 16).replace(/\D/g, "");
      if (nome.length < 2 || wa.length < 10) return res.status(200).json({ ok: false });
      const rk = `leo:esprl:${ipOf(req).replace(/[^\w.:-]/g, "").slice(0, 60)}`;
      const [n] = await pipeline([["INCR", rk], ["EXPIRE", rk, 3600]]);
      if (+n > 10) return res.status(200).json({ ok: false });
      const item = {
        id: clean(it.id, 30).replace(/[^\w-]/g, "") || "w" + Date.now().toString(36),
        quando: new Date().toISOString(), trilhaId: clean(it.trilhaId, 60), trilha: clean(it.trilha, 90),
        nome, whatsapp: wa, pessoas: Math.max(1, Math.min(30, +it.pessoas || 1)), status: "espera",
      };
      await pipeline([["HSET", ESP, item.id, JSON.stringify(item)]]);
      const all = Object.values(await hgetall(ESP)).map(safe).filter(Boolean);
      const pos = all.filter((x) => x.trilhaId === item.trilhaId && x.status !== "avisado").length;
      return res.status(200).json({ ok: true, pos });
    }

    // ---- daqui para baixo, só o guia
    const ip = ipOf(req);
    if ((await falhasLogin(ip)) >= 8) return res.status(429).json({ ok: false, error: "tentativas", msg: "Muitas tentativas. Espere 15 minutos." });
    if (!credOk(b.user, b.pin)) { await falhasLogin(ip, true); return res.status(401).json({ ok: false, error: "pin" }); }
    await limparFalhas(ip);

    if (b.check) return res.status(200).json({ ok: true });

    if (b.data) {
      const d = b.data;
      if (!d || !Array.isArray(d.tours)) return res.status(400).json({ ok: false, error: "dados" });
      const s = JSON.stringify(d);
      if (s.length > 900_000) return res.status(413).json({ ok: false, error: "grande" });
      await pipeline([["SET", KEY, s], ["SET", `${KEY}:backup:${new Date().toISOString().slice(0, 10)}`, s, "EX", 60 * 60 * 24 * 30]]);
      return res.status(200).json({ ok: true });
    }

    if (b.acao === "listaEspera") {
      const lista = Object.values(await hgetall(ESP)).map(safe).filter(Boolean).sort((x, y) => (x.quando < y.quando ? -1 : 1));
      return res.status(200).json({ ok: true, lista });
    }
    if (b.acao === "atualizaEspera") {
      const id = clean(b.id, 30);
      if (b.status === "remover") { await pipeline([["HDEL", ESP, id]]); return res.status(200).json({ ok: true }); }
      const [raw] = await pipeline([["HGET", ESP, id]]);
      const it = safe(raw);
      if (it) { it.status = b.status === "avisado" ? "avisado" : "espera"; await pipeline([["HSET", ESP, id, JSON.stringify(it)]]); }
      return res.status(200).json({ ok: true });
    }

    if (b.acao === "foto") {
      const m = /^data:(image\/(?:jpeg|webp|png));base64,([A-Za-z0-9+/=]+)$/.exec(String(b.img || ""));
      if (!m) return res.status(400).json({ ok: false, error: "formato" });
      if (m[2].length > MAXIMG) return res.status(413).json({ ok: false, error: "grande" });
      const id = crypto.randomBytes(8).toString("hex");
      await pipeline([["HSET", `leo:foto:${id}`, "t", m[1], "b", m[2], "criado", String(Date.now())]]);
      return res.status(200).json({ ok: true, src: `/api/foto?id=${id}` });
    }
    if (b.acao === "apagaFoto") {
      const id = clean(b.id, 20).replace(/[^a-f0-9]/g, "");
      if (id) await pipeline([["DEL", `leo:foto:${id}`]]);
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ ok: false, error: "acao" });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "erro", msg: String((e && e.message) || e) });
  }
}

function safe(s) { try { return JSON.parse(s); } catch { return null; } }
async function hgetall(k) {
  const [a] = await pipeline([["HGETALL", k]]);
  const o = {};
  if (Array.isArray(a)) for (let i = 0; i < a.length; i += 2) o[a[i]] = a[i + 1];
  else if (a) Object.assign(o, a);
  return o;
}
