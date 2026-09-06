/* ── CASOS CLÍNICOS (el centro) ─────────────────────── */
async function vCasos(){
  if(!ctx.caso){
    app.innerHTML=`<div class="label">Casos clínicos</div>
      <h1>Un paciente, ocho etapas, sin volver atrás.</h1>
      <p class="lede">Te comprometes con una hipótesis antes de ver los datos que la confirman, igual que en el taller. La hipótesis queda congelada arriba de la pantalla y la vas a tener enfrente todo el caso.</p>
      <div class="filters" id="tsel">
        <button data-t="auto" aria-pressed="true">El sistema elige</button>
        ${TEMAS.filter(t=>t.alto).map(t=>`<button data-t="${t.id}" aria-pressed="false">${esc(t.nombre)}</button>`).join("")}
      </div>
      <div class="actions"><button class="go" id="ir">Abrir el caso</button></div>`;
    let sel="auto";
    app.querySelectorAll("#tsel button").forEach(b=>b.onclick=()=>{ sel=b.dataset.t;
      app.querySelectorAll("#tsel button").forEach(x=>x.setAttribute("aria-pressed",x===b)); });
    document.getElementById("ir").onclick=()=>abrirCaso(sel);
    return;
  }
}
async function abrirCaso(temaSel){
  cargando("Preparando el caso");
  const altos=TEMAS.filter(t=>t.alto);
  const tid = temaSel==="auto" ? altos[Math.floor(Math.random()*altos.length)].id : temaSel;
  const placa = await elegirPlaca(tid);
  let caso;
  try{ caso=await claude(pedirCaso(tid,3,placa)); }
  catch(e){
    caso={concepto:"nac::CURB-65", arquetipo:"varón adulto con neumonía", tema:"Neumonía adquirida en la comunidad",
      presentacion:"Varón de 58 años, taxista, con hipertensión arterial y antecedente de tabaquismo de 20 paquetes-año, sin vacunación antineumocócica ni antigripal. Refiere cuatro días de malestar general, escalofríos y fiebre no cuantificada. A las 48 horas se agregó tos productiva con esputo amarillento, dolor torácico que aumenta con la inspiración profunda y disnea de pequeños esfuerzos. Se automedicó paracetamol sin mejoría.",
      diagnostico_final:"Neumonía adquirida en la comunidad con criterios de hospitalización",
      conceptos_involucrados:["CURB-65","tratamiento antibiótico empírico"], offline:true};
  }
  marcar(hash({concepto:caso.concepto,eje:"aplicar",arquetipo:caso.arquetipo,contexto:"caso|"+tid,tarea:"progresivo"}));
  ctx={caso, placa, etapa:1, hipotesis:null, historial:[], puntajes:[]};
  pintarEtapa1();
}
function marcoCaso(){
  const c=ctx.caso;
  return `${c.offline?`<div class="err">Sin conexión con el generador. Estás resolviendo un caso de la semilla local.</div>`:""}
    <div class="label">Caso clínico · ${esc(c.tema||"")}</div>
    <div class="stagebar">${ETAPAS.map(e=>`<i class="${e.n<=ctx.etapa?"on":""}"></i>`).join("")}</div>
    <p class="hint" style="margin:.5rem 0 1.4rem">Etapa ${ctx.etapa} de 8 · ${esc(ETAPAS[ctx.etapa-1].t)}</p>
    ${ctx.hipotesis?`<div class="frozen"><b>Tu hipótesis inicial</b>${esc(ctx.hipotesis)}</div>`:""}
    <p class="narrative">${esc(c.presentacion)}</p>`;
}
function pintarEtapa1(){
  app.innerHTML=marcoCaso()+`
    <div class="stage">
      <div class="qhead"><span class="qnum">1</span><p class="qtext">¿Cuál es tu hipótesis diagnóstica con lo que tienes hasta aquí?</p></div>
      <textarea id="txt" placeholder="Compromete una hipótesis. Una vez guardada no se edita."></textarea>
      <div class="actions"><button class="go" id="ok">Congelar hipótesis</button>
        <span class="hint">Sin editar después</span></div>
    </div>`;
  const t=document.getElementById("txt"); t.focus();
  document.getElementById("ok").onclick=()=>{
    const v=t.value.trim(); if(v.length<3) return;
    ctx.hipotesis=v; ctx.historial.push("Hipótesis inicial: "+v); ctx.etapa=2; siguienteEtapa();
  };
}
async function siguienteEtapa(){
  if(ctx.etapa>8) return cierreCaso();
  const conPlaca = ctx.etapa===4 && !!ctx.placa;
  cargando("Revelando la etapa "+ctx.etapa);
  let et;
  if(conPlaca){
    // La placa manda: no se genera nada, se muestra la radiografía real y se
    // pregunta lo que pregunta el taller de imágenes del curso.
    et={datos:"Se solicita radiografía de tórax.", aga:null,
        pregunta:"Describa la radiografía de tórax.", verbo:"Describa", eje:"interpretar",
        rubrica:RUB_DESC,
        pista:"", perla:""};
  } else {
    try{ et=await claude(pedirEtapa(ctx.caso,ctx.etapa,ctx.hipotesis,ctx.historial.slice(-3).join(" | "))); }
    catch(e){
      et={datos:"Sin conexión: no se pudo revelar esta etapa. Puedes cerrar el caso y retomarlo con conexión.",
          pregunta:"Con lo que tienes, ¿qué harías a continuación y por qué?",eje:"aplicar",
          rubrica:[{t:"Propone una conducta razonable para el cuadro",p:60,o:true},
                   {t:"Justifica la conducta con un dato del caso",p:40,o:true}],offline:true};
    }
  }
  ctx.etapaActual=et;
  app.innerHTML=marcoCaso()+`
    <div class="stage">
      <p class="vitals">${esc(et.datos)}</p>
      ${conPlaca?visorHTML(ctx.placa,"vw"):""}
      ${stripHTML(et.aga)}
      <div class="qhead"><span class="qnum">${ctx.etapa}</span><p class="qtext">${esc(et.pregunta)}</p></div>
      <textarea id="txt" placeholder="${conPlaca?"Describe lo que ves, de forma sistemática, sin nombrar todavía el diagnóstico.":"Escribe tu respuesta."}"></textarea>
      <div class="actions" id="acc"><button class="go" id="ok">Responder</button>
        <span class="hint">Ctrl + Enter</span></div>
      <div id="fb"></div>
    </div>`;
  if(conPlaca) activarVisor("vw");
  const t=document.getElementById("txt"); t.focus();
  t.addEventListener("keydown",e=>{ if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)) enviar(); });
  document.getElementById("ok").onclick=enviar;

  async function enviar(){
    const v=t.value.trim(); if(v.length<3) return;
    t.readOnly=true;
    document.getElementById("acc").innerHTML=`<span class="loading">Calificando</span>`;
    let j;
    if(conPlaca){
      ctx.descripcionPlaca=v;
      j=await calificarPlaca(ctx.placa,v);
    } else {
      const ctxTxt=ctx.caso.presentacion+"\n"+et.datos;
      j=await calificarAbierta(et.pregunta,et.rubrica,v,ctxTxt);
    }
    if(!j.pista&&et.pista) j.pista=et.pista;
    if(!j.perla&&et.perla) j.perla=et.perla;
    document.getElementById("acc").remove();
    document.getElementById("fb").innerHTML=verdictoHTML(j,et.rubrica)
      +(conPlaca?`<div id="modelo"><p class="loading">Escribiendo la lectura que se esperaba</p></div>`:"");
    if(conPlaca) lecturaModelo(ctx.placa, v, "modelo");
    ctx.historial.push(`Etapa ${ctx.etapa}: ${v}`);
    ctx.puntajes.push(j.puntaje||0);
    registrarIntento({concepto:ctx.caso.concepto,eje:et.eje||"aplicar",veredicto:j.veredicto,puntaje:j.puntaje,
      pregunta:et.pregunta,mia:v,tipo_error:j.tipo_error,perla:j.perla,
      falto:et.rubrica.filter((e,i)=>!(j.cumplidos||[])[i]).map(e=>e.t)});
    const nx=document.createElement("div"); nx.className="actions";
    nx.innerHTML=`<button class="go" id="sig">${ctx.etapa>=8?"Cerrar el caso":"Siguiente etapa"}</button>`;
    document.getElementById("fb").appendChild(nx);
    nx.querySelector("#sig").onclick=()=>{ ctx.etapa++; siguienteEtapa(); };
  }
}
function cierreCaso(){
  const prom=Math.round(ctx.puntajes.reduce((a,b)=>a+b,0)/Math.max(1,ctx.puntajes.length));
  const etapasConPuntaje=ctx.puntajes.map((p,i)=>({p,i:i+1})).sort((a,b)=>a.p-b.p);
  const etapaDebil=etapasConPuntaje[0];
  const etapaTexto=etapaDebil?ETAPAS[etapaDebil.i-1].t:"";
  app.innerHTML=`<div class="label">Cierre del caso</div>
    <h1>${prom} de 100 en el caso completo.</h1>
    <div class="frozen"><b>Lo que dijiste al principio, sin ver nada</b>${esc(ctx.hipotesis)}</div>
    <div class="block"><h4>Diagnóstico del caso</h4><p>${esc(ctx.caso.diagnostico_final||"—")}</p></div>
    <p class="lede">Compara las dos cosas de arriba. Ahí está la información más útil del ejercicio: no cuánto sacaste, sino si tu primera lectura del paciente iba en la dirección correcta y qué dato te habría corregido antes.</p>
    ${etapaDebil?`<div class="block"><h4>Tu punto más débil en este caso</h4><p><strong>Etapa ${etapaDebil.i}: ${esc(etapaTexto)}</strong> · ${etapaDebil.p}/100. El próximo entrenamiento priorizará esta competencia si vuelve a aparecer como debilidad.</p></div>`:""}
    <div class="actions"><button class="go" id="otro">Otro caso</button>
      <button class="ghost" id="sus">Sustentar este caso</button></div>`;
  document.getElementById("otro").onclick=()=>{ ctx={}; ir("casos"); };
  document.getElementById("sus").onclick=()=>{ const c=ctx.caso; ctx={caso:c,historial:[],ronda:0}; vista="sustentacion";
    document.querySelectorAll(".nav button").forEach(b=>b.setAttribute("aria-current",b.dataset.v==="sustentacion"?"page":"false"));
    rondaSustentacion(); };
}
