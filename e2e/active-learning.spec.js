import { test, expect } from "@playwright/test";

test("la prueba completa verifica todos los métodos y conserva el progreso por nivel",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="exercises"]').click();
 await page.locator('[data-select-exercise="1"]').click();
 await page.locator("[data-reveal-solution]").click();
 await page.locator("[data-run-suite]").click();
 await expect(page.locator("[data-suite-feedback]")).toContainText("6 de 6 pruebas superadas");
 await expect(page.locator('[data-select-exercise="1"] .exercise-progress-status')).toContainText("Verificado");
 await expect(page.locator("#exercise-progress-summary")).toContainText("1 de 40 retos verificados");
 await expect(page.locator("#exercise-progress-summary")).toContainText("1/20 verificados");
 await page.reload();
 await page.locator('[data-space="exercises"]').click();
 await expect(page.locator('[data-select-exercise="1"] .exercise-progress-status')).toContainText("Verificado");
});

test("la predicción del estudiante se compara con la salida ejecutada y la referencia",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="exercises"]').click();
 await page.locator('[data-select-exercise="1"]').click();
 await page.locator("[data-reveal-solution]").click();
 await page.locator("[data-solution-input]").fill("2,3");
 await page.locator("[data-solution-prediction]").fill("[6]");
 await page.locator("[data-run-solution]").click();
 await expect(page.locator("[data-solution-feedback]")).toContainText("Tu predicción no coincide");
 await expect(page.locator("[data-solution-feedback]")).toContainText("[5]");
 await page.locator("[data-solution-prediction]").fill("[5]");
 await page.locator("[data-run-solution]").click();
 await expect(page.locator("[data-solution-feedback]")).toContainText("Tu predicción coincide con la ejecución real");
});

test("el enlace directo restaura ejercicio y método sin revelar la solución",async({page})=>{
 await page.goto("/?reto=4&metodo=1");
 await expect(page.locator("#exercise-detail h3")).toHaveText("Promedio de tres notas");
 await expect(page.locator("#exercise-detail [data-method-index='1']")).toHaveAttribute("aria-selected","true");
 await expect(page.locator(".exercise-gate")).toBeVisible();
 await expect(page.locator("#exercise-detail .exercise-methods")).toBeHidden();
 await expect(page.locator("[data-exercise-share-url]")).toHaveValue(/#ejercicio=4&metodo=1/);
 await expect(page.locator("[data-exercise-share-url]")).toHaveValue(/metodo=1/);
});

test("modo proyector amplía el reto y permite regresar a la navegación normal",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="exercises"]').click();
 await page.locator('[data-select-exercise="1"]').click();
 await page.locator("[data-projector-toggle]").click();
 await expect(page.locator("body")).toHaveClass(/exercise-projector-mode/);
 await expect(page.locator("[data-projector-exit]")).toBeVisible();
 await page.locator("[data-projector-exit]").click();
 await expect(page.locator("body")).not.toHaveClass(/exercise-projector-mode/);
 await expect(page.locator("[data-projector-toggle]")).toHaveAttribute("aria-pressed","false");
});

test("el enlace de compartir identifica el método seleccionado",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="exercises"]').click();
 await page.locator('[data-select-exercise="4"]').click();
 // Los métodos están protegidos por el modo reto hasta revelar la explicación.
 await page.locator("[data-reveal-solution]").click();
 await page.locator("[data-method-index='1']").click();
 await page.locator('[data-share-action="copy"]').click();
 await expect(page.locator("[data-exercise-share-url]")).toHaveValue(/reto=4/);
 await expect(page.locator("[data-exercise-share-url]")).toHaveValue(/metodo=1/);
 await expect(page.locator("[data-share-feedback]")).not.toBeEmpty();
});

