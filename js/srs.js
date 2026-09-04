/* ═══════════════════════════════════════════════════════════
   2 · ESTADO Y PERSISTENCIA
═══════════════════════════════════════════════════════════ */
const KEY="entrenamiento:v1";
let S={ intentos:[], errores:[], expuestos:[], dominio:{}, ejes:{}, sesiones:0, ultimoExamen:null };
let vista="inicio", ctx={};

async function cargar(){ try{ const r=await window.storage.get(KEY); if(r&&r.value) S=Object.assign(S,JSON.parse(r.value)); }catch(e){} }
let pend=null;
function guardar(){ clearTimeout(pend); pend=setTimeout(async()=>{
  try{ await window.storage.set(KEY,JSON.stringify(S)); }catch(e){ console.error("No se guardó el progreso",e); } },400); }

/* Repetición espaciada a nivel de concepto, no de tarjeta. */
function estado(cid){ return S.dominio[cid] || (S.dominio[cid]={nivel:0, ease:2.5, intervalo:0, proxima:0, ejes:{}, fallos:0}); }
function vencidos(){ const t=Date.now();
  return Object.entries(S.dominio).filter(([,d])=>d.proxima&&d.proxima<=t).map(([id])=>id); }
function programar(cid, calidad, eje){          // calidad 0-5
  const d=estado(cid);
  if(eje){ const e=d.ejes[eje]||{n:0,suma:0}; e.n++; e.suma+=calidad; d.ejes[eje]=e; }
  if(calidad<3){ d.intervalo=1; d.fallos++; d.ease=Math.max(1.3,d.ease-0.2); }
  else{ d.intervalo = d.intervalo? Math.round(d.intervalo*d.ease) : (calidad>=4?4:1);
        d.ease=Math.min(2.9,d.ease+0.05); }
  const alto=(CONCEPTOS.find(c=>c.id===cid)||{}).alto;
  if(alto) d.intervalo=Math.max(1,Math.round(d.intervalo*0.7));   // lo que ya salió en taller vuelve antes
  d.proxima=Date.now()+d.intervalo*864e5;
  const ejesConEvidencia=Object.keys(d.ejes).length;
  d.nivel = d.fallos>2&&ejesConEvidencia<3 ? 1
          : ejesConEvidencia>=6 ? 4 : ejesConEvidencia>=4 ? 3 : ejesConEvidencia>=2 ? 2 : 1;
  guardar();
}
function registrarIntento(o){
  S.intentos.push({f:Date.now(),...o});
  const e=S.ejes[o.eje]||{n:0,suma:0}; e.n++; e.suma+=(o.puntaje||0); S.ejes[o.eje]=e;
  if(o.veredicto!=="correcto"){
    S.errores.unshift({f:Date.now(),concepto:o.concepto,tema:(o.concepto||"::").split("::")[0],
      pregunta:o.pregunta,mia:o.mia,esperada:o.esperada,tipo:o.tipo_error||"interpretacion",
      falto:o.falto||[],perla:o.perla||"",fallos:1});
    S.errores=S.errores.slice(0,80);
  }
  programar(o.concepto, o.veredicto==="correcto"?5:o.veredicto==="parcial"?3:1, o.eje);
}

/* Motor de novedad: el hash no es del texto, es de la tarea cognitiva. */
function hash(o){ return [o.concepto,o.eje,o.arquetipo,o.contexto,o.tarea].join("|"); }
function yaVisto(h){ return S.expuestos.includes(h); }
function marcar(h){ S.expuestos.push(h); S.expuestos=S.expuestos.slice(-300); guardar(); }
