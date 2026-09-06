# MEDBANQUEO — Plan maestro V1

## Objetivo
MEDBANQUEO es una plataforma personal de entrenamiento para Medicina Interna I. El objetivo no es almacenar preguntas estáticas, sino entrenar recuerdo activo, razonamiento clínico, sustentación y transferencia mediante preguntas nuevas y adaptativas.

## Regla central
El conocimiento es estable; las preguntas, casos y formas de evaluación son dinámicos.

## Fuente de verdad académica
Para cada módulo se priorizará el material real del curso:
1. PPTs de clase.
2. Lecturas asignadas.
3. Casos clínicos incluidos en los PPTs.
4. Imágenes de talleres.
5. Ejemplos de evaluaciones/exámenes previos.

Los casos y talleres se usarán para aprender el estilo y estructura de evaluación, no para copiar preguntas literalmente.

## Arquitectura de aprendizaje
Cada concepto se entrena mediante siete competencias:
- recordar
- reconocer
- calcular
- interpretar
- aplicar
- integrar
- sustentar

Un concepto no se considera completamente dominado por acertar una sola pregunta.

## Modos de entrenamiento
- Banquear: sesiones cortas de preguntas variadas.
- Casos clínicos: razonamiento progresivo por etapas, sin revelar datos futuros.
- Flashcards: recuerdo activo con repetición espaciada.
- Sustentación: respuestas abiertas y repreguntas.
- Imágenes: descripción e interpretación.
- Escalas y cálculos: cálculo + interpretación + conducta.
- Exámenes: simulacros con mezcla de competencias.
- Errores: recuperación dirigida de debilidades.
- Progreso: dominio por concepto y competencia.

## Evaluación de respuestas
Nunca exigir coincidencia literal con una respuesta modelo.
Las respuestas abiertas se valorarán semánticamente contra una rúbrica. Se distinguirá:
- correcto
- parcial
- incorrecto
- inseguro

La retroalimentación debe mostrar, cuando corresponda:
- qué estuvo bien
- qué faltó
- por qué importa
- dato clínico que debía guiar
- perla clínica
- trampa frecuente de examen
- riesgo relevante

## Novedad
Una pregunta ya utilizada no debe repetirse de forma idéntica. La plataforma debe conservar el historial para evitar duplicados y, cuando un concepto vuelva, cambiar la tarea cognitiva, contexto, arquetipo o forma de evaluación.

La novedad no significa abandonar conceptos importantes: un concepto débil vuelve con una representación diferente.

## Repetición espaciada
La programación se hará principalmente a nivel de concepto y competencia, no como simple calendario de tarjetas. Los errores y conceptos de alta prioridad regresan antes.

## Integración
Cada especialidad puede entrenarse de forma aislada. Cuando existan al menos dos especialidades activas, se habilitarán casos integrados que obliguen a diferenciar diagnósticos y decisiones entre ellas.

Primer bloque:
- Neumología
- luego Cardiología
- luego integración Neumo + Cardio

Posteriormente:
- Gastroenterología
- Nefrología
- Dermatología

## Diseño
Mantener la estética clínica, limpia y académica existente. Priorizar legibilidad, jerarquía visual, retroalimentación clara y uso rápido durante el estudio. No rediseñar la interfaz sin necesidad funcional.

## Principio de desarrollo
No cambiar arquitectura, stack o diseño por capricho. Cada modificación debe resolver una necesidad concreta y conservar lo que ya funciona.

## Orden de implementación
1. Auditar y estabilizar el motor actual.
2. Mejorar evaluación abierta y rúbricas.
3. Mejorar novedad/adaptación.
4. Mejorar repetición espaciada por competencia.
5. Consolidar banco de errores.
6. Validar con material real de Neumología.
7. Construir integración Neumo + Cardio.
8. Escalar a las demás especialidades.

## Restricción académica
El contenido médico generado debe estar anclado al material del curso proporcionado y, cuando sea necesario, verificarse antes de incorporarse como conocimiento permanente. El generador no debe inventar datos, criterios, dosis, valores de referencia ni conductas clínicas.
