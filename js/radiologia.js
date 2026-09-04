/* ── Radiología: calificación, lectura modelo y práctica suelta ── */
async function aBase64(u){
  const b=await (await fetch(u)).blob();
  const tipo=/^image\/(jpeg|png)$/.test(b.type)?b.type:"image/jpeg";
  const data=await new Promise((res,rej)=>{const r=new FileReader();
    r.onload=()=>res(String(r.result).split(",")[1]);r.onerror=rej;r.readAsDataURL(b);});
  return {tipo,data};
}
async function calificarPlaca(placa, texto){
  const m=placa.meta;
  const base=`Eres docente de Medicina Interna de una facultad peruana, calificando la descripción de una radiografía en un taller aplicativo.

La radiografía corresponde a: ${m.dx}.${placa.item.nota?" Detalle: "+placa.item.nota:""}
Hallazgos que una descripción ideal recogería: ${m.esperado.join("; ")}.${placa.item.informe?"\n\nINFORME RADIOLÓGICO ORIGINAL de esta placa, escrito por el radiólogo que la leyó. Es el patrón de oro: califica contra él, no contra el patrón genérico:\n"+placa.item.informe:""}

DESCRIPCIÓN de la estudiante:
"""${texto}"""

ELEMENTOS CALIFICABLES:
${RUB_DESC.map((e,i)=>`${i}. [${e.p} pts${e.o?", obligatorio":""}] ${e.t}`).join("\n")}

Reglas:
- Evalúa significado, no palabras exactas. "Se borra el seno costofrénico" equivale a "borramiento del ángulo costofrénico".
- Si nombró el diagnóstico pero describió poco, la descripción sigue siendo pobre: califica la descripción, no el acierto.
- Si usa términos vagos como "se ve blanco" en vez de opacidad o consolidación, el elemento de terminología no se cumple.
- veredicto: "correcto" si cumple los obligatorios y suma 85 o más; "parcial" si cumple alguno; "incorrecto" si falla ambos.
- "porque" en segunda persona, dos o tres frases. "pista" nombra la zona de la placa que debía mirar. "perla" enseña a leer.
- Español de Perú, tono clínico.

Devuelve SOLO este JSON, sin backticks:
{"cumplidos":[true,false,true,false],"puntaje":0,"veredicto":"","porque":"","pista":"","perla":"","tipo_error":null}`;
  try{
    let bloques;
    try{
      const im=await aBase64(placaSrc(placa));
      bloques=[{type:"image",source:{type:"base64",media_type:im.tipo,data:im.data}},
        {type:"text",text:base+"\n\nMira la imagen adjunta y verifica contra ella: si menciona lado, lóbulo o un signo que la placa no muestra, ese elemento no se cumple y dilo."}];
    }catch(e){ bloques=[{type:"text",text:base}]; }
    return await claude(bloques,1000);
  }catch(e){
    return {cumplidos:RUB_DESC.map(()=>false),puntaje:0,veredicto:"parcial",tipo_error:"interpretacion",
      porque:"No se pudo calificar la descripción. Compárala tú misma con los elementos de arriba.",pista:"",perla:""};
  }
}
async function lecturaModelo(placa, descripcion, contId){
  const cont=document.getElementById(contId); if(!cont) return;
  const m=placa.meta;
  const base=`Eres docente de Medicina Interna de una facultad peruana. La estudiante ya respondió y ahora le muestras la lectura correcta de la placa.

Diagnóstico de la radiografía: ${m.dx}.${placa.item.nota?" Detalle: "+placa.item.nota:""}
Hallazgos característicos: ${m.esperado.join("; ")}.${placa.item.informe?"\nINFORME RADIOLÓGICO ORIGINAL, que debes usar como base de la lectura modelo:\n"+placa.item.informe:""}
Lo que ella escribió: """${descripcion}"""

Escribe:
1. "descripcion": la descripción modelo de esta radiografía, en un párrafo corrido, siguiendo el orden de lectura sistemático y con la terminología del curso, como se escribiría en el examen para el puntaje completo. Máximo cinco oraciones.
2. "hallazgos": entre tres y cinco hallazgos puntuales que había que ver, cada uno en menos de doce palabras.
3. "comparacion": una o dos frases en segunda persona diciéndole qué vio bien y qué se le pasó. Concreta, sin halago vacío.

Español de Perú, tono clínico, sin emojis.

Devuelve SOLO este JSON, sin backticks:
{"descripcion":"","hallazgos":["",""],"comparacion":""}`;
  let r, conImagen=false;
  try{
    let bloques;
    try{
      const im=await aBase64(placaSrc(placa));
      bloques=[{type:"image",source:{type:"base64",media_type:im.tipo,data:im.data}},
        {type:"text",text:base+"\n\nDescribe la imagen adjunta tal como es: lado, lóbulo y signos reales de ESTA placa."}];
      conImagen=true;
    }catch(e){
      bloques=[{type:"text",text:base+"\n\nNo tienes la imagen a la vista: describe el patrón de forma canónica y NO inventes lateralidad, lóbulo ni cifras. Usa fórmulas como \"en el campo afectado\"."}];
    }
    r=await claude(bloques,900);
  }catch(e){
    cont.innerHTML=`<div class="modelo"><h4>Lo que se tenía que ver</h4>
      <ul>${m.esperado.map(h=>`<li>${esc(h)}</li>`).join("")}</ul>
      <p class="cmp">No se pudo generar la lectura completa. Estos son los hallazgos que definen el patrón.</p></div>`;
    return;
  }
  cont.innerHTML=`<div class="modelo">
    <h4>Lo que se tenía que ver</h4>
    <p>${esc(r.descripcion)}</p>
    <ul>${(r.hallazgos||[]).map(h=>`<li>${esc(h)}</li>`).join("")}</ul>
    ${r.comparacion?`<p class="cmp">${esc(r.comparacion)}</p>`:""}
    ${conImagen?"":`<p class="cmp">Lectura canónica del patrón: aquí no se puede mirar la placa, así que no se afirma lado ni lóbulo.</p>`}
    <p class="credit" style="margin-top:.6rem">Imagen de Wikimedia Commons, licencia libre.
      <a href="${esc(placaPagina(placa))}" target="_blank" rel="noopener">Ver la ficha original</a>. Fuente: ${esc(placa.item.fuente||"repositorio abierto")}.</p>
  </div>`;
}

