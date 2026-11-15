import { test, expect } from "@playwright/test";

test("En escena muestra una ficha de entrada, operación y salida según el evento",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="simulator"]').click();
 await expect(page.locator("#scene-content .scene-visual-start")).toBeVisible();
 await page.locator("#simulator-next").click();
 await expect(page.locator("#scene-content .scene-visual-input")).toContainText("DATO RECIBIDO");
 await page.locator("#simulator-next").click();
 await page.locator("#simulator-next").click();
 await expect(page.locator("#scene-content .scene-visual-assignment")).toBeVisible();
 await expect(page.locator("#scene-content .scene-event-technical")).toContainText("s=a+b");
 await page.locator("#simulator-next").click();
 await expect(page.locator("#scene-content .scene-visual-output")).toContainText("13");
});

test("En escena representa la condición y la rama elegida",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="simulator"]').click();
 await page.locator('[data-simulator-exercise="7"]').click();
 await page.locator("#trace-history li").filter({hasText:"DECISIÓN"}).first().click();
 await expect(page.locator("#scene-content .scene-visual-decision")).toBeVisible();
 await expect(page.locator("#scene-content .scene-visual-branch.is-chosen-false")).toBeVisible();
 await expect(page.locator("#scene-content .scene-visual-result")).toContainText("F");
});

test("En escena representa el ciclo Para y la vuelta actual",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="simulator"]').click();
 await page.locator('[data-simulator-exercise="10"]').click();
 await expect(page.locator("#simulator-status")).toContainText("TRAZA GENERADA");
 const initialization=page.locator("#trace-history [data-history-step]").filter({hasText:"INICIALIZACIÓN"}).first();
 await expect(initialization).toBeVisible();
 await initialization.click();
 await expect(page.locator("#scene-content .scene-visual-loop-init")).toBeVisible();
 const group=page.locator("#trace-history details.trace-loop-group").first();
 await group.locator("summary").click();
 const iteration=group.locator("[data-history-step]").first();
 await iteration.click();
 await expect(page.locator("#scene-content .scene-visual-loop-enter")).toBeVisible();
 await expect(page.locator("#scene-content .scene-visual-loop-ring")).toBeVisible();
});