test("los controles de ciclo saltan a la siguiente vuelta y permiten salir",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="simulator"]').click();
 await page.locator("#simulator-exercise-picker [data-simulator-exercise='10']").click();
 await page.locator("#simulator-run").click();
 const nextLoop=page.locator("#simulator-next-loop");
 const exitLoop=page.locator("#simulator-exit-loop");
 await expect(nextLoop).toBeDisabled();
 for(let i=0;i<4;i++)await page.locator("#simulator-next").click();
 await expect(page.locator("#scene-content")).toHaveAttribute("data-event-type","loop-enter");
 await expect(nextLoop).toBeEnabled();
 await nextLoop.click();
 await expect(page.locator("#scene-content")).toHaveAttribute("data-event-type","loop-enter");
 await expect(exitLoop).toBeEnabled();
 await exitLoop.click();
 await expect(page.locator("#scene-content")).toHaveAttribute("data-event-type","loop-exit");
 await expect(exitLoop).toBeDisabled();
});

test("el progreso conserva pistas usadas y diagnostica errores frecuentes",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="exercises"]').click();
 await page.locator('[data-select-exercise="1"]').click();
 await page.locator("[data-exercise-hint]").click();
 await expect(page.locator("[data-gate-feedback]")).toContainText("Pista 1");
 await expect(page.locator("#exercise-progress-summary")).toContainText("1 pistas usadas");
 await page.locator("[data-reveal-solution]").click();
 await page.locator("[data-solution-input]").fill("2,3");
 await page.locator("[data-solution-prediction]").fill("[6]");
 await page.locator("[data-run-solution]").click();
 await expect(page.locator("[data-solution-feedback]")).toContainText("Posible confusión");
 await expect(page.locator("#exercise-progress-summary")).toContainText("1 errores por revisar");
 await page.reload();
 await page.locator('[data-space="exercises"]').click();
 await expect(page.locator("#exercise-progress-summary")).toContainText("1 pistas usadas");
 await expect(page.locator("#exercise-progress-summary")).toContainText("1 errores por revisar");
});

test("el enlace compartido conserva también las entradas y la predicción",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="exercises"]').click();
 await page.locator('[data-select-exercise="1"]').click();
 await page.locator("[data-reveal-solution]").click();
 await page.locator("[data-solution-input]").fill("2,3");
 await page.locator("[data-solution-prediction]").fill("5");
 await page.locator('[data-share-action="copy"]').click();
 const url=await page.locator("[data-exercise-share-url]").inputValue();
 expect(url).toContain("#ejercicio=1&metodo=0&datos=2%2C3");
 expect(url).toContain("prediccion=5");
 await page.goto(url);
 await expect(page.locator("[data-solution-input]")).toHaveValue("2,3");
 await expect(page.locator("[data-solution-prediction]")).toHaveValue("5");
});

test("dos métodos se ejecutan con las mismas entradas y comparan sus salidas",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="exercises"]').click();
 await page.locator('[data-select-exercise="14"]').click();
 await page.locator("[data-reveal-solution]").click();
 await page.locator("[data-method-compare-input]").fill("4");
 await page.locator("[data-run-method-comparison]").click();
 await expect(page.locator("[data-method-comparison-result] .method-live-comparison-grid article")).toHaveCount(2);
 await expect(page.locator("[data-method-comparison-result]")).toContainText("Los métodos producen la misma salida");
});

test("el recorrido guiado de 30 segundos completa y guarda el onboarding",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="exercises"]').click();
 await page.locator("[data-start-onboarding]").click();
 await expect(page.locator("[data-onboarding-host]")).toContainText("Paso 1 de 4");
 for(let i=0;i<4;i++){
  await page.locator("[data-onboarding-next]").click();
 }
 await expect(page.locator("[data-onboarding-host]")).toContainText("Recorrido completado");
 await expect.poll(()=>page.evaluate(()=>localStorage.getItem("traza-onboarding-complete"))).toBe("true");
 await expect(page.locator("[data-start-onboarding]")).toContainText("Repetir recorrido");
});
