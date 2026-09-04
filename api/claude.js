/* Función intermedia entre la página y la API de Anthropic.
   Existe por una sola razón: la llave de la API no puede vivir en este
   repositorio, que es público. Aquí se lee de una variable de entorno
   del servidor, que nunca se sube a git.

   Despliegue en Vercel:
     1. Importa el repositorio en vercel.com
     2. Settings → Environment Variables → ANTHROPIC_API_KEY = tu llave
     3. Deploy. La función queda en https://TU-PROYECTO.vercel.app/api/claude
     4. En js/config.js pon ese endpoint completo

   Si la página se sirve desde GitHub Pages y la función desde Vercel,
   son dominios distintos, así que hacen falta las cabeceras CORS de abajo.
   Cambia ORIGEN por tu dominio real: dejar "*" permite que cualquier sitio
   consuma tu llave. */

const ORIGEN = "https://daliag-09.github.io";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", ORIGEN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Solo POST" });

  const llave = process.env.ANTHROPIC_API_KEY;
  if (!llave) return res.status(500).json({ error: "Falta ANTHROPIC_API_KEY en el servidor" });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": llave,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(req.body)
    });
    const datos = await r.json();
    return res.status(r.status).json(datos);
  } catch (e) {
    return res.status(502).json({ error: "No se pudo contactar a la API", detalle: String(e) });
  }
}
