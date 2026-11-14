import { test, expect } from "@playwright/test";

test("el modo reto libera tres pistas en orden sin revelar la solución",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="exercises"]').click();
 await page.locator('[data-select-exercise="1"]').click();
 const gate=page.locator(".exercise-gate");
 const hint=gate.locator("[data-exercise-hint]");
 await expect(hint).toHaveText("Ver pista 1 de 3");
 await expect(page.locator(".exercise-reasoning")).toBeHidden();
 await expect(page.locator(".exercise-methods")).toBeHidden();
 await hint.click();
 await expect(page.locator("[data-gate-feedback]")).toContainText("Pista 1 de 3 · Orientación");
 await expect(hint).toHaveText("Ver pista 2 de 3");
 await hint.click();
 await expect(page.locator("[data-gate-feedback]")).toContainText("Pista 2 de 3 · Estrategia");
 await expect(hint).toHaveText("Ver pista 3 de 3");
 await hint.click();
 await expect(page.locator("[data-gate-feedback]")).toContainText("Pista 3 de 3 · Verificación");
 await expect(hint).toBeDisabled();
 await expect(page.locator(".exercise-methods")).toBeHidden();
 await page.locator("[data-reveal-solution]").click();
 await expect(page.locator(".exercise-reasoning")).toBeVisible();
 await expect(page.locator(".exercise-reasoning")).toContainText("COMPRENDER");
 await expect(page.locator(".method-comparison")).toBeVisible();
 await expect(page.locator(".method-comparison-list article")).toHaveCount(2);
 await expect(page.locator(".method-approach")).toBeVisible();
});

test("una ficha de un método explica su razonamiento sin inventar una comparación",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="exercises"]').click();
 await page.locator('[data-select-exercise="7"]').click();
 await page.locator("[data-reveal-solution]").click();
 await expect(page.locator(".exercise-reasoning")).toBeVisible();
 await expect(page.locator(".method-approach")).toBeVisible();
 await expect(page.locator(".method-comparison")).toHaveCount(0);
});

test("las pistas vuelven al primer nivel al cambiar de ejercicio",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="exercises"]').click();
 await page.locator('[data-select-exercise="1"]').click();
 await page.locator("[data-exercise-hint]").click();
 await page.locator('[data-select-exercise="4"]').click();
 await expect(page.locator("[data-exercise-hint]")).toHaveText("Ver pista 1 de 3");
});
