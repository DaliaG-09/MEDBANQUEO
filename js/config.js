/* Configuración de la plataforma.

   endpoint: a dónde se mandan las llamadas al modelo.
     "/api/claude" es la función serverless de api/claude.js, que guarda la
     llave de la API como variable de entorno del servidor. La llave NUNCA
     va en este repositorio: es público y quedaría expuesta a cualquiera.
     Si la página se sirve desde el mismo sitio que la función (Vercel),
     esta ruta relativa funciona tal cual y no hace falta configurar CORS.

   modelo: identificador del modelo en la API de Anthropic.
     claude-sonnet-5 es el equilibrio razonable entre calidad y costo para
     generar preguntas y calificar respuestas. claude-haiku-4-5 sale más
     barato pero califica peor las respuestas abiertas, que es justo lo que
     esta plataforma necesita hacer bien. */

const CONFIG = {
  endpoint: "/api/claude",
  modelo: "claude-sonnet-5",
  version: "0.1.1"
};
