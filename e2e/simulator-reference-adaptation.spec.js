import { test, expect } from "@playwright/test";

test("la navegación rápida muestra los 45 ejercicios reales del repositorio",async({page})=>{
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  const quick=page.locator("#simulator-exercise-nav [data-exercise-shortcut]");
  await expect(quick).toHaveCount(45);
  await expect(page.locator("#sim-exercise-select option")).toHaveCount(45);
  await expect(page.locator("#sim-exercise-level-filter option[value='expert']")).toHaveCount(1);
  await page.locator("#simulator-exercise-nav-toggle").click();
  await expect(page.locator("#simulator-exercise-nav")).toHaveClass(/is-open/);
  await expect(quick.filter({hasText:"45"})).toHaveCount(1);

  await page.locator('#simulator-exercise-nav [data-exercise-shortcut="5"]').click();
  await expect(page.locator("#simulator-challenge")).toBeVisible();
  await expect(page.locator("#simulator-challenge-title")).toContainText("Mayor de dos números");
  await expect(page.locator("#simulator-challenge-statement")).toContainText("Lee dos números");
  await page.locator("#simulator-challenge-reveal").click();
  await expect(page.locator("#simulator-challenge")).toBeHidden();
  await expect(page.locator("#simulator-exercise-title")).toHaveText("Mayor de dos números");
});

test("el reto previo se puede reabrir y el modo demostración se conserva",async({page})=>{
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator("#simulator-challenge-reopen").click();
  await expect(page.locator("#simulator-challenge")).toBeVisible();
  await page.locator("#simulator-challenge-skip").check();
  await page.locator("#simulator-challenge-reveal").click();
  await page.locator("#simulator-exercise-nav-toggle").click();
  await page.locator('#simulator-exercise-nav [data-exercise-shortcut="6"]').click();
  await expect(page.locator("#simulator-challenge")).toBeHidden();
  await page.locator("#simulator-challenge-reopen").click();
  await expect(page.locator("#simulator-challenge")).toBeVisible();
  await expect(page.locator("#simulator-challenge-skip")).toBeChecked();
});

test("los métodos se muestran como opciones visuales y siguen usando el selector del motor",async({page})=>{
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  const methods=page.locator("#simulator-method-tabs [data-method-index]");
  await expect(methods).toHaveCount(2);
  await expect(methods.nth(0)).toHaveAttribute("aria-pressed","true");
  await methods.nth(1).click();
  await expect(methods.nth(1)).toHaveAttribute("aria-pressed","true");
  await expect(page.locator("#simulator-method")).toHaveValue("1");
  await expect(page.locator("#pseudocode-lines")).toContainText("imp a+b");
  await page.locator("#simulator-inputs").fill("8 5");
  await page.locator("#simulator-run").click();
  await page.locator("#simulator-last").click();
  await expect(page.locator("#simulator-output")).toContainText("13");
});

test("cada paso explica su símbolo y el orden de ejecución",async({page})=>{
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await expect(page.locator(".scene-symbol-explanation")).toContainText("Óvalo · Inicio");
  const input=page.locator("#trace-history li").filter({hasText:"ENTRADA"}).first();
  await input.click();
  await expect(page.locator(".scene-symbol-explanation")).toContainText("Paralelogramo · Entrada");
  await expect(page.locator(".scene-order-explanation summary")).toHaveText("¿Por qué se ejecuta en este orden?");
  const assignment=page.locator("#trace-history li").filter({hasText:"ASIGNACIÓN"}).first();
  await assignment.click();
  await expect(page.locator(".scene-symbol-explanation")).toContainText("Rectángulo · Proceso");
  const output=page.locator("#trace-history li").filter({hasText:"SALIDA"}).first();
  await output.click();
  await expect(page.locator(".scene-symbol-explanation")).toContainText("Documento · Salida");
});

test("las acciones de práctica abren el laboratorio sobre la traza actual",async({page})=>{
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator("#simulator-practice-actions [data-simulator-practice='table']").click();
  await expect(page.locator('[data-view="lab"]')).toBeVisible();
  await expect(page.locator("#lab-task-title")).toContainText("Tabla de seguimiento");
  await expect(page.locator("#lab-task-content")).not.toContainText("Primero necesitas una ejecución");
});
