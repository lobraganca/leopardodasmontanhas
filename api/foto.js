import { dbReady, pipeline } from "./_db.js";

// Entrega as fotos enviadas pela Área do guia. Ficam no cache da Vercel por 1 ano.
export default async function handler(req, res) {
  const id = String(req.query?.id || "").replace(/[^a-f0-9]/g, "").slice(0, 20);
  if (!id || !dbReady()) return res.status(404).end();
  try {
    const [a] = await pipeline([["HMGET", `leo:foto:${id}`, "t", "b"]]);
    if (!a || !a[1]) return res.status(404).end();
    res.setHeader("Content-Type", a[0] || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.status(200).send(Buffer.from(a[1], "base64"));
  } catch {
    return res.status(500).end();
  }
}
