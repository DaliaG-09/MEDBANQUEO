/* ── Banco de radiografías ──────────────────────────────────
   Archivos de Wikimedia Commons verificados uno por uno, bajo
   licencia libre. Ninguna viene de los PPTs del curso, así que
   no se reconocen de memoria. Se excluyen las versiones
   anotadas con flechas o etiquetas: delatan la respuesta.
   Cuando un caso cae en un tema con placa disponible, la placa
   se elige PRIMERO y el caso se genera alrededor de ella, para
   que imagen y diagnóstico no puedan desalinearse.
──────────────────────────────────────────────────────────── */
const PATRONES_IMG={
  consolidacion:{dx:"Consolidación neumónica", tema:"nac",
    esperado:["opacidad de tipo alveolar o consolidación","localización por lóbulo o campo pulmonar","broncograma aéreo si es visible","estado de la silueta cardiaca y de los ángulos costofrénicos"],
    semio:"matidez, vibraciones vocales aumentadas, crepitantes y soplo tubario"},
  derrame:{dx:"Derrame pleural", tema:"pleura",
    esperado:["opacidad homogénea de predominio basal","borramiento del ángulo costofrénico","signo del menisco o curva de Damoiseau","desviación del mediastino si el derrame es masivo"],
    semio:"matidez, vibraciones vocales disminuidas, murmullo vesicular abolido"},
  neumotorax:{dx:"Neumotórax", tema:"pleura",
    esperado:["línea pleural visceral visible","ausencia de trama vascular por fuera de esa línea","grado de colapso del pulmón","posición de tráquea y mediastino, para descartar neumotórax a tensión"],
    semio:"hipersonoridad, vibraciones vocales disminuidas, murmullo vesicular abolido"},
  tb:{dx:"Tuberculosis pulmonar", tema:"tb",
    esperado:["compromiso de predominio en lóbulos superiores","cavitación si está presente","infiltrados nodulares, fibrosis o retracción","pérdida de volumen y desviación de estructuras"],
    semio:"crepitantes en vértices, a veces soplo cavernoso"},
  miliar:{dx:"Tuberculosis miliar", tema:"tb",
    esperado:["micronódulos de 1 a 3 milímetros","distribución difusa y uniforme en ambos campos","ausencia de predominio lobar","diferenciación respecto de un patrón intersticial"],
    semio:"cuadro constitucional con auscultación con frecuencia pobre"},
  intersticial:{dx:"Patrón intersticial", tema:"epid",
    esperado:["líneas septales o patrón reticular","distribución periférica y basal","relación con la silueta cardiaca","ausencia de consolidación alveolar franca"],
    semio:"crepitantes secos tipo velcro en bases, acropaquia en enfermedad avanzada"},
  normal:{dx:"Radiografía de tórax sin alteraciones", tema:"ayudadx",
    esperado:["calidad técnica: inspiración, rotación y penetración","campos pulmonares simétricos y bien aireados","silueta cardiaca de tamaño normal","ángulos costofrénicos libres"],
    semio:"examen respiratorio normal"}
};
const BANCO_IMG=[
 {f:"Pneumonia of Right Lung Middle Lobe.jpg", p:"consolidacion"},
 {f:"LLL pneumonia with effusionM.jpg", p:"consolidacion", nota:"Muestra además derrame acompañante: es un paraneumónico."},
 {f:"Chest X-ray in influenza and Haemophilus influenzae.jpg", p:"consolidacion"},
 {f:"Chest radiograph in influensa and H influenzae, posteroanterior.jpg", p:"consolidacion"},
 {f:"Unilateral Pleural Effusion.jpg", p:"derrame"},
 {f:"Pleural effusion.jpg", p:"derrame"},
 {f:"Pleural effusion - Left lung (7471755836).jpg", p:"derrame"},
 {f:"Pleural effusion-Metastatic breast carcinoma Case 166 (5477628658).jpg", p:"derrame", nota:"Derrame de causa neoplásica: exudado por criterios de Light."},
 {f:"Medical X-Ray imaging AGL02 nevit.jpg", p:"derrame"},
 {f:"Pneumothorax CXR.jpg", p:"neumotorax"},
 {f:"X-ray subtle pneumothorax in inspiration.jpg", p:"neumotorax", nota:"Neumotórax sutil: obliga a buscar la línea pleural con detenimiento."},
 {f:"ZP pneumothorax (10).jpg", p:"neumotorax"},
 {f:"Floride kavernisierende Tuberkulose 27M - CR pa - 001.jpg", p:"tb", nota:"Tuberculosis cavitaria florida."},
 {f:"Chest x-ray of Ghon's complex of active tuberculosis.jpg", p:"tb", nota:"Complejo de Ghon en tuberculosis primaria."},
 {f:"Chest X-ray of discrete round nodules after secondary tuberculosis.jpg", p:"tb"},
 {f:"Chest x-ray of bronchiectasis post-primary pulmonary tuberculosis.jpg", p:"tb", nota:"Bronquiectasias como secuela de tuberculosis."},
 {f:"Chest radiograph of miliary tuberculosis 2.jpg", p:"miliar"},
 {f:"Chest radiograph of a lung with Kerley B lines.jpg", p:"intersticial", nota:"Líneas B de Kerley: patrón intersticial, clásico del edema pulmonar."},
 {f:"Chest Xray PA 3-8-2010.png", p:"normal", nota:"Placa normal. Sin un normal en la cabeza, lo anormal no resalta."}
];
const imgUrl=f=>"https://commons.wikimedia.org/wiki/Special:FilePath/"+encodeURIComponent(f)+"?width=1100";
const imgPagina=f=>"https://commons.wikimedia.org/wiki/File:"+encodeURIComponent(f.replace(/ /g,"_"));
const ORDEN_LECTURA=["Calidad técnica: proyección, inspiración, rotación y penetración",
 "Partes blandas y estructuras óseas","Vía aérea y tráquea: centrada o desviada",
 "Mediastino y silueta cardiaca","Hilios pulmonares",
 "Campos pulmonares, comparando lado con lado","Ángulos costofrénicos y cardiofrénicos",
 "Diafragmas y espacio subdiafragmático"];
