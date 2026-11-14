import { test, expect } from "@playwright/test";

test("los 40 ejercicios se pueden elegir y buscar dentro del simulador",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="simulator"]').click();
 await expect(page.locator("#simulator-exercise-picker [data-simulator-exercise]")).toHaveCount(40);
 await page.locator('[data-simulator-exercise="13"]').click();
 await expect(page.locator('[data-simulator-exercise="13"]')).toHaveAttribute("aria-pressed","true");
 await expect(page.locator("#simulator-inputs")).not.toHaveValue("");
 await expect(page.locator("#pseudocode-lines li").first()).toBeVisible();
 await expect(page.locator("#flow-svg")).toBeVisible();
 await page.locator("#simulator-exercise-search").fill("13");
 await expect(page.locator("#simulator-exercise-picker")).toHaveAttribute("data-visible-count","1");
 await expect(page.locator("#simulator-exercise-picker [data-simulator-exercise]")).toHaveAttribute("data-simulator-exercise","13");
 await page.locator("#simulator-exercise-search").fill("");
 await expect(page.locator("#simulator-exercise-picker [data-simulator-exercise]")).toHaveCount(40);
});

test("el simulador arranca en modo manual y las flechas recorren la misma traza",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="simulator"]').click();
 await page.locator("#diagram-stage").focus();
 const timeline=page.locator("#simulator-timeline");
 const before=await timeline.inputValue();
 await page.waitForTimeout(250);
 await expect(timeline).toHaveValue(before);
 await page.keyboard.press("ArrowRight");
 await expect(timeline).not.toHaveValue(before);
 const next=await timeline.inputValue();
 await page.keyboard.press("ArrowLeft");
 await expect(timeline).toHaveValue(before);
 await page.keyboard.press("End");
 await expect(page.locator("#timeline-count")).toContainText("/");
 await expect(timeline).not.toHaveValue(before);
 await page.keyboard.press("Home");
 await expect(timeline).toHaveValue("0");
});

test("Espacio reproduce y pausa sin reiniciar el paso actual",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="simulator"]').click();
 await page.locator("#diagram-stage").focus();
 await page.keyboard.press("ArrowRight");
 const start=Number(await page.locator("#simulator-timeline").inputValue());
 await page.keyboard.press("Space");
 await page.waitForTimeout(150);
 await page.keyboard.press("Space");
 const end=Number(await page.locator("#simulator-timeline").inputValue());
 expect(end).toBeGreaterThan(start);
});

test("el selector y el ajuste fino controlan 0,25× a 8×",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="simulator"]').click();
 await expect(page.locator("#simulator-speed option")).toHaveCount(6);
 await page.locator("#simulator-speed").selectOption("8");
 await expect(page.locator("#simulator-speed-fine")).toHaveValue("8");
 await expect(page.locator("#simulator-speed-label")).toHaveText("8×");
 await page.locator("#simulator-speed-fine").evaluate(el=>{
   el.value="0.25";el.dispatchEvent(new Event("input",{bubbles:true}));
 });
 await expect(page.locator("#simulator-speed")).toHaveValue("0.25");
 await expect(page.locator("#simulator-speed-label")).toHaveText("0,25×");
});

test("los atajos se ignoran dentro de campos y abren predicción, ayuda y laboratorio",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="simulator"]').click();
 const before=await page.locator("#simulator-timeline").inputValue();
 await page.locator("#simulator-inputs").focus();
 await page.keyboard.press("ArrowRight");
 await expect(page.locator("#simulator-timeline")).toHaveValue(before);
 await page.locator("#diagram-stage").focus();
 await page.keyboard.press("p");
 await expect(page.locator("#simulator-predict-toggle")).toHaveAttribute("aria-pressed","true");
 await page.keyboard.press("?");
 await expect(page.locator("#simulator-shortcuts")).toBeVisible();
 await page.keyboard.press("Escape");
 await expect(page.locator("#simulator-shortcuts")).toBeHidden();
 await page.keyboard.press("l");
 await expect(page.locator('[data-view="lab"]')).toBeVisible();
});
