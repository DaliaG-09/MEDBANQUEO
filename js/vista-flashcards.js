/* ── FLASHCARDS ─────────────────────────────────────── */
async function vFlash(){
  if(!ctx.card) return nuevaCard();
}
async function nuevaCard(){
  cargando("Preparando la tarjeta");
  const venc=vencidos();
  const cid=(venc.length?venc[Math.floor(Math.random()*Math.min(venc.length,5))]:null)||elegirConcepto("auto"), d=S.dominio[cid];
  const nivel=d?d.nivel:0;
  // Las tarjetas evolucionan: de recordar a aplicar, según el nivel del concepto.
  const escalera=["¿qué es y cómo se define?","reconócelo en un dato clínico suelto",
    "clasifica estos valores concretos","¿qué enfermedades producen este patrón?",
    "¿qué información adicional buscarías?","aplícalo a un paciente nuevo"];
  const tarea=escalera[Math.min(escalera.length-1,nivel)];
  let c;
  try{
    c=await claude(`${CONTEXTO_CURSO}

Genera UNA flashcard de recall activo.
Concepto: ${nom(cid)} (tema: ${temaDe(cid)})
Nivel de la tarjeta: ${tarea}
La tarjeta no es una definición copiada: obliga a recuperar información, no a reconocerla.

Devuelve SOLO este JSON, sin backticks:
{"frente":"","reverso":"","perla":"","tarea":"","arquetipo":""}`, 700);
    c.concepto=cid;
  }catch(e){
    c={frente:"Menciona los criterios de Light y qué clasifica cada uno.",
       reverso:"Proteínas en líquido sobre proteínas séricas mayor de 0.5; LDH del líquido sobre LDH sérica mayor de 0.6; LDH del líquido mayor a dos tercios del límite superior normal sérico. Con un solo criterio cumplido, el líquido es exudado.",
       perla:"Se leen en disyunción. Buscar los tres es el error frecuente.", concepto:"pleura::criterios de Light", offline:true};
  }
  ctx={card:c, volteada:false};
  pintarCard();
}
async function evaluarFlashcard(){
  const c=ctx.card, mia=(document.getElementById('fc-answer')?.value||'').trim();
  if(!mia){ctx.feedback={veredicto:'inseguro',puntaje:0,porque:'Primero intenta recuperar la respuesta con tus propias palabras.',perla:c.perla};pintarCard();return;}
  cargando('Comparando tu respuesta');
  try{ctx.feedback=await claude(`${CONTEXTO_CURSO}\n\nEvalúa esta respuesta de active recall.\nPregunta: ${c.frente}\nRespuesta esperada: ${c.reverso}\nRespuesta de la estudiante: ${mia}\n\nEvalúa el significado, no coincidencia literal. Devuelve SOLO JSON:\n{"veredicto":"correcto|parcial|incorrecto|inseguro","puntaje":0,"porque":"","fortalezas":[],"faltantes":[],"perla":"","respuesta_modelo":"","siguiente_paso":""}`,700);}
  catch(e){ctx.feedback={veredicto:'parcial',puntaje:50,porque:'No se pudo evaluar automáticamente. Compara tu respuesta con la respuesta modelo.',perla:c.perla,respuesta_modelo:c.reverso};}
  ctx.volteada=true;
  registrarIntento({concepto:c.concepto,eje:'recordar',pregunta:c.frente,mia,esperada:c.reverso,veredicto:ctx.feedback.veredicto,puntaje:ctx.feedback.puntaje||0,perla:c.perla});
  pintarCard();
}
function pintarCard(){
  const c=ctx.card;
  app.innerHTML=`<div class="label">Flashcards</div>
    <p class="hint" style="margin-bottom:1.2rem">${esc(temaDe(c.concepto))}</p>
    ${c.offline?`<div class="err">Sin conexión. Tarjeta de la semilla local.</div>`:""}
    <div class="card">
      <div class="front">${esc(c.frente)}</div>
      ${ctx.volteada?`<div class="back">${esc(c.reverso)}${c.perla?`<div class="block pearl" style="margin-top:1rem"><h4>Perla clínica</h4><p>${esc(c.perla)}</p></div>`:""}${ctx.feedback?verdictoHTML(ctx.feedback,null):""}</div>`:`<textarea id="fc-answer" class="answer" rows="5" placeholder="Escribe la respuesta con tus propias palabras..."></textarea>`}
    </div>
    ${ctx.volteada?`<div class="grades">
        <button class="ghost" data-q="0">Otra vez</button>
        <button class="ghost" data-q="3">Difícil</button>
        <button class="ghost" data-q="4">Bien</button>
        <button class="ghost" data-q="5">Fácil</button>
      </div>
      <p class="hint" style="margin-top:.8rem">Tu respuesta programa cuándo vuelve el concepto, no la tarjeta. La próxima vez el mismo concepto puede llegarte como caso.</p>`
    :`<div class="actions"><button class="go" id="eval">Evaluar mi respuesta</button></div>`}`;
  if(!ctx.volteada) document.getElementById("eval").onclick=()=>evaluarFlashcard();
  else app.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{
    programar(c.concepto,+b.dataset.q,"recordar");
    guardar(); nuevaCard();
  });
}
