/* ═══════════════════════════════════════════════════════════
   1 · BASE DE CONOCIMIENTO
   Temas y conceptos del módulo, tomados de los PPT y lecturas
   de la carpeta MODULO NEUMOLOGÍA. La estructura es modular:
   agregar Cardiología es agregar entradas, no tocar el motor.
═══════════════════════════════════════════════════════════ */
const ESPECIALIDADES = [{id:"neumo",nombre:"Neumología",activa:true},
                        {id:"cardio",nombre:"Cardiología",activa:false}];

const TEMAS = [
 {id:"anatomia", esp:"neumo", sem:1, nombre:"Anatomía y fisiología respiratoria",
  conceptos:["relación ventilación/perfusión","volúmenes y capacidades pulmonares","difusión alveolocapilar","curva de disociación de la hemoglobina","mecánica ventilatoria"]},
 {id:"ayudadx", esp:"neumo", sem:1, nombre:"Exámenes de ayuda diagnóstica",
  conceptos:["lectura sistemática de radiografía de tórax","indicaciones de tomografía de tórax","espirometría y patrón obstructivo vs restrictivo","broncoscopia","toracocentesis diagnóstica","difusión de monóxido de carbono"]},
 {id:"semiologia", esp:"neumo", sem:1, nombre:"Síndromes pleuropulmonares",
  conceptos:["síndrome de consolidación","síndrome de derrame pleural","síndrome de neumotórax","síndrome cavitario","atelectasia","interpretación de vibraciones vocales"], alto:true},
 {id:"nac", esp:"neumo", sem:1, nombre:"Neumonía adquirida en la comunidad",
  conceptos:["CURB-65","criterios de hospitalización en NAC","agentes etiológicos más frecuentes","tratamiento antibiótico empírico","complicaciones de la NAC","factores de riesgo y vacunación"], alto:true},
 {id:"nih", esp:"neumo", sem:1, nombre:"Neumonía intrahospitalaria y atípicas",
  conceptos:["definición de neumonía intrahospitalaria","neumonía asociada a ventilación mecánica","gérmenes multirresistentes","neumonías atípicas y su presentación","neumonía aspirativa y absceso pulmonar"]},
 {id:"asma", esp:"neumo", sem:1, nombre:"Asma bronquial",
  conceptos:["diagnóstico de asma y reversibilidad","clasificación del control","criterios de asma grave","manejo de la crisis en emergencia","escalones de tratamiento de mantenimiento","factores de mal control"], alto:true},
 {id:"bronquiec", esp:"neumo", sem:1, nombre:"Bronquitis y bronquiectasias",
  conceptos:["bronquitis aguda vs crónica","definición de bronquiectasias","hallazgos tomográficos de bronquiectasias","manejo de exacerbaciones","causas de bronquiectasias"]},
 {id:"aga", esp:"neumo", sem:2, nombre:"Análisis de gases arteriales",
  conceptos:["identificación del trastorno primario","compensación aguda vs crónica","HCO₃⁻ esperado en trastornos respiratorios","PaCO₂ esperado en trastornos metabólicos","cálculo del PaFiO₂","gradiente alveoloarterial de oxígeno","trastornos mixtos"], alto:true},
 {id:"epoc", esp:"neumo", sem:2, nombre:"Enfermedad pulmonar obstructiva crónica",
  conceptos:["diagnóstico espirométrico de EPOC","clasificación GOLD","exacerbación de EPOC","oxigenoterapia crónica domiciliaria","retenedor crónico de CO₂","tratamiento de mantenimiento"], alto:true},
 {id:"pleura", esp:"neumo", sem:2, nombre:"Enfermedades pleurales",
  conceptos:["criterios de Light","exudado vs trasudado","derrame paraneumónico simple, complicado y empiema","indicaciones de drenaje pleural","neumotórax espontáneo","signos radiológicos del derrame"], alto:true},
 {id:"tb", esp:"neumo", sem:2, nombre:"Tuberculosis pulmonar",
  conceptos:["diagnóstico por baciloscopía y prueba molecular","PPD e IGRA","esquema de tratamiento sensible","piridoxina con isoniazida","monitoreo por etambutol","tuberculosis multidrogorresistente","hallazgos radiológicos de TB"], alto:true},
 {id:"epid", esp:"neumo", sem:3, nombre:"Enfermedad pulmonar intersticial difusa",
  conceptos:["patrón restrictivo en espirometría","fibrosis pulmonar idiopática","patrón de neumonía intersticial usual","neumonitis por hipersensibilidad","crepitantes tipo velcro y acropaquia","utilidad de la DLCO"]},
 {id:"irasdra", esp:"neumo", sem:3, nombre:"Insuficiencia respiratoria aguda y SDRA",
  conceptos:["insuficiencia respiratoria tipo I y tipo II","criterios de Berlín","hipoxemia refractaria y shunt","indicaciones de ventilación mecánica","oxigenoterapia y dispositivos"], alto:true},
 {id:"ocupacional", esp:"neumo", sem:3, nombre:"Enfermedades respiratorias ocupacionales",
  conceptos:["neumoconiosis","silicosis","asbestosis y placas pleurales","asma ocupacional","historia de exposición laboral"]},
 {id:"sahos", esp:"neumo", sem:3, nombre:"Apnea-hipopnea obstructiva del sueño",
  conceptos:["escala de Epworth","cuestionario STOP-BANG","polisomnografía e índice apnea-hipopnea","indicaciones de CPAP","consecuencias cardiovasculares"]}
];

