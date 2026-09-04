/* ── PROGRESO ───────────────────────────────────────── */
function vProgreso(){
  const n=S.intentos.length;
  const ok=S.intentos.filter(i=>i.veredicto==="correcto").length;
  const conEstado=Object.keys(S.dominio).length;
  const listo=readiness();
  app.innerHTML=`<div class="label">Progreso</div>
    <h1>Qué tipo de tarea te cuesta.</h1>
    <div class="stats">
      <div class="stat"><b>${n}</b><span>respuestas</span></div>
      <div class="stat"><b>${n?Math.round(ok/n*100):0}%</b><span>correctas completas</span></div>
      <div class="stat"><b>${conEstado}/${CONCEPTOS.length}</b><span>conceptos tocados</span></div>
      <div class="stat"><b>${S.errores.length}</b><span>errores vivos</span></div>
    </div>
    <div class="readiness" style="--rc:${listo.color}"><b>${listo.etiqueta}</b> — ${listo.texto}</div>

    <h2>Por competencia</h2>
    <div class="axes">${EJES.map(e=>{
      const d=S.ejes[e]; const v=d?Math.round(d.suma/d.n):0;
      return `<div class="axis"><span class="nm">${e}</span><span class="bar"><i style="width:${d?v:0}%"></i></span><span class="n">${d?v:"—"}</span></div>`;
    }).join("")}</div>
    <p class="hint" style="max-width:34rem;margin-top:.8rem">Recordar y aplicar se miden por separado a propósito. Saber la fórmula y saber cuándo el número cambia la conducta fallan de manera independiente, y tu examen pregunta las dos cosas.</p>

    <h2>Por tema</h2>
    <div class="heat">${TEMAS.map(t=>{
      const cs=CONCEPTOS.filter(c=>c.tema===t.id);
      const niv=cs.map(c=>(S.dominio[c.id]||{}).nivel||0);
      const prom=Math.round(niv.reduce((a,b)=>a+b,0)/cs.length);
      return `<span data-n="${prom}" title="${esc(NIVELES[prom])}">${esc(t.nombre)}</span>`;
    }).join("")}</div>
    <p class="hint" style="max-width:34rem">Un tema solo sube de nivel cuando sus conceptos acumulan evidencia en varios ejes. Una opción múltiple acertada mueve un eje, no el concepto entero.</p>`;
}
function readiness(){
  const n=S.intentos.length;
  if(n<15) return {etiqueta:"Sin datos suficientes",color:"var(--graphite)",
    texto:"con menos de quince respuestas cualquier estimación sería ruido. Sigue entrenando y esto se activa solo."};
  const rec=S.intentos.slice(-25);
  const p=rec.reduce((s,i)=>s+(i.puntaje||0),0)/rec.length;
  const aplic=S.ejes.aplicar?S.ejes.aplicar.suma/S.ejes.aplicar.n:0;
  const errRec=S.errores.filter(e=>Date.now()-e.f<7*864e5).length;
  if(p>=80&&aplic>=70&&errRec<8) return {etiqueta:"Fuerte",color:"var(--ok)",
    texto:"rendimiento reciente sostenido y aplicación clínica sólida. Sube la dificultad y practica integrados."};
  if(p>=60) return {etiqueta:"Necesita refuerzo",color:"var(--partial)",
    texto:"recuerdas, pero la aplicación clínica todavía no acompaña. Prioriza casos completos por encima de banquear."};
  return {etiqueta:"En riesgo",color:"var(--bad)",
    texto:"el rendimiento reciente está por debajo del umbral. Empieza por el banco de errores antes de material nuevo."};
}

/* arranque */
