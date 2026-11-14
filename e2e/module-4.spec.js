import { test, expect } from "@playwright/test";

test("Laboratorio conserva la traza y permite predecir el siguiente paso", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator('[data-space="lab"]').click();
  await expect(page.locator("#lab-context-title")).toContainText("Suma de dos números");
  await expect(page.locator("#lab-diagram-container svg")).toBeVisible();
  await page.locator('[data-lab-activity="predict"]').click();
  await expect(page.locator("#lab-task-title")).toHaveText("Predice el siguiente paso");
  await page.locator("#lab-task-content [data-predict]").first().click();
  await page.locator("#lab-reveal-prediction").click();
  await expect(page.locator("#lab-predict-feedback")).toContainText("El evento real es");
});

test("Tabla de seguimiento refleja los snapshots y la fila activa", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator('[data-space="lab"]').click();
  await page.locator('[data-lab-activity="table"]').click();
  await expect(page.locator(".lab-trace-table tbody tr").first()).toBeVisible();
  const rows=await page.locator(".lab-trace-table tbody tr").count();
  expect(rows).toBeGreaterThan(3);
  await expect(page.locator(".lab-trace-table tbody tr.is-current")).toHaveCount(1);
});

test("Ordena instrucciones, identifica símbolos y detecta errores por contraejemplo", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator('[data-space="lab"]').click();
  await page.locator('[data-lab-activity="order"]').click();
  await page.locator("#lab-order-check").click();
  await expect(page.locator("#lab-order-feedback")).toContainText("fuera de lugar");
  await page.locator('[data-lab-activity="symbol"]').click();
  await page.locator('[data-symbol-choice="Paralelogramo"]').click();
  await expect(page.locator("#lab-symbol-feedback")).toContainText("Correcto");
  await page.locator('[data-lab-activity="error"]').click();
  await page.locator('[data-error-choice="incorrect"]').click();
  await expect(page.locator("#lab-error-feedback")).toContainText("Buena detección");
});

test("¿Y si…? compara el resultado original con un pseudocódigo modificado sin alterar la simulación", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator('[data-space="lab"]').click();
  await page.locator('[data-lab-activity="whatif"]').click();
  await page.locator("#lab-whatif-code").fill("leer a,b\nimp a-b");
  await page.locator("#lab-whatif-inputs").fill("8,5");
  await page.locator("#lab-whatif-run").click();
  await expect(page.locator("#lab-whatif-result")).toContainText("[13]");
  await expect(page.locator("#lab-whatif-result")).toContainText("[3]");
  await expect(page.locator("#lab-context-title")).toContainText("Suma de dos números");
});

test("Constructor ejecuta los presets de secuencia y decisión en el motor común", async ({ page }) => {
  const pageErrors=[];
  page.on("pageerror",error=>pageErrors.push(error.stack??error.message));
  await page.goto("/");
  await page.locator('[data-space="builder"]').click();
  await page.locator('[data-builder-preset="sequence"]').click();
  await page.locator("#builder-inputs").fill("8");
  await page.locator("#builder-run").click();
  await expect(page.locator("#builder-last")).toBeEnabled();
  const initialTimeline = await page.locator("#builder-timeline-label").getAttribute("data-current-step");
  const totalSteps=Number(await page.locator("#builder-timeline-label").getAttribute("data-total-steps"));
  await page.locator("#builder-last").click();
  await expect(page.locator("#builder-last")).toHaveAttribute("data-last-seek-after",String(totalSteps-1));
  await expect(page.locator("#builder-timeline-label")).toHaveAttribute("data-current-step",String(totalSteps));
  expect(await page.locator("#builder-timeline-label").getAttribute("data-current-step")).not.toBe(initialTimeline);
  await expect(page.locator("#builder-runtime-message")).toContainText("Ejecución de");
  await expect(page.locator("#builder-output")).toContainText("16");
  expect(pageErrors).toEqual([]);
  await page.locator('[data-builder-preset="decision"]').click();
  await page.locator("#builder-inputs").fill("5");
  await page.locator("#builder-run").click();
  await page.locator("#builder-last").click();
  await expect(page.locator("#builder-output")).toContainText("1");
  await page.locator("#builder-inputs").fill("-2");
  await page.locator("#builder-run").click();
  await page.locator("#builder-last").click();
  await expect(page.locator("#builder-output")).toContainText("0");
});

test("Constructor ejecuta Para, Mientras y Hacer–Mientras", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-space="builder"]').click();
  await page.locator('[data-builder-preset="for"]').click();
  await page.locator("#builder-run").click();
  await page.locator("#builder-last").click();
  await expect(page.locator("#builder-output")).toContainText("10");
  await page.locator('[data-builder-preset="while"]').click();
  await page.locator("#builder-run").click();
  await page.locator("#builder-last").click();
  await expect(page.locator("#builder-output")).toContainText("1");
  await expect(page.locator("#builder-output")).toContainText("3");
  await page.locator('[data-builder-preset="doWhile"]').click();
  await page.locator("#builder-run").click();
  await page.locator("#builder-last").click();
  await expect(page.locator("#builder-output")).toContainText("3");
});

test("Valida bloques faltantes y permite anidar instrucciones dentro de una rama", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-space="builder"]').click();
  await page.locator('[data-builder-preset="empty"]').click();
  await page.locator("#builder-validate").click();
  await expect(page.locator("#builder-errors")).toContainText("Añade al menos una instrucción");
  await page.locator('[data-builder-preset="decision"]').click();
  await page.locator(".builder-node-nested [data-scope-slot='trueBranch']").click();
  await expect(page.locator("#builder-breadcrumb")).toContainText("Rama Verdadera");
  await page.locator('[data-add-node="process"]').click();
  await expect(page.locator("#builder-canvas-list")).toContainText("Proceso");
  await page.locator("#builder-validate").click();
  await expect(page.locator("#builder-status")).toHaveText("ESTRUCTURA VÁLIDA");
});

test("Laboratorio y constructor se adaptan a escritorio, tableta y móvil", async ({ page }) => {
  for (const viewport of [{width:1440,height:960},{width:1024,height:768},{width:390,height:844}]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.locator('[data-space="lab"]').click();
    let overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.locator('[data-space="builder"]').click();
    overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
});


test("el constructor permite seleccionar, editar y reordenar instrucciones", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-space="builder"]').click();
  await page.locator('[data-builder-preset="sequence"]').click();
  const processCard=page.locator('[data-node-card]').filter({hasText:"Proceso"}).first();
  await processCard.locator("[data-select-node]").click();
  await expect(page.locator("#builder-inspector-content")).toContainText("Expresión");
  await page.locator('#builder-inspector-content [data-inspector-field="expression"]').fill("x*3");
  await page.locator("#builder-inspector-form button[type=submit]").click();
  await page.locator("#builder-inputs").fill("8");
  await page.locator("#builder-run").click();
  await page.locator("#builder-last").click();
  await expect(page.locator("#builder-output")).toContainText("24");
  await expect(page.locator("#builder-code")).toContainText("doble=x*3");
});
