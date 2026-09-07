/* Arranque. Va último: todos los módulos ya están cargados.
   La base de conocimiento se carga antes de pintar nada, porque el
   motor la necesita para que las preguntas salgan del material del curso. */
cargarCurso().then(cargar).then(()=>ir("inicio"));
