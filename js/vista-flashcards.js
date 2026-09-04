/* ── FLASHCARDS ─────────────────────────────────────── */
async function vFlash(){
  if(!ctx.card) return nuevaCard();
}
async function nuevaCard(){
  cargando("Preparando la tarjeta");
  const cid=elegirConcepto("auto"), d=S.dominio[cid];
  const nivel=d?d.nivel:0;
  // Las tarjetas evolucionan: de recordar a aplicar, según el nivel del concepto.
  const escalera=["¿qué es y cómo se define?","reconócelo en un dato clínico suelto",
    "clasifica estos valores concretos","¿qué enfermedades producen este patrón?",
    "¿qué información adicional buscarías?","aplícalo a un paciente nuevo"];
  const tarea=escalera[Math.min(escalera.length-1,nivel+ (d&&d.ejes.recordar?1:0))];
  let c;
  try{
    c=await claude(`${CONTEXTO_CURSO}

Genera UNA flashcard de recall activo.
Concepto: ${nom(cid)} (tema: ${temaDe(cid)})
Nivel de la tarjeta: ${tarea}
La tarjeta no es una definición copiada: obliga a recuperar información, no a reconocerla.

Devuelve SOLO este JSON, sin backticks:
{"frente":"","reverso":"","perla":""}`, 500);
    c.concepto=cid;
  }catch(e){
    c={frente:"Menciona los criterios de Light y qué clasifica cada uno.",
       reverso:"Proteínas en líquido sobre proteínas séricas mayor de 0.5; LDH del líquido sobre LDH sérica mayor de 0.6; LDH del líquido mayor a dos tercios del límite superior normal sérico. Con un solo criterio cumplido, el líquido es exudado.",
       perla:"Se leen en disyunción. Buscar los tres es el error frecuente.", concepto:"pleura::criterios de Light", offline:true};
  }
  ctx={card:c, volteada:false};
  pintarCard();
}
function pintarCard(){
  const c=ctx.card;
  app.innerHTML=`<div class="label">Flashcards</div>
    <p class="hint" style="margin-bottom:1.2rem">${esc(temaDe(c.concepto))}</p>
    ${c.offline?`<div class="err">Sin conexión. Tarjeta de la semilla local.</div>`:""}
    <div class="card">
      <div class="front">${esc(c.frente)}</div>
      ${ctx.volteada?`<div class="back">${esc(c.reverso)}${c.perla?`<div class="block pearl" style="margin-top:1rem"><h4>Perla</h4><p>${esc(c.perla)}</p></div>`:""}</div>`:""}
    </div>
    ${ctx.volteada?`<div class="grades">
        <button class="ghost" data-q="0">Otra vez</button>
        <button class="ghost" data-q="3">Difícil</button>
        <button class="ghost" data-q="4">Bien</button>
        <button class="ghost" data-q="5">Fácil</button>
      </div>
      <p class="hint" style="margin-top:.8rem">Tu respuesta programa cuándo vuelve el concepto, no la tarjeta. La próxima vez el mismo concepto puede llegarte como caso.</p>`
    :`<div class="actions"><button class="go" id="ver">Mostrar respuesta</button></div>`}`;
  if(!ctx.volteada) document.getElementById("ver").onclick=()=>{ ctx.volteada=true; pintarCard(); };
  else app.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{
    programar(c.concepto,+b.dataset.q,"recordar");
    S.intentos.push({f:Date.now(),concepto:c.concepto,eje:"recordar",veredicto:+b.dataset.q>=4?"correcto":"parcial",puntaje:+b.dataset.q*20});
    guardar(); nuevaCard();
  });
}