const RUB_DESC=[
 {t:"Comenta la calidad técnica o la proyección de la placa",p:15,o:false},
 {t:"Nombra el hallazgo principal con terminología radiológica correcta",p:40,o:true},
 {t:"Localiza el hallazgo por hemitórax, campo o lóbulo",p:30,o:true},
 {t:"Menciona un signo asociado o el estado de las estructuras vecinas",p:15,o:false}];
/* ── Fuentes remotas de placas ───────────────────────────────
   Tres niveles, en orden de tamaño:
   1) Open-i (NLM/NIH): 7470 radiografías de tórax de la Indiana
      University Chest X-ray Collection, cada una con su informe
      radiológico real y sus términos MeSH. Licencia CC BY-NC-ND,
      uso personal de estudio. El informe original se usa como
      patrón de oro de la descripción.
   2) Wikimedia Commons por categoría: cientos de archivos libres.
   3) Banco local verificado: 19 placas, respaldo sin conexión.
   Las dos primeras necesitan salida a internet, así que dentro de
   un sandbox no funcionan y cae automáticamente a la tercera.
──────────────────────────────────────────────────────────── */
const CAT_COMMONS={consolidacion:"X-rays of pneumonia",derrame:"X-rays of pleural effusion",
  neumotorax:"X-rays of pneumothorax",tb:"X-rays of lung tuberculosis",
  miliar:"X-rays of pulmonary miliary tuberculosis",intersticial:"X-rays of pulmonary edema",
  normal:"X-rays of normal chest",atelectasia:"X-rays of atelectasis"};
const Q_OPENI={consolidacion:"pneumonia consolidation",derrame:"pleural effusion",
  neumotorax:"pneumothorax",tb:"tuberculosis",miliar:"miliary tuberculosis",
  intersticial:"interstitial pulmonary edema",normal:"normal",atelectasia:"atelectasis"};

