/* ── BANQUEAR ───────────────────────────────────────── */
async function vBanquear(){
  if(!ctx.sesion){
    app.innerHTML=`<div class="label">Banquear</div>
      <h1>Preguntas sueltas, un concepto a la vez.</h1>
      <p class="lede">Mezcla de tipos: opción múltiple, respuesta múltiple, verdadero o falso, cálculo, respuesta corta y respuesta abierta con justificación. El sistema elige el concepto según lo que fallaste y lo que toca repasar.</p>
      <div class="filters" id="temaSel">
        <button data-t="auto" aria-pressed="true">Automático</button>
        ${TEMAS.map(t=>`<button data-t="${t.id}" aria-pressed="false">${esc(t.nombre)}</button>`).join("")}
      </div>
      <div class="actions"><button class="go" id="ir">Empezar sesión de 6</button></div>`;
    let sel="auto";
    app.querySelectorAll("#temaSel button").forEach(b=>b.onclick=()=>{ sel=b.dataset.t;
      app.querySelectorAll("#temaSel button").forEach(x=>x.setAttribute("aria-pressed",x===b)); });
    document.getElementById("ir").onclick=()=>{ ctx={sesion:{tema:sel,i:0,total:6,ok:0}}; siguienteBanco(); };
    return;
  }
  siguienteBanco();
}
function elegirConcepto(temaSel){
  const due=vencidos();
  if(due.length && temaSel==="auto") return due[Math.floor(Math.random()*due.length)];
  const errCpt=S.errores.map(e=>e.concepto).filter(Boolean);
  if(errCpt.length && temaSel==="auto" && Math.random()<0.45) return errCpt[Math.floor(Math.random()*Math.min(6,errCpt.length))];
  const pool=temaSel==="auto"?CONCEPTOS:CONCEPTOS.filter(c=>c.tema===temaSel);
  const nuevos=pool.filter(c=>!S.dominio[c.id]);
  const p=(nuevos.length?nuevos:pool);
  return p[Math.floor(Math.random()*p.length)].id;
}
function siguienteEje(cid){
  return ejeDebil(cid);
}
async function siguienteBanco(){
  const s=ctx.sesion;
  if(s.i>=s.total) return cierreBanco();

  cargando("Preparando una pregunta nueva");

  const cid=elegirConcepto(s.tema);
  const eje=siguienteEje(cid);
  const d=S.dominio[cid];
  const dif=Math.min(5,Math.max(1,(d?d.nivel+1:2)));
  const tipos=["opcion_multiple","abierta","calculo","respuesta_multiple","verdadero_falso","respuesta_corta"];
  const tipo=eje==="calcular"
    ?"calculo"
    :(eje==="sustentar"||eje==="integrar")
      ?"abierta"
      :tipos[Math.floor(Math.random()*tipos.length)];

  let q, firma;
  try{
    // Primer intento.
    q=await claude(pedirPregunta(cid,eje,dif,tipo));
    q.concepto=cid;
    q.eje=eje;
    firma=hash({
      concepto:q.concepto,eje:q.eje,
      tarea:q.tarea||q.tipo,arquetipo:"",
      contexto:"banco"
    });

    // Si la tarea cognitiva ya apareció, pedimos otra variante.
    // El concepto puede repetirse; la forma de razonarlo no.
    if(yaVisto(firma)){
      q=await claude(pedirPregunta(cid,eje,Math.min(5,dif+1),tipo)+
        "\nIMPORTANTE: la tarea cognitiva generada ya fue usada. Cambia el ángulo de razonamiento, el contexto clínico y la tarea concreta. NO reformules la misma pregunta.");
      q.concepto=cid;
      q.eje=eje;
      firma=hash({
        concepto:q.concepto,eje:q.eje,
        tarea:q.tarea||q.tipo,arquetipo:"",
        contexto:"banco"
      });
    }
  }catch(e){
    q=Object.assign({},SEMILLA_BANCO[Math.floor(Math.random()*SEMILLA_BANCO.length)]);
    q.offline=true;
    firma=hash({
      concepto:q.concepto,eje:q.eje||"recordar",
      tarea:q.tarea||q.tipo,arquetipo:"",
      contexto:"banco"
    });
  }

  marcar(firma);
  pintarPregunta(q);
}
function pintarPregunta(q, opts={}){
  const s=ctx.sesion||{i:0,total:1};
  app.innerHTML=`
    ${opts.examen?"":`<div class="examchrome"><span>Banquear</span><span>Pregunta <b>${s.i+1}</b> de <b>${s.total}</b></span><span>${esc(temaDe(q.concepto))}</span></div>`}
    ${q.offline?`<div class="err">Sin conexión con el generador. Estás viendo una pregunta de la semilla local.</div>`:""}
    <div class="qhead"><span class="qnum">${s.i+1}</span><p class="qtext">${esc(q.enunciado)}</p></div>
    <div id="campo"></div>
    <div class="actions" id="acc"><button class="go" id="resp">Responder</button>
      ${opts.examen?"":`<span class="hint">${esc(q.eje||"")}</span>`}</div>
    <div id="fb"></div>`;
  const campo=document.getElementById("campo");
  let seleccion=(q.tipo==="respuesta_multiple")?[]:null;

  if(q.tipo==="opcion_multiple"||q.tipo==="respuesta_multiple"){
    campo.innerHTML=`<ul class="choices">${q.opciones.map((o,i)=>
      `<li><button class="choice" data-i="${i}" aria-pressed="false"><span class="k">${"abcdef"[i]}</span><span>${esc(o)}</span></button></li>`).join("")}</ul>`;
    campo.querySelectorAll(".choice").forEach(b=>b.onclick=()=>{
      const i=+b.dataset.i;
      if(q.tipo==="opcion_multiple"){ seleccion=i;
        campo.querySelectorAll(".choice").forEach(x=>x.setAttribute("aria-pressed",x===b)); }
      else{ seleccion.includes(i)?seleccion.splice(seleccion.indexOf(i),1):seleccion.push(i);
        b.setAttribute("aria-pressed",seleccion.includes(i)); }
    });
  } else if(q.tipo==="verdadero_falso"){
    campo.innerHTML=`<ul class="choices">${["Verdadero","Falso"].map((o,i)=>
      `<li><button class="choice" data-i="${i}" aria-pressed="false"><span class="k">${"vf"[i]}</span><span>${o}</span></button></li>`).join("")}</ul>`;
    campo.querySelectorAll(".choice").forEach(b=>b.onclick=()=>{ seleccion=+b.dataset.i===0;
      campo.querySelectorAll(".choice").forEach(x=>x.setAttribute("aria-pressed",x===b)); });
  } else if(q.tipo==="respuesta_corta"||q.tipo==="calculo"){
    campo.innerHTML=`<input type="text" id="txt" placeholder="Tu respuesta" aria-label="Respuesta">
      ${q.formula?`<p class="hint" style="margin-top:.5rem">Escribe solo el resultado.</p>`:""}`;
  } else {
    campo.innerHTML=`<textarea id="txt" placeholder="Escribe tu respuesta como la escribirías en el examen." aria-label="Respuesta"></textarea>`;
  }
  const inp=campo.querySelector("#txt"); if(inp) inp.focus();
  if(inp&&inp.tagName==="TEXTAREA") inp.addEventListener("keydown",e=>{ if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)) responder(); });

  document.getElementById("resp").onclick=responder;

  async function responder(){
    const acc=document.getElementById("acc");
    const fb=document.getElementById("fb");
    let j, rubrica=null, mia="";

    if(q.tipo==="opcion_multiple"){
      if(seleccion==null) return;
      mia=q.opciones[seleccion];
      const bien=seleccion===q.correcta;
      campo.querySelectorAll(".choice").forEach((b,i)=>{
        if(i===q.correcta) b.classList.add("right");
        else if(i===seleccion) b.classList.add("wrong");
        b.disabled=true;
      });
      j={veredicto:bien?"correcto":"incorrecto",puntaje:bien?100:0,porque:q.porque,perla:q.perla,trampa:q.trampa,pista:q.pista,tipo_error:bien?null:"confusion"};
    } else if(q.tipo==="respuesta_multiple"){
      if(!seleccion.length) return;
      mia=seleccion.map(i=>q.opciones[i]).join("; ");
      const cor=q.correctas||[];
      const aciertos=seleccion.filter(i=>cor.includes(i)).length;
      const falsos=seleccion.filter(i=>!cor.includes(i)).length;
      const p=Math.max(0,Math.round((aciertos/cor.length)*100 - falsos*25));
      campo.querySelectorAll(".choice").forEach((b,i)=>{
        if(cor.includes(i)) b.classList.add("right");
        else if(seleccion.includes(i)) b.classList.add("wrong");
        b.disabled=true;
      });
      j={veredicto:p>=85?"correcto":p>0?"parcial":"incorrecto",puntaje:p,porque:q.porque,perla:q.perla,tipo_error:p>=85?null:"omision"};
    } else if(q.tipo==="verdadero_falso"){
      if(seleccion==null) return;
      mia=seleccion?"Verdadero":"Falso";
      const bien=seleccion===q.correcta;
      campo.querySelectorAll(".choice").forEach((b,i)=>{
        const val=i===0; if(val===q.correcta) b.classList.add("right");
        else if(val===seleccion) b.classList.add("wrong"); b.disabled=true; });
      j={veredicto:bien?"correcto":"incorrecto",puntaje:bien?100:0,porque:q.porque,perla:q.perla,tipo_error:bien?null:"confusion"};
    } else if(q.tipo==="respuesta_corta"||q.tipo==="calculo"){
      mia=inp.value.trim(); if(!mia) return; inp.readOnly=true;
      const num=parseFloat(String(mia).replace(",",".")), esp=parseFloat(String(q.respuesta).replace(",","."));
      let bien;
      if(!isNaN(num)&&!isNaN(esp)) bien=Math.abs(num-esp)<=(q.tolerancia||0)+1e-9;
      else bien=mia.toLowerCase().includes(String(q.respuesta).toLowerCase().slice(0,6));
      j={veredicto:bien?"correcto":"incorrecto",puntaje:bien?100:0,
         porque:(bien?"":`El valor esperado es ${q.respuesta}. `)+(q.porque||""),perla:q.perla,
         tipo_error:bien?null:"calculo"};
      if(q.formula) j.pista=q.formula;
    } else {
      mia=inp.value.trim(); if(mia.length<3) return; inp.readOnly=true;
      acc.innerHTML=`<span class="loading">Calificando</span>`;
      rubrica=q.rubrica||[{t:"Responde el fondo de la pregunta",p:100,o:true}];
      j=await calificarAbierta(q.enunciado,rubrica,mia,null);
    }

    acc.remove();
    fb.innerHTML=verdictoHTML(j,rubrica);
    registrarIntento({concepto:q.concepto,eje:q.eje||"recordar",veredicto:j.veredicto,puntaje:j.puntaje,
      pregunta:q.enunciado,mia,esperada:q.respuesta||(q.opciones?q.opciones[q.correcta]:""),
      tipo_error:j.tipo_error,perla:j.perla||q.perla,
      falto:rubrica?rubrica.filter((e,i)=>!(j.cumplidos||[])[i]).map(e=>e.t):[]});
    if(ctx.sesion&&j.veredicto==="correcto") ctx.sesion.ok++;

    const nx=document.createElement("div"); nx.className="actions";
    nx.innerHTML=`<button class="go" id="sig">${(ctx.sesion&&ctx.sesion.i>=ctx.sesion.total-1)?"Ver el cierre":"Siguiente"}</button>`;
    fb.appendChild(nx);
    nx.querySelector("#sig").onclick=()=>{ if(ctx.sesion){ctx.sesion.i++;} siguienteBanco(); };
  }
}
function cierreBanco(){
  const s=ctx.sesion;
  app.innerHTML=`<div class="label">Cierre de sesión</div>
    <h1>${s.ok} de ${s.total}.</h1>
    <p class="lede">${s.ok===s.total?"Sesión limpia. Los conceptos vuelven más adelante, con otra tarea encima."
      :"Lo que falló ya está en el banco de errores y vuelve programado, con otro paciente y otra pregunta."}</p>
    <div class="actions"><button class="go" id="otra">Otra sesión</button>
      <button class="ghost" id="err">Ver mis errores</button></div>`;
  document.getElementById("otra").onclick=()=>{ ctx={}; vBanquear(); };
  document.getElementById("err").onclick=()=>ir("errores");
}
