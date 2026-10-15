# Investigación de Operaciones · Plataforma educativa

Plataforma web para aprender Investigación de Operaciones con animaciones, lecciones guiadas, preguntas de comprobación y un **resolvedor** que muestra cada paso. Pensada para que cualquier persona, incluso un niño o adolescente, pueda entender los temas.

**Universidad Mariano Gálvez de Guatemala** · Investigación de Operaciones

**Demo en línea:** https://TU-USUARIO.github.io/NOMBRE-DEL-REPOSITORIO/

## Temas (12)

1. Historia de la Investigación de Operaciones
2. Introducción a la Programación Lineal (maximizar y minimizar)
3. Método gráfico
4. Heurística (regla voraz y comparación con el óptimo)
5. Método Simplex: maximización
6. Método Simplex: minimización
7. Método de dos fases
8. Método de la M
9. Degeneración
10. Óptimos alternativos
11. Solución no acotada
12. Solución no factible

## Resolvedor

- Hasta 5 variables y 6 restricciones (≤, ≥, =), maximizar o minimizar.
- Métodos: Simplex, Método de la M, Dos fases (o automático), gráfico (2 variables) y heurística.
- Tablas del Simplex paso a paso con la columna y la fila pivote resaltadas, con fracciones exactas y la M escrita en la fila Z.
- Detecta y explica: solución óptima, óptimos alternativos, degeneración, solución no acotada y no factible.

## Funciones de la plataforma

Tutorial de entrada, lección guiada y pregunta en cada tema, progreso guardado en el navegador, menú lateral con los colores de la UMG y diseño adaptable a celular.

## Estructura

```
├── index.html   Estructura de la página
├── style.css    Estilos y diseño adaptable
├── solver.js    Motor matemático (Simplex, M, dos fases, casos especiales, heurística)
├── graph.js     Método gráfico (dibujo SVG animado)
├── topics.js    Contenido: temas, lecciones, preguntas y ejemplos
├── app.js       Navegación, resolvedor, tutorial y progreso
├── logo.png     Escudo de la universidad
└── README.md
```

## Ejecutarlo

No necesita instalación: abre `index.html` en el navegador. Para publicarlo, sube todos los archivos a la raíz de un repositorio y activa GitHub Pages.

## Autor

**Darwin Danilo Castro Garcia** · Carné 0903-20-6780

## Uso de inteligencia artificial

Este proyecto se desarrolló con apoyo de una herramienta de inteligencia artificial para generar y revisar el código. Los conceptos, las pruebas y la documentación fueron revisados por el autor.
