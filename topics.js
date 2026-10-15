/* Contenido del curso. Cada tema: tarjetas de idea, lección paso a paso, quiz y ejemplos para el resolvedor. */
(function () {
'use strict';
const WY = [{ a: [1, 0], op: '<=', b: 4 }, { a: [0, 2], op: '<=', b: 12 }, { a: [3, 2], op: '<=', b: 18 }];
const P = {
  wyndor: { type: 'max', c: [3, 5], cons: WY },
  minneg: { type: 'min', c: [-3, -5], cons: WY },
  dieta: { type: 'min', c: [2, 3], cons: [{ a: [1, 1], op: '>=', b: 4 }, { a: [1, 3], op: '>=', b: 6 }] },
  chvatal: { type: 'max', c: [5, 4, 3], cons: [{ a: [2, 3, 1], op: '<=', b: 5 }, { a: [4, 1, 2], op: '<=', b: 11 }, { a: [3, 4, 2], op: '<=', b: 8 }] },
  hillier: { type: 'min', c: [0.4, 0.5], cons: [{ a: [0.3, 0.1], op: '<=', b: 2.7 }, { a: [0.5, 0.5], op: '=', b: 6 }, { a: [0.6, 0.4], op: '>=', b: 6 }] },
  maxge: { type: 'max', c: [3, 2], cons: [{ a: [2, 1], op: '<=', b: 10 }, { a: [1, 0], op: '<=', b: 4 }, { a: [1, 1], op: '>=', b: 2 }] },
  degen: { type: 'max', c: [3, 9], cons: [{ a: [1, 4], op: '<=', b: 8 }, { a: [1, 2], op: '<=', b: 4 }] },
  alt: { type: 'max', c: [2, 4], cons: [{ a: [1, 2], op: '<=', b: 5 }, { a: [1, 1], op: '<=', b: 4 }] },
  unb: { type: 'max', c: [2, 1], cons: [{ a: [1, -1], op: '<=', b: 10 }, { a: [2, 0], op: '<=', b: 40 }] },
  inf: { type: 'max', c: [3, 2], cons: [{ a: [2, 1], op: '<=', b: 2 }, { a: [3, 4], op: '>=', b: 12 }] }
};
const Q = (q, a, ok, why) => ({ q, a, ok, why });

window.HISTORY = [
  ['1939', 'Kantorovich y la producción', 'El matemático soviético Leonid Kantorovich plantea problemas de producción como programación lineal. Años después recibiría el Premio Nobel de Economía (1975).'],
  ['1940', 'Nace la "Investigación Operativa"', 'En la Segunda Guerra Mundial, grupos científicos del Reino Unido, como el de Patrick Blackett, estudian el uso del radar y la protección de convoyes con matemáticas.'],
  ['1947', 'El método Simplex', 'George Dantzig, trabajando para la Fuerza Aérea de EE. UU., crea el método Simplex. Hasta hoy es el motor de muchos programas de optimización.'],
  ['1947', 'La dualidad', 'John von Neumann descubre que cada problema lineal tiene un "problema gemelo" llamado dual.'],
  ['Años 50', 'Programación dinámica', 'Richard Bellman propone resolver problemas grandes dividiéndolos en etapas más pequeñas.'],
  ['1957–58', 'PERT y CPM', 'Se crean estas técnicas para planificar proyectos enormes, como la construcción de submarinos y plantas químicas.'],
  ['1958', 'Programación entera', 'Ralph Gomory introduce los "planos de corte" para problemas donde las respuestas deben ser números enteros.'],
  ['1984', 'Puntos interiores', 'Narendra Karmarkar presenta un método que cruza por dentro de la región factible en vez de ir por las esquinas.'],
  ['Hoy', 'Optimización en todas partes', 'Rutas de reparto, horarios de hospitales, energía, finanzas e inteligencia artificial usan Investigación de Operaciones.']
];

window.TOPICS = [
{ id: 'historia', title: 'Historia de la Investigación de Operaciones', short: 'De la guerra a la inteligencia artificial: quién la creó y por qué.', kind: 'history',
  cards: [['La idea', 'La Investigación de Operaciones (IO) usa matemáticas para tomar mejores decisiones: gastar menos, ganar más o ahorrar tiempo.'], ['Cómo empezó', 'Nació en la Segunda Guerra Mundial, cuando científicos ayudaron a usar mejor el radar, los barcos y los aviones con recursos limitados.'], ['Hoy', 'La usan empresas de transporte, hospitales, fábricas y apps de mapas para decidir lo mejor con lo que tienen.']],
  lesson: ['Recorre la línea del tiempo de abajo. Cada tarjeta aparece al hacer scroll.', 'Fíjate en dos fechas clave: 1940, cuando nace como disciplina, y 1947, cuando Dantzig crea el Simplex.', 'Desde entonces la IO creció: dualidad, programación dinámica, entera y puntos interiores.', 'Hoy se combina con computadoras potentes e inteligencia artificial. ¡Y tú vas a aprender sus métodos básicos!'],
  quiz: Q('¿Quién creó el método Simplex?', ['Richard Bellman', 'George Dantzig', 'Ralph Gomory'], 1, 'George Dantzig lo creó en 1947.'), examples: [] },

{ id: 'intro', title: 'Introducción a la Programación Lineal', short: 'Variables, función objetivo y restricciones. Maximizar y minimizar.', tool: 1,
  cards: [['La idea', 'La Programación Lineal (PL) busca la mejor decisión posible cuando los recursos son limitados: ganar lo máximo o gastar lo mínimo.'], ['Ejemplo diario', 'Una panadería tiene harina y horas de horno limitadas. ¿Cuántos panes y pasteles debe hacer para ganar más dinero?'], ['Las 4 piezas', '1) Variables de decisión: lo que decides. 2) Función objetivo Z: lo que quieres maximizar o minimizar. 3) Restricciones: los límites. 4) No negatividad: x ≥ 0.']],
  lesson: ['Paso 1. Elige las variables de decisión. Por ejemplo, x₁ = cantidad de pasteles y x₂ = cantidad de panes.', 'Paso 2. Escribe la función objetivo. Si un pastel deja Q3 y un pan Q5, entonces Z = 3x₁ + 5x₂. ¿Quieres que Z sea lo MÁS GRANDE (maximizar ganancias) o lo MÁS PEQUEÑO (minimizar costos)?', 'Paso 3. Escribe las restricciones, que son los límites. Por ejemplo, x₁ ≤ 4 significa "máximo 4 pasteles".', 'Paso 4. Agrega x₁, x₂ ≥ 0, porque no se puede producir una cantidad negativa. ¡Ya tienes el modelo! Pruébalo abajo.'],
  quiz: Q('¿Qué representa la función objetivo Z?', ['Lo que queremos maximizar o minimizar', 'Los límites de los recursos', 'Los valores que deben ser negativos'], 0, 'Z mide qué tan bueno es un plan: ganancia o costo.'),
  examples: [{ name: 'Maximizar: fábrica de vidrio', p: P.wyndor, m: 'auto' }, { name: 'Minimizar: dieta barata', p: P.dieta, m: 'auto' }] },

{ id: 'grafico', title: 'Método gráfico', short: 'Resuelve problemas de 2 variables dibujándolos.', tool: 1, view: 'graph',
  cards: [['La idea', 'Cuando hay solo 2 variables puedes dibujar el problema en un plano y ver la solución con tus ojos.'], ['Ejemplo diario', 'Es como pintar en un mapa el terreno por donde SÍ puedes caminar (región factible) y buscar la esquina más lejana.'], ['Regla de oro', 'Si hay solución óptima, siempre está en un vértice (esquina) de la región factible.']],
  lesson: ['Paso 1. Dibuja cada restricción como una recta. Para x₁ + x₂ = 4 busca dónde corta los ejes.', 'Paso 2. Marca el lado permitido de cada recta. La zona donde todas coinciden es la región factible.', 'Paso 3. Marca los vértices (A, B, C…) y calcula Z en cada uno.', 'Paso 4. Mueve la recta de Z (mira la animación) hasta el último punto que toca la región. Ese es el óptimo.'],
  quiz: Q('¿Dónde está la solución óptima en el método gráfico?', ['En el centro de la región', 'En un vértice de la región factible', 'Fuera de la región factible'], 1, 'Por eso basta comparar Z en las esquinas.'),
  examples: [{ name: 'Maximizar (fábrica de vidrio)', p: P.wyndor, m: 'graph' }, { name: 'Minimizar (dieta)', p: P.dieta, m: 'graph' }] },

{ id: 'heuristica', title: 'Heurística', short: 'Una regla práctica que da buenas soluciones rápido.', tool: 1, view: 'heur',
  cards: [['La idea', 'Una heurística es una regla práctica que encuentra una buena solución rápido, pero sin garantizar que sea la mejor.'], ['Ejemplo diario', 'Llenar una mochila: primero metes lo que más "rinde" por el espacio que ocupa, luego lo siguiente.'], ['La regla voraz', 'Eficiencia = ganancia ÷ recursos que consume (medidos como fracción de lo disponible). Se asigna primero lo más eficiente.']],
  lesson: ['Paso 1. Calcula la eficiencia de cada variable: cuánto gana por cada fracción de recursos que usa.', 'Paso 2. Ordénalas de mayor a menor eficiencia.', 'Paso 3. A la primera dale lo máximo que permitan los recursos. Con lo que sobra, sigue con la siguiente.', 'Paso 4. Compara con el resultado exacto del Simplex. A la diferencia se le llama brecha.'],
  quiz: Q('¿Una heurística garantiza la mejor solución?', ['Sí, siempre', 'No, es rápida pero puede quedar cerca del óptimo', 'Solo en minimización'], 1, 'Gana rapidez, pero pierde la garantía.'),
  examples: [{ name: 'Tres productos, tres recursos', p: P.chvatal, m: 'heur' }, { name: 'Fábrica de vidrio', p: P.wyndor, m: 'heur' }] },

{ id: 'simplex-max', title: 'Método Simplex: maximización', short: 'Salta de esquina en esquina mejorando Z hasta no poder más.', tool: 1,
  cards: [['La idea', 'El Simplex va de esquina en esquina de la región factible, mejorando Z cada vez, hasta que ninguna esquina vecina es mejor.'], ['Ejemplo diario', 'Es como subir una montaña moviéndote siempre a la esquina vecina más alta.'], ['Reglas', 'Se agregan variables de holgura (s) para convertir ≤ en =. Entra la variable con el valor más negativo de la fila Z. Sale la de razón mínima. Se termina cuando la fila Z no tiene negativos.']],
  lesson: ['Paso 1. Forma estándar: suma una variable de holgura a cada restricción ≤. Así x₁ + s₁ = 4.', 'Paso 2. Arma la tabla inicial. La fila Z muestra −c para cada variable.', 'Paso 3. Columna pivote: la del valor más negativo en la fila Z (la que más mejora).', 'Paso 4. Fila pivote: divide cada valor de LD entre su valor positivo de la columna pivote. La razón menor sale.', 'Paso 5. Pivotea (Gauss-Jordan) y repite hasta que la fila Z no tenga negativos.'],
  quiz: Q('¿Cuándo termina el Simplex de maximización?', ['Cuando todos los valores de la fila Z son ≥ 0', 'Cuando la tabla tiene una fila de ceros', 'Después de exactamente 3 pasos'], 0, 'Ya no hay variable que mejore Z.'),
  examples: [{ name: 'Fábrica de vidrio (Z máx = 36)', p: P.wyndor, m: 'simplex' }, { name: 'Tres productos', p: P.chvatal, m: 'simplex' }] },

{ id: 'simplex-min', title: 'Método Simplex: minimización', short: 'Minimizar Z es lo mismo que maximizar −Z.', tool: 1,
  cards: [['La idea', 'Minimizar Z es equivalente a maximizar −Z. Se resuelve con la misma tabla y al final se cambia el signo.'], ['Ejemplo diario', 'Gastar lo menos posible es igual que "ganar lo máximo" si cuentas el gasto en negativo.'], ['Ojo', 'Si el problema de minimizar tiene restricciones ≥ o =, hace falta el Método de la M o de dos fases (temas siguientes).']],
  lesson: ['Paso 1. Cambia Min Z por Max (−Z). Multiplica los coeficientes de Z por −1.', 'Paso 2. Resuelve con el Simplex de maximización: holguras, columna pivote, razón mínima.', 'Paso 3. Al terminar, el valor real es Z = −(valor de −Z).', 'Paso 4. Si hay restricciones ≥, necesitas variables artificiales: usa M o dos fases.'],
  quiz: Q('Minimizar Z equivale a…', ['Maximizar −Z', 'Maximizar Z', 'Ignorar las restricciones'], 0, 'Se invierte el signo y al final se devuelve.'),
  examples: [{ name: 'Min Z = −3x₁ − 5x₂ (Z = −36)', p: P.minneg, m: 'simplex' }, { name: 'Min con ≥ (dieta, se resuelve con 2 fases)', p: P.dieta, m: 'twophase' }] },

{ id: 'dos-fases', title: 'Método de dos fases', short: 'Primero busca una solución de arranque, luego optimiza.', tool: 1,
  cards: [['La idea', 'Con restricciones ≥ o = no hay una solución de arranque obvia. Se agregan variables artificiales (a) y se trabaja en dos fases.'], ['Ejemplo diario', 'Primero compruebas que el camino existe (Fase 1). Luego buscas el mejor camino (Fase 2).'], ['Las fases', 'Fase 1: minimizar W = suma de artificiales. Si W = 0, hay solución factible. Fase 2: se quitan las artificiales y se optimiza el Z original.']],
  lesson: ['Paso 1. A cada restricción ≥ o = agrégale una variable artificial a.', 'Paso 2. Fase 1: resuelve minimizando W = suma de las artificiales.', 'Paso 3. Si W termina en 0, el problema es factible. Si W > 0, ¡no tiene solución!', 'Paso 4. Fase 2: borra las columnas artificiales y resuelve el problema original desde esa tabla.'],
  quiz: Q('Si al final de la Fase 1 W es distinto de 0, el problema…', ['Es óptimo', 'No es factible', 'Es degenerado'], 1, 'Las artificiales no se pudieron eliminar.'),
  examples: [{ name: 'Min con =, ≥ y ≤ (Z = 21/4)', p: P.hillier, m: 'twophase' }, { name: 'Dieta con ≥', p: P.dieta, m: 'twophase' }] },

{ id: 'm', title: 'Método de la M', short: 'Castiga a las variables artificiales con un número gigante.', tool: 1,
  cards: [['La idea', 'Misma meta que dos fases pero en un solo paso: a las variables artificiales se les pone un castigo enorme, M, en Z.'], ['Ejemplo diario', 'Es como poner una multa gigante a quien no cumpla la regla: el método lo saca rápido de la solución.'], ['Detalles', 'En máximo, la artificial lleva −M en Z; en mínimo, +M. M es mucho más grande que cualquier otro número, por eso verás cosas como −3M + 2 en la tabla.']],
  lesson: ['Paso 1. Agrega artificiales a las restricciones ≥ y =.', 'Paso 2. Ponles el castigo −M en la función objetivo (maximización).', 'Paso 3. Limpia la fila Z para que las artificiales básicas queden en 0.', 'Paso 4. Aplica el Simplex. Si al final una artificial sigue positiva, el problema es no factible.'],
  quiz: Q('Si una variable artificial queda positiva en la solución final…', ['El problema es no factible', 'La solución es óptima', 'M debe ser negativo'], 0, 'El castigo no logró sacarla: no se pueden cumplir las restricciones.'),
  examples: [{ name: 'Minimizar con M (Z = 21/4)', p: P.hillier, m: 'bigM' }, { name: 'Maximizar con ≥ y M', p: P.maxge, m: 'bigM' }] },

{ id: 'degeneracion', title: 'Degeneración', short: 'Empates en la razón mínima y variables básicas en 0.', tool: 1,
  cards: [['La idea', 'Hay degeneración cuando hay empate en la razón mínima o una variable básica vale 0. Varias restricciones se cruzan en la misma esquina.'], ['Ejemplo diario', 'Imagina tres paredes que se juntan en la misma esquina de un cuarto: sobra una pared.'], ['Consecuencia', 'Una iteración puede no mejorar Z. En casos raros el método da vueltas (ciclo), pero casi siempre termina bien.']],
  lesson: ['Paso 1. Resuelve el ejemplo y mira la primera iteración.', 'Paso 2. Fíjate en la columna Razón: hay dos filas con el mismo valor mínimo.', 'Paso 3. Eliges una de las dos. La otra variable queda en la base con valor 0.', 'Paso 4. El resolvedor muestra la etiqueta "Degenerada". La solución sigue siendo correcta.'],
  quiz: Q('¿Cómo se detecta la degeneración?', ['Por empate en la razón mínima o una variable básica con valor 0', 'Porque Z es negativo', 'Porque hay solo una restricción'], 0, 'Esas son las dos señales.'),
  examples: [{ name: 'Empate en la razón mínima', p: P.degen, m: 'simplex' }] },

{ id: 'alternativos', title: 'Óptimos alternativos', short: 'Cuando hay muchas soluciones igual de buenas.', tool: 1, view: 'graph',
  cards: [['La idea', 'A veces la recta de Z es paralela a una restricción: toda una arista de la región da el mismo valor de Z.'], ['Ejemplo diario', 'Dos rutas distintas que llegan en el mismo tiempo: cualquiera sirve.'], ['Cómo se ve', 'En la tabla final, una variable NO básica tiene 0 en la fila Z. Si la haces entrar, obtienes otro vértice óptimo con el mismo Z.']],
  lesson: ['Paso 1. Resuelve el ejemplo y llega a la tabla óptima.', 'Paso 2. Busca una variable no básica con 0 en la fila Z.', 'Paso 3. Haz entrar esa variable: obtienes un segundo vértice óptimo con el mismo Z.', 'Paso 4. Todos los puntos del segmento entre los dos vértices también son óptimos. Míralo en la gráfica.'],
  quiz: Q('¿Qué señal indica óptimos alternativos en la tabla final?', ['Una variable no básica con 0 en la fila Z', 'Una variable artificial positiva', 'Una columna sin valores positivos'], 0, 'Puede entrar sin cambiar Z.'),
  examples: [{ name: 'Z paralela a una restricción', p: P.alt, m: 'simplex' }] },

{ id: 'no-acotada', title: 'Solución no acotada', short: 'Cuando Z puede crecer sin parar.', tool: 1, view: 'graph',
  cards: [['La idea', 'Z puede crecer tanto como quieras porque ninguna restricción lo frena.'], ['Ejemplo diario', 'Si nadie te limita la cantidad de dulces que puedes vender, tus ganancias "crecen sin límite" (en la vida real, falta una restricción).'], ['Cómo se ve', 'En el Simplex: la columna que debe entrar no tiene ningún valor positivo, así que no se puede calcular la razón mínima.']],
  lesson: ['Paso 1. Resuelve el ejemplo y avanza paso a paso.', 'Paso 2. Después del primer pivote, entra x₂ pero su columna no tiene valores positivos.', 'Paso 3. Sin razón mínima nada detiene a x₂: Z crece sin límite.', 'Paso 4. En la gráfica la región factible se abre hacia el infinito en la dirección de mejora de Z.'],
  quiz: Q('En el Simplex, ¿cuándo detectas que es no acotado?', ['La columna entrante no tiene valores positivos', 'La razón mínima es 0', 'Todas las holguras valen 0'], 0, 'No hay fila que frene a la variable.'),
  examples: [{ name: 'Z sin límite', p: P.unb, m: 'simplex' }] },

{ id: 'no-factible', title: 'Solución no factible', short: 'Cuando las restricciones se contradicen.', tool: 1, view: 'graph',
  cards: [['La idea', 'No existe ningún punto que cumpla todas las restricciones a la vez: se contradicen.'], ['Ejemplo diario', 'Pedir "gastar menos de Q10" y a la vez "comprar cosas que cuestan más de Q50".'], ['Cómo se ve', 'Con el Método de la M: una artificial queda positiva al final. Con dos fases: W termina mayor que 0. En la gráfica no hay región sombreada.']],
  lesson: ['Paso 1. Resuelve el ejemplo con el Método de la M o con dos fases.', 'Paso 2. Llegas a una tabla "óptima" pero una artificial sigue en la base con valor positivo.', 'Paso 3. Eso significa que no hay forma de cumplir todas las restricciones.', 'Paso 4. Mira la gráfica: las zonas permitidas de las restricciones no se cruzan.'],
  quiz: Q('¿Qué pasa en el Método de la M si el problema es no factible?', ['Queda una artificial con valor positivo', 'Z se hace infinito', 'Todas las holguras son 0'], 0, 'El castigo M no pudo eliminarla.'),
  examples: [{ name: 'Con M', p: P.inf, m: 'bigM' }, { name: 'Con dos fases', p: P.inf, m: 'twophase' }] }
];
})();
