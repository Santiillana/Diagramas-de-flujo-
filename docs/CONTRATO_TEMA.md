# Contrato para añadir un tema

Un tema se considera completo cuando sus datos, recorrido de aprendizaje, práctica y superficies de producto están conectados. Seguir este orden mantiene el registro de `src/content/temas.js` como punto de entrada.

1. **Registrar el tema** en `src/content/temas.js`: ID estable, competencia, título, estado real, conceptos, lecciones, ejercicios, simulador y mecánicas. No publicar un tema disponible si alguna superficie clave está vacía.
2. **Definir conceptos** en `src/content/conceptos.js` cuando el tema use el catálogo común; mantener las relaciones con las competencias de `src/content/ficha.js`.
3. **Escribir las lecciones** en el módulo propio del tema. Cada lección debe cubrir objetivo, explicación intuitiva y formal, ejemplo, errores frecuentes, visualización/escena y comprobación. Registrar recetas compatibles con el kit de lecciones.
4. **Crear ejercicios** en su banco de contenido con IDs únicos, dificultad, contexto, opciones, respuesta explicada y datos para un oráculo independiente. Validar el banco y cubrir sus casos límite.
5. **Definir la simulación**: productor de pasos/traza, área principal y escenas con datos reproducibles. El Simulador y el Laboratorio deben derivar de la misma evidencia, sin motores contradictorios.
6. **Implementar mecánicas de Laboratorio** en el generador y la interfaz del tema: al menos clasificación/relación, construcción/orden y análisis/error o escenario alternativo cuando aplique. Añadir pistas, feedback, estrellas, medallas y persistencia con controles accesibles.
7. **Incorporar vocabulario** al glosario o a los textos del tema, con definiciones contextualizadas y consistentes con la fuente pedagógica.
8. **Cerrar calidad y publicación**: validar datos, pruebas unitarias, teclado y lector de pantalla, contraste, movimiento reducido, tamaños 375/768/1280, determinismo, persistencia y carga. Revisar Inicio, Aprende, Mi progreso, Ejercicios, Simulador, Laboratorio, README y `docs/MAPA_DEL_REPO.md`; dejar futuras competencias como próximas, sin páginas vacías.

Para temas con simulador especializado, complementar este contrato con [`CONTRATO_SIMULADOR.md`](./CONTRATO_SIMULADOR.md). Las categorías de fuentes pueden depender del marco del autor; documentar esa variación en los contenidos y evitar una regla universal sin contexto.
