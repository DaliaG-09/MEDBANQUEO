/* ── ERRORES ────────────────────────────────────────── */
function vErrores(){
  const filtro=ctx.filtro||"todos";
  const tipos=[...new Set(S.errores.map(e=>e.tipo))];
  const lista=filtro==="todos"?S.errores:S.errores.filter(e=>e.tipo===filtro);
  app.innerHTML=`<div class="label">Mis errores</div>
    <h1>Lo que ya fallaste una vez.</h1>
    <p class="lede">Se llena solo. Cada entrada guarda qué te faltó exactamente, no solo que estuvo mal, y programa el concepto para que vuelva con otra cara.</p>
    ${S.errores.length?`<div class="filters" id="f">
      <button data-t="todos" aria-pressed="${filtro==="todos"}">Todos (${S.errores.length})</button>
      ${tipos.map(t=>`<button data-t="${t}" aria-pressed="${filtro===t}">${esc(TIPOS_ERROR[t]||t)}</button>`).join("")}
    </div>`:""}
    ${lista.length?`<ul class="errlist">${lista.map(e=>`<li>
        <div class="cpt">${esc(nom(e.concepto))} · ${esc(TIPOS_ERROR[e.tipo]||e.tipo)}</div>
        <p class="q">${esc(e.pregunta)}</p>
        ${e.falto&&e.falto.length?`<div class="meta">Faltó: ${e.falto.map(esc).join(" · ")}</div>`:""}
        ${e.perla?`<div class="meta" style="margin-top:.25rem">${esc(e.perla)}</div>`:""}
      </li>`).join("")}</ul>
      <div class="actions"><button class="go" id="rep">Repasar mis debilidades</button></div>`
    :`<p class="empty">Todavía no hay nada aquí. Se llena con cada respuesta que no queda completa.</p>`}`;
  app.querySelectorAll("#f button").forEach(b=>b.onclick=()=>{ ctx.filtro=b.dataset.t; vErrores(); });
  const r=document.getElementById("rep");
  if(r) r.onclick=()=>{ ctx={sesion:{tema:"auto",i:0,total:6,ok:0}}; vista="banquear";
    document.querySelectorAll(".nav button").forEach(b=>b.setAttribute("aria-current",b.dataset.v==="banquear"?"page":"false"));
    siguienteBanco(); };
}
