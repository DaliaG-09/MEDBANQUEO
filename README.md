# MEDBANQUEO

Plataforma de entrenamiento y evaluación clínica para Medicina Interna I.

Complementaria a [MEDCORE](https://daliag-09.github.io/MEDCORE/). La diferencia
de propósito es la que manda en todo el diseño:

| | MEDCORE | MEDBANQUEO |
|---|---|---|
| Para qué | estudiar y organizar el contenido | recuperar, aplicar, razonar y evaluarse |
| Qué guarda | apuntes, resúmenes, cronograma | conceptos, errores, dominio, repetición espaciada |

**Principio de fondo:** el conocimiento es permanente, las preguntas son
dinámicas. La repetición espaciada decide *qué* vuelve; el motor de novedad
decide *cómo* vuelve. El mismo concepto puede volver como pregunta, como caso
clínico o como sustentación, pero nunca con el mismo texto.

## Estructura

```
index.html              carga los módulos en orden
css/estilo.css
datos/conocimiento.js   temas, conceptos, patrones de evaluación, etapas
js/config.js            endpoint y modelo
js/srs.js               repetición espaciada y estado de dominio
js/motor.js             generación de preguntas y evaluación de respuestas
js/ui.js                enrutador y bloque de veredicto
js/vista-*.js           una vista por sección de la navegación
js/radiologia-datos.js  banco de placas y fuentes remotas
js/radiologia.js        calificación de imágenes y lectura modelo
api/claude.js           función serverless que guarda la llave de la API
```

Regla de oro: **el conocimiento vive en `datos/`, no en el código.** Cuando se
ingiere un PPT nuevo, eso es un commit a un archivo de datos. La lógica no se
toca, así que una actualización de contenido no puede romper la aplicación.

## La llave de la API

Este repositorio es público. La llave de Anthropic **no va aquí**, ni en el
JavaScript ni en un archivo de configuración. Vive como variable de entorno en
la función de `api/claude.js`, desplegada aparte. Ver las instrucciones dentro
de ese archivo.

## Fuentes

- Contenido médico: PPTs y lecturas del curso, en Drive. Prioridad sobre
  cualquier fuente general.
- Patrones de evaluación: talleres y exámenes reales del curso.
- Radiografías: [Open-i](https://openi.nlm.nih.gov) (NLM/NIH, CC BY-NC-ND) y
  Wikimedia Commons. Ninguna proviene de pacientes ni de los PPTs del curso.

## Estado

En desarrollo. Módulo actual: Neumología. Sigue Cardiología.
