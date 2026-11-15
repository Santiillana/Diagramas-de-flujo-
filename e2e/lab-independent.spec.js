import { test, expect } from "@playwright/test";

test("las seis actividades funcionan desde el Laboratorio sin iniciar manualmente el Simulador",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="lab"]').click();
 await expect(page.locator("#lab-diagram-container svg")).toBeVisible();
 await expect(page.locator("#lab-context-title")).not.toContainText("Sin ejecución");
 await page.locator('[data-lab-activity="predict"]').click();
 await expect(page.locator("#lab-task-content [data-predict]")).not.toHaveCount(0);
 await page.locator('[data-lab-activity="table"]').click();
 await expect(page.locator(".lab-trace-table tbody tr").first()).toBeVisible();
 await page.locator('[data-lab-activity="order"]').click();
 await expect(page.locator(".lab-sort-list li").first()).toBeVisible();
 await page.locator('[data-lab-activity="symbol"]').click();
 await expect(page.locator("[data-symbol-choice]").first()).toBeVisible();
 await page.locator('[data-lab-activity="error"]').click();
 await expect(page.locator("[data-error-choice]").first()).toBeVisible();
 await page.locator('[data-lab-activity="whatif"]').click();
 await expect(page.locator("#lab-whatif-code")).toBeVisible();
 await expect(page.locator("#lab-whatif-inputs")).toHaveValue("8, 5");
});

test("el ejemplo guiado puede restaurarse sin borrar el contexto del Laboratorio",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="lab"]').click();
 await page.locator('[data-lab-activity="whatif"]').click();
 await page.locator("#lab-demo-reset").click();
 await expect(page.locator("#lab-context-title")).toContainText("Suma de dos números");
 await expect(page.locator("#lab-current-exercise")).toContainText("EJEMPLO");
 await expect(page.locator("#lab-whatif-code")).toBeVisible();
});

test("una ejecución propia reemplaza el ejemplo guiado y se mantiene sincronizada",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="lab"]').click();
 await page.locator('[data-space="simulator"]').click();
 await page.locator("#simulator-inputs").fill("2,3");
 await page.locator("#simulator-run").click();
 await page.locator('[data-space="lab"]').click();
 await expect(page.locator("#lab-context-title")).toContainText("Suma de dos números");
 await expect(page.locator("#lab-current-exercise")).toContainText("EJERCICIO");
 await expect(page.locator("#lab-variables-content")).toContainText("a");
});

test("la tabla de seguimiento permite completar celdas y señala la primera diferencia",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="lab"]').click();
 await page.locator('[data-lab-activity="table"]').click();
 const first=page.locator("[data-trace-answer]").first();
 await expect(first).toBeVisible();
 await first.fill("respuesta incorrecta");
 await page.locator("#lab-table-check").click();
 await expect(first).toHaveClass(/is-wrong/);
 await expect(page.locator("#lab-table-feedback")).toContainText("Primera diferencia");
});
