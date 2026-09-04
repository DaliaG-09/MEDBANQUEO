/* ═══════════════════════════════════════════════════════════
   4 · UI
═══════════════════════════════════════════════════════════ */
const app=document.getElementById("app");
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const nom=cid=>(CONCEPTOS.find(c=>c.id===cid)||{}).nombre||String(cid).split("::")[1]||cid;
const temaDe=cid=>(TEMAS.find(t=>t.id===String(cid).split("::")[0])||{}).nombre||"";

document.querySelectorAll(".nav button").forEach(b=>b.onclick=()=>ir(b.dataset.v));
function ir(v){ vista=v; ctx={};
  document.querySelectorAll(".nav button").forEach(b=>b.setAttribute("aria-current", b.dataset.v===v?"page":"false"));
  window.scrollTo({top:0}); ({inicio:vInicio,banquear:vBanquear,casos:vCasos,imagenes:vImagenes,flashcards:vFlash,
    sustentacion:vSustentacion,errores:vErrores,examenes:vExamenes,progreso:vProgreso})[v]();
}
function cargando(msg){ app.innerHTML=`<p class="loading">${esc(msg)}</p>`; }

/* ── veredicto compartido ───────────────────────────── */
function verdictoHTML(j,rubrica){
  const map={correcto:["v-ok","Correcto"],parcial:["v-partial","Parcialmente correcto"],
             incorrecto:["v-bad","Incorrecto"],inseguro:["v-unsafe","Respuesta insegura"]};
  const [cls,lbl]=map[j.veredicto]||map.incorrecto;
  return `<div class="verdict ${cls}">
    <div class="tag">${lbl}${j.puntaje!=null?` <em>${j.puntaje}/100</em>`:""}</div>
    ${j.riesgo?`<div class="unsafebox"><p>${esc(j.riesgo)}</p></div>`:""}
    ${rubrica?`<ul class="rubric">${rubrica.map((e,i)=>`<li class="${j.cumplidos&&j.cumplidos[i]?"hit":"miss"}" style="animation-delay:${i*70}ms"><span class="mk">${j.cumplidos&&j.cumplidos[i]?"✓":"—"}</span><span>${esc(e.t)}</span></li>`).join("")}</ul>`:""}
    ${j.porque?`<div class="block"><h4>Por qué</h4><p>${esc(j.porque)}</p></div>`:""}
    ${j.pista?`<div class="block"><h4>El dato que debía guiarte</h4><p>${esc(j.pista)}</p></div>`:""}
    ${j.perla?`<div class="block pearl"><h4>Perla</h4><p>${esc(j.perla)}</p></div>`:""}
    ${j.trampa?`<div class="block"><h4>Trampa de examen</h4><p>${esc(j.trampa)}</p></div>`:""}
  </div>`;
}
function stripHTML(aga){ if(!aga) return "";
  return `<div class="strip"><div class="hd">análisis de gases arteriales</div>${
    Object.entries(aga).map(([k,v])=>`<div class="row"><span>${esc(k)}</span>${esc(v)}</div>`).join("")}</div>`; }

async function calificarAbierta(pregunta,rubrica,texto,contexto){
  try{ return await claude(pedirCalificacion(pregunta,rubrica,texto,contexto)); }
  catch(e){
    const t=texto.toLowerCase();
    const cumplidos=rubrica.map(el=>{ const k=(el.t.toLowerCase().match(/[a-záéíóúñ0-9]{5,}/g)||[]);
      return k.filter(w=>t.includes(w.slice(0,6))).length >= Math.max(1,Math.ceil(k.length*0.3)); });
    const p=rubrica.reduce((s,el,i)=>s+(cumplidos[i]?el.p:0),0);
    const ob=rubrica.every((el,i)=>!el.o||cumplidos[i]);
    return {cumplidos,puntaje:p,veredicto:ob&&p>=85?"correcto":(cumplidos.some(Boolean)?"parcial":"incorrecto"),
      tipo_error:ob?null:"interpretacion",
      porque:"Sin conexión con el evaluador. Esta calificación compara términos, no significado: contrasta tú misma tu respuesta con los elementos de arriba.",pista:"",perla:"",riesgo:null};
  }
}
