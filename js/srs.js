/* ═══════════════════════════════════════════════════════════
   2 · ESTADO, MEMORIA Y REPETICIÓN ESPACIADA
   El concepto permanece; la forma de evaluarlo cambia.
═══════════════════════════════════════════════════════════ */
const KEY="entrenamiento:v1";
let S={ intentos:[], errores:[], expuestos:[], dominio:{}, ejes:{}, sesiones:0, ultimoExamen:null };
let vista="inicio", ctx={};

async function cargar(){
  try{
    const r=await window.storage.get(KEY);
    if(r&&r.value) S=Object.assign(S,JSON.parse(r.value));
  }catch(e){}
  // Compatibilidad con datos anteriores: nunca se pierde el progreso existente.
  S.intentos ||= [];
  S.errores ||= [];
  S.expuestos ||= [];
  S.dominio ||= {};
  S.ejes ||= {};
  S.sesiones ||= 0;
}

let pend=null;
function guardar(){
  clearTimeout(pend);
  pend=setTimeout(async()=>{
    try{ await window.storage.set(KEY,JSON.stringify(S)); }
    catch(e){ console.error("No se guardó el progreso",e); }
  },400);
}

/* ── Dominio por concepto Y por competencia ───────────────── */
function estado(cid){
  return S.dominio[cid] || (S.dominio[cid]={
    nivel:0,ease:2.5,intervalo:0,proxima:0,ejes:{},fallos:0
  });
}

function puntajeEje(cid,eje){
  const d=S.dominio[cid], e=d&&d.ejes&&d.ejes[eje];
  return e&&e.n ? e.suma/e.n : null;
}

/* El siguiente eje no se elige solo por orden:
   prioriza una competencia nunca evaluada y luego la más débil. */
function ejeDebil(cid){
  const d=S.dominio[cid];
  if(!d) return "recordar";
  const pendientes=EJES.filter(e=>!d.ejes[e]);
  if(pendientes.length) return pendientes[0];

  return EJES
    .map(e=>({e,p:puntajeEje(cid,e)}))
    .sort((a,b)=>a.p-b.p)[0].e;
}

function vencidos(){
  const t=Date.now();
  return Object.entries(S.dominio)
    .filter(([,d])=>d.proxima&&d.proxima<=t)
    .sort((a,b)=>(a[1].proxima||0)-(b[1].proxima||0))
    .map(([id])=>id);
}

function programar(cid,calidad,eje){
  const d=estado(cid);

  if(eje){
    const e=d.ejes[eje]||{n:0,suma:0};
    e.n++;
    e.suma+=calidad;
    d.ejes[eje]=e;
  }

  if(calidad<3){
    d.intervalo=1;
    d.fallos++;
    d.ease=Math.max(1.3,d.ease-0.2);
  }else{
    d.intervalo=d.intervalo
      ? Math.round(d.intervalo*d.ease)
      : (calidad>=4?4:1);
    d.ease=Math.min(2.9,d.ease+0.05);
  }

  const alto=(CONCEPTOS.find(c=>c.id===cid)||{}).alto;
  if(alto) d.intervalo=Math.max(1,Math.round(d.intervalo*0.7));

  d.proxima=Date.now()+d.intervalo*864e5;

  const ejesConEvidencia=Object.keys(d.ejes).length;
  d.nivel=d.fallos>2&&ejesConEvidencia<3 ? 1
    : ejesConEvidencia>=6 ? 4
    : ejesConEvidencia>=4 ? 3
    : ejesConEvidencia>=2 ? 2 : 1;

  guardar();
}

function registrarIntento(o){
  S.intentos.push({f:Date.now(),...o});

  const e=S.ejes[o.eje]||{n:0,suma:0};
  e.n++;
  e.suma+=(o.puntaje||0);
  S.ejes[o.eje]=e;

  if(o.veredicto!=="correcto"){
    S.errores.unshift({
      f:Date.now(),
      concepto:o.concepto,
      tema:(o.concepto||"::").split("::")[0],
      pregunta:o.pregunta,
      mia:o.mia,
      esperada:o.esperada,
      tipo:o.tipo_error||"interpretacion",
      falto:o.falto||[],
      perla:o.perla||"",
      fallos:1,
      estado:"activo"
    });
    // Los errores no se eliminan por llegar a cierto número.
    // Se conservan para construir el historial de debilidades.
  }

  programar(
    o.concepto,
    o.veredicto==="correcto"?5:o.veredicto==="parcial"?3:1,
    o.eje
  );
}

/* ── Motor de novedad ──────────────────────────────────────
   No considera "nueva" una pregunta solo porque cambió el texto.
   La unidad de novedad es: concepto + competencia + arquetipo +
   contexto + tarea cognitiva. */
function hash(o){
  return [o.concepto,o.eje,o.arquetipo,o.contexto,o.tarea]
    .map(x=>String(x??"").trim().toLowerCase())
    .join("|");
}
function yaVisto(h){ return S.expuestos.includes(h); }
function marcar(h){
  if(!S.expuestos.includes(h)) S.expuestos.push(h);
  S.expuestos=S.expuestos.slice(-500);
  guardar();
}

/* Qué debe volver: debilidad antes que simple aleatoriedad. */
function actualizarEstadoError(error, veredicto){
  if(!error) return;
  if(veredicto==="correcto"){
    error.fallos=Math.max(0,(error.fallos||1)-1);
    error.estado=error.fallos===0?"resuelto":"recuperacion";
    error.ultimo_refuerzo=Date.now();
  }else{
    error.fallos=(error.fallos||0)+1;
    error.estado=error.fallos>=3?"activo":"recuperacion";
  }
}
function erroresActivos(){
  return S.errores.filter(e=>e.estado!=="resuelto")
    .sort((a,b)=>(b.fallos||0)-(a.fallos||0) || (b.f||0)-(a.f||0));
}
function registrarRefuerzoError(concepto, correcto){
  const e=S.errores.find(x=>x.concepto===concepto && x.estado!=="resuelto");
  if(e) actualizarEstadoError(e, correcto?"correcto":"incorrecto");
  guardar();
}

function candidatosDebiles(){
  return CONCEPTOS
    .map(c=>({c,p:S.dominio[c.id]?S.dominio[c.id].nivel:0}))
    .sort((a,b)=>a.p-b.p)
    .map(x=>x.c.id);
}
