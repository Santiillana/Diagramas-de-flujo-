# Reglas permanentes del repositorio

- Conserva `reference/` sin cambios; es una fuente histórica protegida.
- Usa los catálogos de `src/content/` y `src/math/` como fuente de verdad del producto; sincroniza la interfaz y la documentación con ellos.
- Mantén los módulos pequeños, JavaScript nativo y el pseudocódigo dentro del parser/intérprete seguro. No uses `eval` ni `new Function`.
- Toda interacción debe funcionar con teclado, tener estados accesibles y respetar `prefers-reduced-motion` y los breakpoints existentes.
- Al añadir contenido, incorpora validación determinista y cobertura de regresión. Actualiza README y mapa del repositorio si cambian capacidades o conteos.
- Completa y revisa cada paso de diseño antes de guardarlo en un commit separado, con mensaje que identifique el paso.