async function desdeOpenI(patron){
  const q=Q_OPENI[patron]; if(!q) return null;
  const inicio=1+Math.floor(Math.random()*60)*10;
  const u="https://openi.nlm.nih.gov/api/search?query="+encodeURIComponent(q)+
    "&coll=cxr&it=x&m="+inicio+"&n="+(inicio+9);
  const d=await (await fetch(u)).json();
  const lista=(d&&d.list)||[];
  const libres=lista.filter(x=>!(S.placas||[]).includes("openi:"+x.uid));
  const x=(libres.length?libres:lista)[Math.floor(Math.random()*(libres.length||lista.length))];
  if(!x) return null;
  const campo=Object.keys(x).find(k=>/^img(Large|Thumb|Grid)?$/i.test(k)&&typeof x[k]==="string"&&x[k]);
  if(!campo) return null;
  const src=x[campo].startsWith("http")?x[campo]:"https://openi.nlm.nih.gov"+x[campo];
  const informe=(x.abstract||"").replace(/<[^>]+>/g," ").replace(/X{3,}/g,"—").replace(/\s+/g," ").trim();
  return {item:{f:"openi:"+x.uid, url:src, pagina:"https://openi.nlm.nih.gov/detailedresult?img="+encodeURIComponent(x.uid),
    informe, nota:x.Problems&&x.Problems!=="normal"?"Hallazgos referidos en el informe: "+x.Problems:"",
    fuente:"Open-i · NLM/NIH · CC BY-NC-ND"}, meta:PATRONES_IMG[patron]};
}
async function desdeCommons(patron){
  const cat=CAT_COMMONS[patron]; if(!cat) return null;
  const u="https://commons.wikimedia.org/w/api.php?origin=*&format=json&action=query"+
    "&generator=categorymembers&gcmtype=file&gcmlimit=100&gcmtitle="+encodeURIComponent("Category:"+cat)+
    "&prop=imageinfo&iiprop=url&iiurlwidth=1100";
  const d=await (await fetch(u)).json();
  const pg=(d&&d.query&&d.query.pages)?Object.values(d.query.pages):[];
  const ok=pg.filter(p=>{const ii=p.imageinfo&&p.imageinfo[0];
    return ii&&ii.thumburl&&/\.(jpe?g|png)$/i.test(ii.url)
      && !/annotated|labell?ed|1[89]\d\d|Wellcome|journal/i.test(p.title)
      && !(S.placas||[]).includes(p.title);});
  if(!ok.length) return null;
  const p=ok[Math.floor(Math.random()*ok.length)];
  return {item:{f:p.title, url:p.imageinfo[0].thumburl, pagina:p.imageinfo[0].descriptionurl,
    fuente:"Wikimedia Commons · licencia libre"}, meta:PATRONES_IMG[patron]};
}
async function placaRemota(patrones){
  for(const p of patrones.sort(()=>Math.random()-0.5)){
    for(const f of [desdeOpenI, desdeCommons]){
      try{ const r=await f(p); if(r){ S.placas=(S.placas||[]).concat(r.item.f).slice(-300); guardar(); return r; } }
      catch(e){ /* sin salida a internet o fuente caída: se sigue probando */ }
    }
  }
  return null;
}
async function elegirPlaca(temaId, libre){
  const pats = libre ? Object.keys(PATRONES_IMG)
    : Object.entries(PATRONES_IMG).filter(([,v])=>v.tema===temaId).map(([k])=>k);
  if(!pats.length) return null;
  const remota=await placaRemota(pats);
  if(remota) return remota;
  let pool=BANCO_IMG.filter(b=>pats.includes(b.p)&&!(S.placas||[]).includes(b.f));
  if(!pool.length) pool=BANCO_IMG.filter(b=>pats.includes(b.p));
  if(!pool.length) return null;
  const item=pool[Math.floor(Math.random()*pool.length)];
  S.placas=(S.placas||[]).concat(item.f).slice(-300); guardar();
  return {item:Object.assign({fuente:"banco local verificado"},item), meta:PATRONES_IMG[item.p]};
}
function placaSrc(p){ return p.item.url || imgUrl(p.item.f); }
function placaPagina(p){ return p.item.pagina || imgPagina(p.item.f); }
function visorHTML(placa,id){
  return `<div class="viewer" id="${id}"><img src="${esc(placaSrc(placa))}" alt="Radiografía de tórax para interpretar">
      <div class="cap"><span>radiografía de tórax</span><span>${esc(placa.item.fuente||"repositorio abierto")}</span></div></div>
    <div class="tools">
      <button data-t="inv" aria-pressed="false">Invertir</button>
      <button data-t="zoom" aria-pressed="false">Ampliar</button>
      <button data-t="guia" aria-pressed="false">Guía de lectura</button>
    </div><div id="${id}-scaf"></div>`;
}
function activarVisor(id){
  const vw=document.getElementById(id); if(!vw) return;
  document.querySelectorAll(`[data-t]`).forEach(b=>b.onclick=()=>{
    const k=b.dataset.t;
    if(k==="guia"){
      const on=b.getAttribute("aria-pressed")!=="true"; b.setAttribute("aria-pressed",on);
      document.getElementById(id+"-scaf").innerHTML= on
        ? `<div class="scaffold">Orden de lectura<ol>${ORDEN_LECTURA.map(l=>`<li>${esc(l)}</li>`).join("")}</ol></div>` : "";
    } else { const on=vw.classList.toggle(k); b.setAttribute("aria-pressed",on); }
  });
  const im=vw.querySelector("img");
  im.onerror=()=>{ vw.insertAdjacentHTML("afterend",
    `<div class="note">La imagen no cargó. Si estás en la vista previa de Claude, es el sandbox bloqueando dominios externos. Descarga el archivo y ábrelo en tu navegador. <a href="${esc(im.src)}" target="_blank" rel="noopener">Abrir la placa en otra pestaña</a>.</div>`); };
}

