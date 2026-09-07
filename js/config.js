/* Configuración del proveedor de IA de MEDBANQUEO.
   La llave nunca vive aquí. Vercel la guarda como GEMINI_API_KEY.
   El endpoint es relativo porque la página y la función viven en Vercel.
*/
const CONFIG = {
  endpoint: "/api/gemini",
  modelo: "gemini-3.7-flash",
  version: "0.2.0"
};
