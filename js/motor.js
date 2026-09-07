/* ═══════════════════════════════════════════════════════════
   3 · MOTOR DE GENERACIÓN Y EVALUACIÓN
═══════════════════════════════════════════════════════════ */
async function modeloIA(input, max){
  const r=await fetch(CONFIG.endpoint,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:CONFIG.modelo,max_tokens:max||1200,input})
  });
  const d=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(d.error||("HTTP "+r.status));
  const txt=String(d.text||"").trim();
  if(!txt) throw new Error("El generador no devolvió contenido");
  const limpio=txt.replace(/^\`\`\`json\s*/,"").replace(/\s*\`\`\`$/,"").trim();
  try{return JSON.parse(limpio);}
  catch(e){
    const ini=limpio.indexOf("{"), fin=limpio.lastIndexOf("}");
    if(ini>=0&&fin>ini) return JSON.parse(limpio.slice(ini,fin+1));
    throw new Error("El generador devolvió un formato no válido");
  }
}

/* ── Base de conocimiento del curso ──────────────────────────
   Se carga una vez y se inyecta en cada prompt. Sin esto el motor
   genera desde conocimiento médico general, que no es lo que te
   van a preguntar. Ver datos/conocimiento-neumo.json */
let CURSO = null;
async function cargarCurso(){
  if(CURSO) return CURSO;
  try{ CURSO = await (await fetch("datos/conocimiento-neumo.json")).json(); }
  catch(e){ CURSO = {}; console.warn("Sin base de conocimiento del curso:", e); }
  return CURSO;
}
/* Devuelve el material real del curso para un concepto, listo para el prompt. */
function materialDelCurso(conceptoId){
  if(!CURSO) return "";
  const temaId = String(conceptoId).split("::")[0];
  const t = CURSO[temaId];
  if(!t) return "";
  const nombre = String(conceptoId).split("::")[1] || "";
  const c = (t.conceptos||[]).find(x =>
    x.id === conceptoId ||
    x.nombre.toLowerCase().includes(nombre.toLowerCase().slice(0,14)) ||
    nombre.toLowerCase().includes(x.nombre.toLowerCase().slice(0,14)));
  const partes = [];
  partes.push(`MATERIAL REAL DEL CURSO (fuente: ${t.fuente.archivo}, semana ${t.fuente.semana}).`);
  partes.push("Esta es la fuente de verdad. La pregunta debe evaluar ESTO, con estas cifras y estos énfasis, no conocimiento general.");
  if(c){
    partes.push(`\nConcepto: ${c.nombre}\n${c.contenido}`);
    if(c.cifras)   partes.push("Cifras del curso: "+JSON.stringify(c.cifras));
    if(c.pasos)    partes.push("Pasos: "+c.pasos.join(" | "));
    if(c.niveles)  partes.push("Niveles: "+c.niveles.join(" | "));
    if(c.causas)   partes.push("Causas: "+JSON.stringify(c.causas));
    if(c.detalle)  partes.push("Detalle: "+JSON.stringify(c.detalle));
    if(c.tabla_diferencial) partes.push("Tabla diferencial: "+JSON.stringify(c.tabla_diferencial));
    if(c.mnemotecnia) partes.push("Mnemotecnia del curso: "+JSON.stringify(c.mnemotecnia));
    if(c.enfasis_docente) partes.push("Lo que la profesora enfatiza: "+c.enfasis_docente);
    if(c.trampa)   partes.push("Trampa que el curso usa: "+c.trampa);
  } else {
    partes.push("\nNo hay ficha de este concepto todavía. Usa los conceptos del tema como referencia de nivel y estilo: "
      + (t.conceptos||[]).map(x=>x.nombre).join("; "));
  }
  const casos = t.casos_del_ppt||[];
  if(casos.length) partes.push("\nESTRUCTURA de los casos que usa esta clase (imítala, no la copies): "
    + casos.map(x=>x.estructura_a_replicar).join(" || "));
  const disc = (t.discrepancias_detectadas||[]).filter(d=>d.estado==="sin confirmar");
  if(disc.length) partes.push("\nNO preguntes sobre estos puntos, están sin confirmar con la docente: "
    + disc.map(d=>d.punto).join("; "));
  return partes.join("\n");
}

const CONTEXTO_CURSO = `Contexto obligatorio. Eres el docente de Medicina Interna I de una facultad peruana de medicina humana, módulo de Neumología. Conoces el estilo real de evaluación del curso:
- Los casos siempre traen: edad, sexo, ocupación o procedencia, antecedentes, tiempo de enfermedad explícito, síntomas en orden cronológico, funciones vitales completas con saturación y si es aire ambiente, y semiología torácica por los cuatro pasos.
- Los antecedentes nunca son decorativos: algunos deben funcionar como pistas, pero otros pueden ser distractores plausibles.
- La semiología se da como síndrome completo, no como hallazgo suelto.
- Cada caso debe contener al menos un dato discriminante que permita separar el diagnóstico principal de 1 a 2 alternativas plausibles.
- No conviertas el caso en una adivinanza: la estudiante debe poder justificar la hipótesis con los datos disponibles.
- Los verbos de mando del curso son: sustente, justifique, describa, calcule, interprete, mencione, desarrolle.
- Escribe en español de Perú, tono clínico, sin emojis, sin adornos.
- Nunca inventes datos clínicos falsos ni cifras imposibles. Los valores de laboratorio y gasometría deben ser internamente coherentes.`;

function pedirPregunta(cpt, eje, dificultad, tipoPreferido){
  const c=CONCEPTOS.find(x=>x.id===cpt)||CONCEPTOS[0];
  const tema=TEMAS.find(t=>t.id===c.tema);
  const previos=S.expuestos.filter(h=>h.startsWith(cpt)).slice(-6).join(" / ")||"ninguna";
  const material = materialDelCurso(cpt);
  return `${CONTEXTO_CURSO}

${material}

Genera UNA pregunta nueva de banco.
Tema: ${tema.nombre}
Concepto: ${c.nombre}
Eje cognitivo que debe entrenar: ${eje}
Dificultad: ${dificultad} de 5
Tipo preferido: ${tipoPreferido}
Tareas ya usadas con esta estudiante para este concepto (usa una distinta): ${previos}

La dificultad no se sube agregando datos raros, se sube con diagnósticos que compiten, pistas menos evidentes o decisiones de manejo.

Devuelve SOLO este JSON, sin backticks. Usa las claves del tipo que corresponda:
opcion_multiple: {"tipo":"opcion_multiple","enunciado":"","opciones":["","","",""],"correcta":0,"porque":"","pista":"","perla":"","trampa":"","tarea":"etiqueta corta de la tarea cognitiva"}
respuesta_multiple: {"tipo":"respuesta_multiple","enunciado":"","opciones":["","","",""],"correctas":[0,2],"porque":"","perla":"","tarea":""}
verdadero_falso: {"tipo":"verdadero_falso","enunciado":"","correcta":true,"porque":"","perla":"","tarea":""}
respuesta_corta: {"tipo":"respuesta_corta","enunciado":"","respuesta":"","tolerancia":0,"porque":"","perla":"","tarea":""}
calculo: {"tipo":"calculo","enunciado":"","respuesta":"","tolerancia":2,"formula":"","porque":"","perla":"","tarea":""}
abierta: {"tipo":"abierta","enunciado":"","verbo":"Sustente","rubrica":[{"t":"","p":40,"o":true}],"pista":"","perla":"","tarea":""}

En las de opción múltiple los distractores deben ser plausibles y reflejar errores reales de razonamiento, no opciones absurdas. En las abiertas la rúbrica descompone la respuesta ideal en 2 a 4 elementos calificables cuyos pesos suman 100.`;
}

function pedirCaso(temaId, dificultad, placa){
  const tema=TEMAS.find(t=>t.id===temaId)||TEMAS[3];
  const previos=S.expuestos.filter(h=>h.includes("caso|")).slice(-6).join(" / ")||"ninguno";
  return `${CONTEXTO_CURSO}

Genera la CABECERA de un caso clínico progresivo nuevo.
Tema principal: ${tema.nombre}
Dificultad: ${dificultad} de 5
Casos ya usados (no repitas el arquetipo de paciente): ${previos}

El caso debe entrenar razonamiento, no memoria textual:
- Incluye 1 a 2 diagnósticos diferenciales plausibles.
- Incluye datos que permitan defender por qué el diagnóstico principal es más probable.
- Incluye al menos una pista clínica útil y una posible trampa de interpretación.
- No repitas literalmente un caso del material del curso: usa su estructura y estilo, pero crea una situación clínica nueva.
- La dificultad debe aumentar por razonamiento y decisión, no por datos innecesariamente raros.
${placa?`
OBLIGATORIO: en la etapa 4 se le mostrará a la estudiante una radiografía de tórax real que corresponde a ${placa.meta.dx}${placa.item.nota?" ("+placa.item.nota+")":""}. El caso debe construirse de modo que ese sea el diagnóstico al que llega, y la clínica y la semiología deben ser coherentes con ese hallazgo radiológico. No menciones la radiografía en la presentación inicial.`:""}

La etapa 1 solo muestra la presentación inicial: motivo de consulta, antecedentes y tiempo de enfermedad. No reveles funciones vitales, examen físico, laboratorio ni imágenes todavía.

Devuelve SOLO este JSON, sin backticks:
{"concepto":"nombre del concepto central","arquetipo":"descripción breve del paciente","tema":"${tema.nombre}","presentacion":"texto de la etapa 1","diagnostico_final":"","conceptos_involucrados":["",""]}`;
}

function pedirEtapa(caso, n, hipotesis, previas){
  const e=ETAPAS[n-1];
  return `${CONTEXTO_CURSO}

Caso en curso. Diagnóstico final, que la estudiante todavía no conoce: ${caso.diagnostico_final}
Presentación inicial: ${caso.presentacion}
Hipótesis que ella comprometió en la etapa 1: "${hipotesis}"
Respuestas previas: ${previas||"ninguna"}

Genera la ETAPA ${n} de ${ETAPAS.length}: ${e.t}. Lo que debe pedir: ${e.pide}.
Revela solo los datos que corresponden a esta etapa, redactados en el estilo del curso.
- No reveles de forma directa el diagnóstico final antes de la etapa 7.
- La pregunta debe depender de los datos acumulados, no ser una pregunta aislada de teoría.
- Si la estudiante cometió un error previo, formula la etapa actual de manera que pueda corregirlo mediante razonamiento, sin regalarle la respuesta.
- Incluye en "perla" una enseñanza transferible a otros casos y en "pista" solo una ayuda posterior a la respuesta. Si la etapa no aplica al caso (por ejemplo una escala inexistente para este cuadro), sustitúyela por el cálculo o la escala que sí corresponda y dilo en los datos.

Devuelve SOLO este JSON, sin backticks:
{"datos":"texto de los datos nuevos de esta etapa","aga":null,"pregunta":"","verbo":"","eje":"interpretar","rubrica":[{"t":"","p":40,"o":true}],"pista":"","perla":""}
Si esta etapa incluye gasometría, pon en "aga" un objeto como {"pH":"7.26","PaCO₂":"68 mmHg","PaO₂":"50 mmHg","HCO₃⁻":"30 mEq/L","FiO₂":"28 %"}. Si no, deja null. La rúbrica tiene 2 a 4 elementos con pesos que suman 100.`;
}

function pedirCalificacion(pregunta, rubrica, resp, contexto){
  return `Eres un docente exigente de Medicina Interna calificando una respuesta escrita a mano.

${contexto?"CONTEXTO DEL CASO:\n"+contexto+"\n":""}
PREGUNTA: ${pregunta}

ELEMENTOS CALIFICABLES:
${rubrica.map((e,i)=>`${i}. [${e.p} pts${e.o?", obligatorio":""}] ${e.t}`).join("\n")}

RESPUESTA DE LA ESTUDIANTE:
"""${resp}"""

Reglas de calificación:
- Evalúa el significado, no la coincidencia literal. "La ingresaría y empezaría antibiótico empírico" equivale a "requiere manejo hospitalario y antibiótico empírico".
- Un elemento se cumple si la idea está presente aunque esté dicha con otras palabras.
- Un número correcto sin justificación no cumple los elementos de justificación.
- Reconoce alternativas médicamente aceptables aunque no sean la respuesta modelo.
- "inseguro" tiene prioridad sobre todo: úsalo si la respuesta contiene algo que dañaría al paciente o si omite un riesgo urgente, aunque el resto sea correcto.
- veredicto: "correcto" si cumple todos los obligatorios y suma 85 o más; "parcial" si cumple alguno; "incorrecto" si falla todos los obligatorios.
- tipo_error si no es correcto: memoria, confusion, aplicacion, integracion, calculo, interpretacion, omision, sustentacion.
- "porque" habla en segunda persona, dos o tres frases, dice qué faltó y por qué importa.
- "pista" nombra el dato del caso que debía guiarla. "perla" enseña a razonar. Una frase cada uno.

Devuelve SOLO este JSON, sin backticks:
{"cumplidos":[true,false],"puntaje":0,"veredicto":"","tipo_error":null,"porque":"","pista":"","perla":"","riesgo":null}`;
}

function pedirRepregunta(caso, historial){
  return `${CONTEXTO_CURSO}

Estás sustentando con la estudiante. Comportate como una profesora de Medicina Interna exigente pero constructiva: pregunta el porqué, busca lo que no defendió, y no aceptes una afirmación sin argumento.

Caso: ${caso.presentacion}
Diagnóstico final: ${caso.diagnostico_final}
Intercambio hasta ahora:
${historial}

Formula UNA repregunta que ataque el punto más débil de lo que ella acaba de decir.
- Debe depender de su respuesta anterior y no ser una pregunta genérica.
- Identifica si ignoró un dato, saltó a una conclusión, confundió diagnóstico con síndrome, no justificó tratamiento o no consideró un diferencial.
- Si respondió bien, aumenta la exigencia mediante una modificación plausible del caso.
- Alterna entre diagnóstico, dato discriminante, diferencial, examen, tratamiento, seguridad y cambio de conducta.
- No repitas una repregunta ya realizada ni pidas una definición aislada.
- Si respondió mal, permite corregir el razonamiento sin regalar la respuesta.

Devuelve SOLO este JSON, sin backticks:
{"pregunta":"","rubrica":[{"t":"","p":50,"o":true},{"t":"","p":50,"o":false}],"cerrar":false}
Pon "cerrar" en true solo si ya hubo cuatro repreguntas o si la defensa fue completa.`;
}
