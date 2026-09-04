/* ── EXÁMENES ───────────────────────────────────────── */
async function vExamenes(){
  if(ctx.examen) return;
  app.innerHTML=`<div class="label">Simular examen</div>
    <h1>Sin feedback hasta el final.</h1>
    <p class="lede">Ocho preguntas con la distribución del curso: interpretación, cálculo, aplicación clínica y sustentación. No vas a ver ningún resultado, ninguna perla ni ninguna pista hasta terminar.</p>
    <div class="actions"><button class="go" id="ir">Empezar el examen</button></div>`;
  document.getElementById("ir").onclick=iniciarExamen;
}
async function iniciarExamen(){
  ctx={examen:{i:0,total:8,items:[],resp:[]}};
  cargando("Armando el examen");
  const plan=[["interpretar","opcion_multiple"],["calcular","calculo"],["interpretar","abierta"],
              ["aplicar","opcion_multiple"],["calcular","calculo"],["aplicar","abierta"],
              ["integrar","abierta"],["sustentar","abierta"]];
  for(const [eje,tipo] of plan){
    const cid=elegirConcepto("auto");
    let q;
    try{ q=await claude(pedirPregunta(cid,eje,3,tipo)); q.concepto=cid; q.eje=eje; }
    catch(e){ q=Object.assign({},SEMILLA_BANCO[ctx.examen.items.length%SEMILLA_BANCO.length]); q.offline=true; }
    ctx.examen.items.push(q);
    cargando(`Armando el examen · ${ctx.examen.items.length} de 8`);
  }
  pintarExamen();
}
function pintarExamen(){
  const E=ctx.examen, q=E.items[E.i];
  app.innerHTML=`<div class="examchrome"><span>Examen</span><span>Pregunta <b>${E.i+1}</b> de <b>${E.total}</b></span></div>
    <div class="qhead"><span class="qnum">${E.i+1}</span><p class="qtext">${esc(q.enunciado)}</p></div>
    <div id="campo"></div>
    <div class="actions"><button class="go" id="ok">${E.i===E.total-1?"Terminar":"Siguiente"}</button></div>`;
  const campo=document.getElementById("campo");
  let sel=null;
  if(q.opciones){
    campo.innerHTML=`<ul class="choices">${q.opciones.map((o,i)=>
      `<li><button class="choice" data-i="${i}" aria-pressed="false"><span class="k">${"abcdef"[i]}</span><span>${esc(o)}</span></button></li>`).join("")}</ul>`;
    campo.querySelectorAll(".choice").forEach(b=>b.onclick=()=>{ sel=+b.dataset.i;
      campo.querySelectorAll(".choice").forEach(x=>x.setAttribute("aria-pressed",x===b)); });
  } else if(q.tipo==="calculo"||q.tipo==="respuesta_corta"){
    campo.innerHTML=`<input type="text" id="t" aria-label="Respuesta">`;
  } else {
    campo.innerHTML=`<textarea id="t" aria-label="Respuesta"></textarea>`;
  }
  document.getElementById("ok").onclick=()=>{
    const inp=campo.querySelector("#t");
    E.resp.push(inp?inp.value.trim():sel);
    E.i++;
    if(E.i>=E.total) corregirExamen(); else pintarExamen();
  };
}
async function corregirExamen(){
  const E=ctx.examen;
  cargando("Corrigiendo");
  const res=[];
  for(let i=0;i<E.items.length;i++){
    const q=E.items[i], r=E.resp[i];
    let j;
    if(q.tipo==="opcion_multiple"||q.opciones){
      const bien=r===q.correcta; j={veredicto:bien?"correcto":"incorrecto",puntaje:bien?100:0,porque:q.porque,perla:q.perla,tipo_error:bien?null:"confusion"};
    } else if(q.tipo==="calculo"||q.tipo==="respuesta_corta"){
      const a=parseFloat(String(r).replace(",",".")), b=parseFloat(String(q.respuesta).replace(",","."));
      const bien=!isNaN(a)&&!isNaN(b)&&Math.abs(a-b)<=(q.tolerancia||0)+1e-9;
      j={veredicto:bien?"correcto":"incorrecto",puntaje:bien?100:0,porque:q.porque,perla:q.perla,tipo_error:bien?null:"calculo"};
    } else {
      const rub=q.rubrica||[{t:"Responde el fondo de la pregunta",p:100,o:true}];
      j=await calificarAbierta(q.enunciado,rub,String(r||""),null); j._rub=rub;
    }
    res.push(j);
    registrarIntento({concepto:q.concepto,eje:q.eje,veredicto:j.veredicto,puntaje:j.puntaje,
      pregunta:q.enunciado,mia:String(r||""),tipo_error:j.tipo_error,perla:j.perla||q.perla,
      falto:j._rub?j._rub.filter((e,k)=>!(j.cumplidos||[])[k]).map(e=>e.t):[]});
    cargando(`Corrigiendo · ${i+1} de ${E.items.length}`);
  }
  S.ultimoExamen={f:Date.now(),puntaje:Math.round(res.reduce((s,j)=>s+(j.puntaje||0),0)/res.length)};
  guardar();
  resultadosExamen(res);
}
function resultadosExamen(res){
  const E=ctx.examen;
  const total=Math.round(res.reduce((s,j)=>s+(j.puntaje||0),0)/res.length);
  const porEje={};
  E.items.forEach((q,i)=>{ const e=porEje[q.eje]||{n:0,s:0}; e.n++; e.s+=res[i].puntaje||0; porEje[q.eje]=e; });
  const debiles=Object.entries(porEje).filter(([,v])=>v.s/v.n<70).map(([k])=>k);
  app.innerHTML=`<div class="label">Resultados</div>
    <h1>${total} de 100.</h1>
    <div class="stats">
      <div class="stat"><b>${res.filter(j=>j.veredicto==="correcto").length}/${res.length}</b><span>correctas</span></div>
      <div class="stat"><b>${res.filter(j=>j.veredicto==="parcial").length}</b><span>parciales</span></div>
      <div class="stat"><b>${res.filter(j=>j.veredicto==="inseguro").length}</b><span>inseguras</span></div>
    </div>
    <h2>Por competencia</h2>
    <div class="axes">${Object.entries(porEje).map(([k,v])=>{
      const p=Math.round(v.s/v.n);
      return `<div class="axis"><span class="nm">${k}</span><span class="bar"><i style="width:${p}%"></i></span><span class="n">${p}</span></div>`;
    }).join("")}</div>
    <h2>Qué revisar ahora</h2>
    <p class="lede">${debiles.length?`Lo que falló no fue un tema sino una forma de tarea: ${debiles.join(", ")}. Eso se corrige con casos y sustentación, no releyendo el PPT.`
      :"Ningún eje por debajo de 70. Conviene subir la dificultad del banco antes del siguiente simulacro."}</p>
    <h2>Detalle</h2>
    <ul class="errlist">${E.items.map((q,i)=>`<li>
      <div class="cpt">${esc(nom(q.concepto))} · ${res[i].veredicto}</div>
      <p class="q">${esc(q.enunciado)}</p>
      ${res[i].porque?`<div class="meta">${esc(res[i].porque)}</div>`:""}
    </li>`).join("")}</ul>
    <div class="actions"><button class="go" id="otro">Otro simulacro</button>
      <button class="ghost" id="prog">Ver progreso</button></div>`;
  document.getElementById("otro").onclick=()=>{ ctx={}; ir("examenes"); };
  document.getElementById("prog").onclick=()=>ir("progreso");
}