const TIPOS_ERROR = {memoria:"error de memoria", confusion:"confusión de conceptos", aplicacion:"error de aplicación",
  integracion:"error de integración", calculo:"error de cálculo", interpretacion:"error de interpretación",
  omision:"omisión", sustentacion:"error de sustentación"};

/* Semilla mínima: la app tiene que funcionar sin internet. */
const SEMILLA_BANCO = [
 {tipo:"opcion_multiple", concepto:"pleura::criterios de Light", eje:"aplicar", dificultad:3,
  enunciado:"Líquido pleural de un paciente con neumonía de la semana previa: proteínas en líquido 3.9 g/dL, proteínas séricas 6.4 g/dL, LDH en líquido 310 U/L, LDH sérica 380 U/L. ¿Cómo se clasifica?",
  opciones:["Trasudado, porque la LDH del líquido no supera el límite superior sérico",
            "Exudado, porque el cociente de proteínas supera 0.5",
            "Trasudado, porque el cociente de LDH es menor de 0.6",
            "No clasificable sin el pH del líquido"],
  correcta:1,
  porque:"El cociente de proteínas es 3.9/6.4 = 0.61, por encima de 0.5. Basta que se cumpla un criterio de Light para clasificar el líquido como exudado, aunque los otros dos no se cumplan.",
  perla:"Los criterios de Light se leen en disyunción, no en conjunción. Buscar que se cumplan los tres es el error más frecuente."},
 {tipo:"opcion_multiple", concepto:"epoc::retenedor crónico de CO₂", eje:"interpretar", dificultad:4,
  enunciado:"Varón con EPOC severo y oxígeno domiciliario llega somnoliento. AGA: pH 7.26, PaCO₂ 68, HCO₃⁻ 30. ¿Qué indica el bicarbonato de 30?",
  opciones:["Una alcalosis metabólica primaria agregada",
            "Compensación renal instalada, es decir un componente crónico",
            "Un error de laboratorio, porque no corresponde al pH",
            "Acidosis metabólica compensada"],
  correcta:1,
  porque:"En acidosis respiratoria aguda el HCO₃⁻ esperado sería 24 + (68−40)/10 = 26.8. El valor real de 30 supera lo esperado para un cambio agudo, lo que indica que el riñón ya tuvo tiempo de compensar.",
  perla:"El bicarbonato no dice qué trastorno hay, dice cuánto tiempo lleva. Es el reloj del AGA."},
 {tipo:"respuesta_corta", concepto:"aga::cálculo del PaFiO₂", eje:"calcular", dificultad:2,
  enunciado:"PaO₂ 48 mmHg con FiO₂ de 0.4. Calcula el PaFiO₂.",
  respuesta:"120", tolerancia:2,
  porque:"48 dividido entre 0.4 es 120, que corresponde a lesión pulmonar moderada a severa.",
  perla:"La FiO₂ va siempre en decimal. Dividir entre 40 en vez de 0.4 es el error de cálculo más común y cambia la gravedad por un factor de cien."},
 {tipo:"verdadero_falso", concepto:"semiologia::síndrome de derrame pleural", eje:"reconocer", dificultad:2,
  enunciado:"En el síndrome de derrame pleural las vibraciones vocales están aumentadas.",
  correcta:false,
  porque:"El líquido interpuesto entre el pulmón y la pared amortigua la transmisión, así que las vibraciones vocales están disminuidas o abolidas. Aumentan en la consolidación, donde el pulmón condensado transmite mejor.",
  perla:"Matidez con vibraciones aumentadas es consolidación; matidez con vibraciones disminuidas es derrame. La percusión sola no distingue."}
];
