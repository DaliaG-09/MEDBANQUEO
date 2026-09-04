/* ── INICIO ─────────────────────────────────────────── */
function vInicio(){
  const due=vencidos(), err=S.errores.length, n=S.intentos.length;
  const flojo=[...CONCEPTOS].map(c=>({c,d:S.dominio[c.id]})).filter(x=>x.d&&x.d.fallos>0)
    .sort((a,b)=>b.d.fallos-a.d.fallos).slice(0,3);
  app.innerHTML=`
    <div class="label">Hoy</div>
    <h1>${n===0?"Empieza por donde el curso ya te evaluó."
                :due.length?`${due.length} concepto${due.length===1?"":"s"} te toca${due.length===1?"":"n"} hoy.`
                :"Nada vencido. Buen momento para un caso nuevo."}</h1>
    <p class="lede">${n===0
      ? "Todavía no hay historial, así que el sistema no puede decidir por ti. El camino más corto es un caso clínico completo: te va a mostrar en ocho etapas dónde se te rompe el razonamiento."
      : "El plan de abajo se arma solo, con lo que fallaste, lo que toca repasar y lo que el curso pregunta más."}</p>

    <div class="today">
      ${fila(4,"Errores previos","conceptos que ya fallaste alguna vez", err?"banquear":null, err?"Practicar":"Sin errores aún")}
      ${fila(4,"Repetición espaciada", due.length?`${due.length} vencido${due.length===1?"":"s"}`:"nada vencido hoy", due.length?"banquear":null, due.length?"Repasar":"Al día")}
      ${fila(2,"Casos clínicos","razonamiento completo en ocho etapas","casos","Abrir un caso")}
      ${fila(2,"Escalas y cálculos","CURB-65, Light, PaFiO₂, compensación","banquear","Calcular")}
      ${fila(1,"Sustentación","defender tu diagnóstico frente a repreguntas","sustentacion","Sustentar")}
    </div>

    ${flojo.length?`<h2>Tus puntos débiles</h2>
      <div class="heat">${flojo.map(x=>`<span data-n="1">${esc(x.c.nombre)}</span>`).join("")}</div>`:""}

    <h2>Acceso rápido</h2>
    <div class="quick">
      <button class="ghost" data-g="casos">Casos clínicos</button>
      <button class="ghost" data-g="banquear">Banquear</button>
      <button class="ghost" data-g="flashcards">Flashcards</button>
      <button class="ghost" data-g="examenes">Simular examen</button>
      <button class="ghost" data-g="errores">Mis errores</button>
    </div>`;
  app.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>ir(b.dataset.go));
  app.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>ir(b.dataset.g));
}
function fila(n,t,s,go,lbl){
  return `<div class="trow"><span class="n">${n}</span><span class="d">${t}<small>${s}</small></span>
    ${go?`<button data-go="${go}">${lbl}</button>`:`<span class="hint">${lbl}</span>`}</div>`;
}
