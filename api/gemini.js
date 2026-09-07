/* Generador de MEDBANQUEO con Gemini.
   La API key vive SOLO en Vercel como GEMINI_API_KEY.
   El navegador nunca recibe la llave.
*/
const MODELO_DEFECTO = "gemini-3.7-flash";

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

export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");

  if(req.method==="OPTIONS") return res.status(204).end();
  if(req.method!=="POST") return res.status(405).json({error:"Solo POST"});

  const llave=process.env.GEMINI_API_KEY;
  if(!llave) return res.status(500).json({error:"Falta GEMINI_API_KEY en Vercel"});

  try{
    const {input,max_tokens,model}=req.body||{};
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
            maxOutputTokens:max_tokens||1200,
            responseMimeType:"application/json"
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

    const texto=(datos?.candidates?.[0]?.content?.parts||[])
      .map(p=>p.text||"").join("").trim();

    if(!texto) return res.status(502).json({error:"Gemini no devolvió contenido"});
    return res.status(200).json({text:texto});
  }catch(e){
    return res.status(502).json({error:"No se pudo contactar a Gemini"});
  }
}
