/* Endpoint seguro de Gemini para MEDBANQUEO.
   La API key vive SOLO en Vercel como GEMINI_API_KEY.
*/
const MODELO_DEFECTO = "gemini-3.6-flash";

function partesGemini(input){
  if(Array.isArray(input)){
    return input.map(b=>{
      if(b?.type==="text") return {text:String(b.text||"")};
      if(b?.type==="image" && b?.source?.data){
        return {inlineData:{mimeType:b.source.media_type||"image/jpeg",data:b.source.data}};
      }
      return null;
    }).filter(Boolean);
  }
  return [{text:String(input||"")}];
}

function extraerTextoFinal(datos){
  return (datos?.candidates?.[0]?.content?.parts||[])
    .filter(p=>p?.thought!==true && typeof p?.text==="string")
    .map(p=>p.text).join("").trim();
}

function parsearJSON(texto){
  const limpio=String(texto||"").trim();
  try{return JSON.parse(limpio);}catch{}

  const ini=limpio.indexOf("{");
  const fin=limpio.lastIndexOf("}");
  if(ini>=0 && fin>ini){
    try{return JSON.parse(limpio.slice(ini,fin+1));}catch{}
  }

  const ai=limpio.indexOf("[");
  const af=limpio.lastIndexOf("]");
  if(ai>=0 && af>ai){
    try{return JSON.parse(limpio.slice(ai,af+1));}catch{}
  }
  return null;
}

export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");

  if(req.method==="OPTIONS") return res.status(204).end();
  if(req.method!=="POST") return res.status(405).json({error:"Solo POST"});

  const llave=process.env.GEMINI_API_KEY;
  if(!llave) return res.status(500).json({error:"Falta GEMINI_API_KEY en Vercel"});

  try{
    const body=typeof req.body==="string" ? JSON.parse(req.body) : (req.body||{});
    const {input,max_tokens,model}=body;
    if(!input) return res.status(400).json({error:"Falta input"});

    const nombre=model||MODELO_DEFECTO;
    const r=await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/"+
      encodeURIComponent(nombre)+":generateContent",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "x-goog-api-key":llave
        },
        body:JSON.stringify({
          contents:[{role:"user",parts:partesGemini(input)}],
          generationConfig:{
            maxOutputTokens:Math.max(2000,Math.min(Number(max_tokens)||3000,6000)),
            responseMimeType:"application/json",
            thinkingConfig:{thinkingLevel:"low"}
          }
        })
      }
    );

    const datos=await r.json();
    if(!r.ok){
      return res.status(r.status).json({
        error:datos?.error?.message||"Gemini rechazó la solicitud"
      });
    }

    const texto=extraerTextoFinal(datos);
    const objeto=parsearJSON(texto);

    if(!texto) return res.status(502).json({error:"Gemini no devolvió contenido utilizable"});

    if(!objeto){
      const finish=datos?.candidates?.[0]?.finishReason||"desconocido";
      console.error("Gemini devolvió JSON inválido",{finishReason:finish,textPreview:texto.slice(0,1000)});
      return res.status(502).json({
        error:"Gemini devolvió una respuesta que no es JSON válido. Motivo: "+finish
      });
    }

    return res.status(200).json({text:JSON.stringify(objeto)});
  }catch(e){
    console.error("Gemini endpoint error:",e);
    return res.status(502).json({error:e?.message||"No se pudo contactar a Gemini"});
  }
}
