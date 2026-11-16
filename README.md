# Traza — laboratorio visual de diagramas de flujo

Plataforma educativa modular basada en la especificación maestra V5 y en el prototipo original preservado en `reference/`. Esta rama integra una reorganización de la experiencia en cuatro espacios y una nueva estructura del Simulador y del Laboratorio.

## Estado de esta entrega

La implementación se trabaja en la rama `mejoras/implementacion-integral-v2`, mediante la [PR #10](https://github.com/Santiillana/Diagramas-de-flujo-/pull/10). **La PR aún no está fusionada en `main` y la validación de navegador está en curso.** Por eso este README describe el alcance implementado en la rama, no una publicación de producción.

Se conservan los 17 temas de Aprende y los 45 ejercicios (20 básicos, 10 intermedios, 10 avanzados y 5 expertos). El intérprete, parser y compilador siguen siendo la fuente única de ejecución; la reorganización se realiza en la capa de interfaz.

## Los cuatro espacios

### 1. Aprende

17 lecciones progresivas. Cada lección mantiene sus objetivos, explicación intuitiva y técnica, ejemplo con datos, comprobación de comprensión y progreso local. Las escenas interactivas se alimentan de los eventos generados por la ejecución real del ejemplo. El alumno puede avanzar, retroceder o reproducir el recorrido.

### 2. Ejercicios

Catálogo de 45 retos con búsqueda, paginación, nivel de dificultad, filtro de ejercicios de clase y selección de conceptos. Los conceptos se pueden combinar para exigir que aparezcan todos o cualquiera de ellos.

La ficha presenta el enunciado, objetivo, conceptos, entradas y restricciones, sin mostrar directamente el pseudocódigo de solución. El paso al Simulador se confirma en una ventana previa para dar oportunidad de resolver el problema primero.

### 3. Simulador

El parser y el intérprete trabajan sobre la gramática educativa del prototipo: `leer`, `imp`, asignación, `si/sino/fin`, `para`, `mientras` y `hacer/hm`. No ejecutan el pseudocódigo como JavaScript: no usan `eval` ni `new Function`.

Una traza determinista alimenta el pseudocódigo resaltado, el SVG, las rutas V/F, la ficha animada, la escena explicativa, las variables, el historial, la salida y la línea de tiempo.

La vista se organiza en cuatro ventanas: **Problema**, **Pseudocódigo**, **En escena** y **Variables**. Pantalla e Historial son secciones desplegables dentro de Variables, no ventanas adicionales. Un panel agrupado contiene selector de ejercicios, cámara, zoom, presentación, visibilidad de ventanas, tamaño de texto, Predice y Concentración. La velocidad dispone de nueve valores entre 0,1× y 8×; la presentación permite revelar paso a paso o mostrar el contenido completo. La cámara automática se puede liberar mediante arrastre y vuelve a seguir el paso al avanzar.

En móvil se cambia entre cuatro pestañas: Problema, Diagrama, En escena y Variables. Cambiar de pestaña no reinicia la ejecución.

### 4. Laboratorio

El Laboratorio ofrece tres modalidades:

- **Sigue la ficha:** Predice, Tabla de seguimiento y Sigue la flecha, conectadas a la traza del Simulador.
- **Arma el diagrama:** Ordena instrucciones, Identifica la figura y Completa el hueco. Incluye el **Lienzo libre**, donde se añaden símbolos desde la paleta, se arrastran piezas y se reordenan instrucciones. También conserva edición de propiedades, bloques anidados, validación, compilación y ejecución.
- **Caza el error:** permite escoger la línea sospechosa, elegir una corrección y ejecutar la versión modificada con los mismos datos. La actividad ¿Y si…? compara dos recorridos e identifica el primer punto de divergencia.

El Constructor utiliza el mismo compilador y el mismo intérprete que el Simulador; no mantiene un motor de ejecución paralelo. Su modelo es estructurado por secuencia, ramas y bloques anidados. El arrastre reordena piezas y añade símbolos; no se presenta como un editor de conexiones libres entre puertos SVG arbitrarios.

## Ejecutar en local

Requiere Python 3 para servir los módulos ES:

```bash
python3 -m http.server 8000
```

Abre http://localhost:8000.

## Pruebas

Requiere Node.js 22 o superior:

```bash
npm install
npm test
npx playwright install chromium
npm run test:browser
```

La CI del repositorio ejecuta pruebas de arquitectura y aceptación Chromium además de las pruebas de contenido, parser/intérprete, compilador y oráculo de ejercicios. El estado de aprobación de esta rama debe comprobarse en el resultado de Actions asociado al SHA más reciente de la PR #10.

## Publicación

La aplicación es estática y puede servirse desde GitHub Pages, pero su origen debe configurarse en **Settings → Pages**. No se afirma que esta rama esté desplegada ni que un endpoint público esté verificado. La validación CI de una PR no equivale a una publicación.

## Arquitectura

```text
.
├── index.html
├── src/
│   ├── content/       # lecciones y catálogo de ejercicios
│   ├── core/          # expresiones, parser, intérprete y compilador
│   ├── diagram/       # layout y render SVG
│   ├── ui/            # navegación, contenido, simulador, laboratorio y builder
│   └── styles/        # tokens, componentes y vistas responsive
├── tests/              # unitarias, regresiones y oráculo independiente
├── e2e/                # aceptación Chromium
├── docs/
└── reference/          # especificación y HTML original inmutable
```

## Documentación del proyecto

- Especificación: `docs/MASTER_SPEC.md`
- Estado y evidencia: `docs/IMPLEMENTATION_STATUS.md`
- Decisiones técnicas: `docs/DECISIONS.md`
- Equivalencia funcional: `docs/ORIGINAL_FEATURE_AUDIT.md`
- Aceptación final: `docs/FINAL_ACCEPTANCE.md`
- HTML original inmutable: `reference/diagramas_de_flujo_original.html`
