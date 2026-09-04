/* Configuración de la plataforma.
   endpoint: a dónde se mandan las llamadas al modelo.
     - En producción debe ser "/api/claude", la función serverless que
       guarda la llave de la API como variable de entorno. La llave NUNCA
       va en este repositorio: es público y quedaría expuesta.
     - "https://api.anthropic.com/v1/messages" solo sirve en entornos que
       inyectan la credencial por su cuenta, como los artefactos de Claude.
   modelo: el modelo que genera y califica. */
const CONFIG = {
  endpoint: "/api/claude",
  modelo: "claude-sonnet-4-6",
  version: "0.1.0"
};