const CONCEPTOS = [];
TEMAS.forEach(t=>t.conceptos.forEach(c=>CONCEPTOS.push({id:t.id+"::"+c, tema:t.id, nombre:c, alto:!!t.alto})));

/* Ejes de dominio: un concepto no está dominado hasta tener evidencia en todos. */
const EJES = ["recordar","reconocer","calcular","interpretar","aplicar","integrar","sustentar"];
const NIVELES = ["no adquirido","parcialmente adquirido","en consolidación","dominado","integrado clínicamente"];

/* Patrones de evaluación reales, extraídos de los exámenes de taller de la carpeta. */
const PATRONES = {
  aga:{nombre:"Examen de AGA", secuencia:[
    "¿Qué alteración primaria presenta el paciente según su AGA? Justifique su respuesta.",
    "Justifique si el problema es agudo o crónico.",
    "Calcule el PaFiO₂ e interprete el resultado.",
    "Calcule el valor esperado de compensación y diga si es adecuada."]},
  imagen:{nombre:"Examen de imágenes", secuencia:[
    "Hasta aquí, ¿qué diagnóstico presuntivo propones?",
    "Describa la radiografía de tórax.",
    "Sustente su diagnóstico."]},
  lectura:{nombre:"Control de lectura", secuencia:[
    "Mencione tres diferencias entre los dos conceptos planteados.",
    "Aplique el detalle de la lectura al caso presentado.",
    "Desarrolle un concepto principal tratado en la lectura."]},
  caso:{nombre:"Caso clínico integrador", secuencia:[
    "Sustenta el probable diagnóstico.",
    "¿Cómo interpretas los resultados en relación con la clínica del paciente?",
    "¿Qué criterios usarías para decidir hospitalización?",
    "¿Cuál sería el tratamiento inicial?",
    "¿Qué complicaciones podrían aparecer si no se trata adecuadamente?"]}
};

const ETAPAS = [
  {n:1, t:"Presentación inicial", pide:"hipótesis diagnóstica, que queda congelada"},
  {n:2, t:"Funciones vitales y examen físico", pide:"cuál hallazgo es el más discriminante y por qué"},
  {n:3, t:"Laboratorio", pide:"interpretación de los resultados contra la clínica"},
  {n:4, t:"Gasometría o imagen", pide:"interpretación del estudio"},
  {n:5, t:"Escala o cálculo", pide:"cálculo e interpretación"},
  {n:6, t:"Diagnóstico diferencial", pide:"diferenciales priorizados con argumento"},
  {n:7, t:"Manejo", pide:"conducta terapéutica"},
  {n:8, t:"Sustentación", pide:"defensa de la decisión frente a repreguntas"}
];
