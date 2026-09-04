/* ── SUSTENTACIÓN ───────────────────────────────────── */
async function vSustentacion(){
  if(ctx.caso) return rondaSustentacion();
  app.innerHTML=`<div class="label">Sustentación</div>
    <h1>Defiende lo que dijiste.</h1>
    <p class="lede">Un caso corto y luego repreguntas encadenadas: por qué, qué lo apoya, qué está en contra, qué harías después, qué hallazgo te haría cambiar de conducta. Cada respuesta que des determina la siguiente pregunta.</p>
    <div class="actions"><button class="go" id="ir">Empezar</button></div>`;
  document.getElementById("ir").onclick=async()=>{
    cargando("Preparando el caso");
    const altos=TEMAS.filter(t=>t.alto);
    const tid=altos[Math.floor(Math.random()*altos.length)].id;
    let caso;
    try{ caso=await claude(pedirCaso(tid,4)); }
    catch(e){ caso={concepto:"pleura::criterios de Light",tema:"Enfermedades pleurales",
      presentacion:"Paciente de 60 años con antecedente de neumonía hace una semana, consulta por disnea progresiva, tos seca y dolor torácico pleurítico izquierdo de cinco días. Al examen: expansión torácica disminuida, vibraciones vocales disminuidas, matidez y abolición del murmullo vesicular en base izquierda.",
      diagnostico_final:"Derrame pleural paraneumónico",offline:true}; }
    ctx={caso,historial:[],ronda:0};
    rondaSustentacion();
  };
}
async function rondaSustentacion(){
  const c=ctx.caso;
  if(ctx.ronda===0){
    app.innerHTML=`<div class="label">Sustentación · ${esc(c.tema||"")}</div>
      ${c.offline?`<div class="err">Sin conexión. Caso de la semilla local.</div>`:""}
      <p class="narrative">${esc(c.presentacion)}</p>
      <div class="qhead"><span class="qnum">1</span><p class="qtext">Sustenta tu diagnóstico. Di qué es y con qué lo apoyas.</p></div>
      <textarea id="txt" placeholder="Defiende tu posición."></textarea>
      <div class="actions" id="acc"><button class="go" id="ok">Responder</button></div>
      <div id="hilo"></div>`;
    document.getElementById("txt").focus();
    document.getElementById("ok").onclick=()=>enviarSus("Sustenta tu diagnóstico.",
      [{t:"Nombra un diagnóstico concreto",p:40,o:true},
       {t:"Lo apoya con al menos dos hallazgos del caso",p:40,o:true},
       {t:"Menciona qué lo diferencia de su principal alternativa",p:20,o:false}]);
    return;
  }
}
async function enviarSus(pregunta, rubrica){
  const t=document.getElementById("txt"); const v=t.value.trim(); if(v.length<3) return;
  t.readOnly=true;
  document.getElementById("acc").innerHTML=`<span class="loading">Escuchando tu defensa</span>`;
  const j=await calificarAbierta(pregunta,rubrica,v,ctx.caso.presentacion);
  document.getElementById("acc").remove();
  const hilo=document.getElementById("hilo");
  hilo.insertAdjacentHTML("beforeend",verdictoHTML(j,rubrica));
  ctx.historial.push(`P: ${pregunta}\nR: ${v}`);
  ctx.ronda++;
  registrarIntento({concepto:ctx.caso.concepto,eje:"sustentar",veredicto:j.veredicto,puntaje:j.puntaje,
    pregunta,mia:v,tipo_error:j.tipo_error||"sustentacion",perla:j.perla,
    falto:rubrica.filter((e,i)=>!(j.cumplidos||[])[i]).map(e=>e.t)});

  if(ctx.ronda>=5) return cierreSus();
  hilo.insertAdjacentHTML("beforeend",`<p class="loading" id="ld">La profesora repregunta</p>`);
  let r;
  try{ r=await claude(pedirRepregunta(ctx.caso,ctx.historial.join("\n\n")),600); }
  catch(e){ r={pregunta:"¿Qué hallazgo te haría cambiar de conducta en este paciente?",
    rubrica:[{t:"Nombra un hallazgo concreto y verificable",p:50,o:true},
             {t:"Explica cómo cambiaría la conducta",p:50,o:true}],cerrar:false}; }
  document.getElementById("ld").remove();
  if(r.cerrar) return cierreSus();
  hilo.insertAdjacentHTML("beforeend",`
    <div class="qhead"><span class="qnum">${ctx.ronda+1}</span><p class="qtext">${esc(r.pregunta)}</p></div>
    <textarea id="txt2" placeholder="Responde."></textarea>
    <div class="actions" id="acc2"><button class="go" id="ok2">Responder</button></div>`);
  const t2=document.getElementById("txt2"); t2.id="txt"; t2.focus();
  document.getElementById("acc2").id="acc";
  document.getElementById("ok2").onclick=()=>enviarSus(r.pregunta,r.rubrica);
  t2.scrollIntoView({behavior:"smooth",block:"center"});
}
function cierreSus(){
  const s=S.ejes.sustentar;
  app.insertAdjacentHTML("beforeend",`<hr class="divider">
    <div class="label">Fin de la sustentación</div>
    <p class="lede">Cinco rondas. Lo que no defendiste con un dato del caso quedó registrado como error de sustentación, que se entrena distinto de un error de conocimiento.</p>
    <div class="actions"><button class="go" id="otra">Otra sustentación</button></div>`);
  document.getElementById("otra").onclick=()=>{ ctx={}; ir("sustentacion"); };
}
