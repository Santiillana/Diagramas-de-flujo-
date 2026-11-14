import { test, expect } from "@playwright/test";

test("la guía abre desde Aprende y enfoca el símbolo de la lección actual",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="learn"]').click();
 await page.locator('[data-lesson-id="variables"]').click();
 await page.locator('[data-open-symbol-guide][data-guide-topic="process"]').first().click();
 const dialog=page.locator("#symbol-guide-dialog");
 await expect(dialog).toBeVisible();
 await expect(dialog.locator("#guide-process")).toBeVisible();
 await expect(dialog.locator("#guide-process")).toHaveClass(/is-contextual/);
 await expect(dialog).toContainText("EXPLICACIÓN TÉCNICA");
 await dialog.locator("[data-guide-close]").click();
 await expect(dialog).not.toBeVisible();
});

test("la pestaña de ciclos diferencia el orden de ejecución y la cantidad mínima de vueltas",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="learn"]').click();
 await page.locator('[data-open-symbol-guide]').first().click();
 const dialog=page.locator("#symbol-guide-dialog");
 await dialog.locator('[data-guide-category="cycles"]').click();
 await expect(dialog.locator("[data-guide-card]")).toHaveCount(4);
 await expect(dialog.locator("#guide-while")).toContainText("cero iteraciones");
 await expect(dialog.locator("#guide-do-while")).toContainText("al menos una vez");
 await expect(dialog.locator("#guide-for")).toContainText("preparación");
 await expect(dialog.locator("#guide-nested-loops")).toContainText("ciclo interior");
});

test("la guía también abre desde el Simulador y el filtro localiza figuras",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="simulator"]').click();
 await page.locator('[data-open-symbol-guide][data-guide-topic="figures"]').click();
 const dialog=page.locator("#symbol-guide-dialog");
 await expect(dialog).toBeVisible();
 await dialog.locator("[data-guide-search]").fill("rombo");
 await expect(dialog.locator("[data-guide-card]")).toHaveCount(1);
 await expect(dialog.locator("#guide-decision")).toBeVisible();
 await page.keyboard.press("Escape");
 await expect(dialog).not.toBeVisible();
});
