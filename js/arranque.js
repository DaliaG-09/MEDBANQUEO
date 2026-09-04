/* Arranque. Va último: todos los módulos ya están cargados. */
cargar().then(()=>{
  ir("inicio");
  if(!CONFIG.endpoint.includes("/api/")) console.info(
    "Llamando a la API directamente. En producción, apunta CONFIG.endpoint a tu función serverless.");
});