async function vImagenes(){
  if(!ctx.placa){
    app.innerHTML=`<div class="label">Imágenes</div>
      <h1>Describe primero. El diagnóstico viene después.</h1>
      <p class="lede">Práctica suelta de lectura radiológica, sin caso alrededor. Las placas salen de un repositorio abierto, no de tus clases, así que ninguna la viste en un PPT.</p>
      <p class="lede">Dentro de <strong>Casos</strong> estas mismas radiografías aparecen en la etapa 4, con el paciente completo alrededor. Esto es para entrenar el ojo aparte.</p>
      <div class="actions"><button class="go" id="ir">Abrir una placa</button></div>`;
    document.getElementById("ir").onclick=async()=>{ cargando("Buscando una placa"); ctx={placa:await elegirPlaca(null,true)}; vImagenes(); };
    return;
  }
  const placa=ctx.placa;
  app.innerHTML=`<div class="label">Placa sin identificar</div>
    ${visorHTML(placa,"vw2")}
    <div class="qhead"><span class="qnum">1</span><p class="qtext">Describa la radiografía de tórax.</p></div>
    <textarea id="txt" placeholder="Describe lo que ves, de forma sistemática, sin nombrar todavía el diagnóstico."></textarea>
    <div class="actions" id="acc"><button class="go" id="ok">Calificar la descripción</button>
      <span class="hint">Ctrl + Enter</span></div>
    <div id="fb"></div>`;
  activarVisor("vw2");
  const t=document.getElementById("txt"); t.focus();
  t.addEventListener("keydown",e=>{ if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)) enviar(); });
  document.getElementById("ok").onclick=enviar;
  async function enviar(){
    const v=t.value.trim(); if(v.length<10) return;
    t.readOnly=true;
    document.getElementById("acc").innerHTML=`<span class="loading">Calificando</span>`;
    const j=await calificarPlaca(placa,v);
    registrarIntento({concepto:(placa.meta.tema||"ayudadx")+"::lectura radiológica",eje:"interpretar",
      veredicto:j.veredicto,puntaje:j.puntaje,pregunta:"Describa la radiografía de tórax.",mia:v,
      tipo_error:j.tipo_error,perla:j.perla,
      falto:RUB_DESC.filter((e,i)=>!(j.cumplidos||[])[i]).map(e=>e.t)});
    document.getElementById("acc").remove();
    document.getElementById("fb").innerHTML=verdictoHTML(j,RUB_DESC)+`
      <div id="modelo2"><p class="loading">Escribiendo la lectura que se esperaba</p></div>
      <div class="actions"><button class="go" id="otra">Otra placa</button>
        <button class="ghost" id="fin">Terminar</button></div>`;
    lecturaModelo(placa,v,"modelo2");
    document.getElementById("otra").onclick=async()=>{ cargando("Buscando una placa"); ctx={placa:await elegirPlaca(null,true)}; vImagenes(); };
    document.getElementById("fin").onclick=()=>{ ctx={}; vImagenes(); };
  }
}
