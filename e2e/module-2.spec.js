import { test, expect, goToSpace } from "./navigation.js";

test("Aprende conserva las 17 lecciones y cada escena tiene identidad visual",async({page})=>{
  await page.goto("/");
  await goToSpace(page, "learn");
  await expect(page.locator("[data-lesson-id]")).toHaveCount(17);
  await page.locator('[data-lesson-id="variables"]').click();
  await expect(page.locator("#lesson-detail h3")).toHaveText("Variables y asignación");
  await page.locator("[data-lesson-next]").click();
  await expect(page.locator(".lesson-visual")).toBeVisible();
  await expect(page.locator(".lesson-visual .lesson-scene-host")).toBeVisible();
  await expect(page.locator(".lesson-visual [data-visual-next]")).toBeVisible();
});

test("la escena de Aprende permite retroceder, avanzar y reproducir",async({page})=>{
  await page.goto("/");
  await goToSpace(page, "learn");
  await page.locator('[data-lesson-id="variables"]').click();
  await page.locator("[data-lesson-next]").click();
  const initial=Number((await page.locator(".visual-step-count").innerText()).match(/\d+/)?.[0]??1);
  await page.locator("[data-visual-next]").click();
  await expect(page.locator(".visual-step-count")).toContainText(String(initial+1));
  await page.locator("[data-visual-prev]").click();
  await expect(page.locator(".visual-step-count")).toContainText(String(initial));
  await page.locator("[data-visual-play]").click();
  await expect(page.locator("[data-visual-play]")).toHaveAttribute("aria-pressed","true");
  await page.locator("[data-visual-play]").click();
});

test("las 17 lecciones presentan fases visuales y una escena vinculada a eventos",async({page})=>{
  await page.goto("/");
  await goToSpace(page, "learn");
  const lessons=page.locator("[data-lesson-id]");
  await expect(lessons).toHaveCount(17);
  for(let index=0;index<17;index++){
    await lessons.nth(index).click();
    await page.locator("[data-lesson-next]").click();
    const visual=page.locator(".lesson-visual");
    await expect(visual).toBeVisible();
    await expect(visual.locator(".lesson-phase")).not.toHaveCount(0);
    await expect(visual.locator(".lesson-scene-host")).toBeVisible();
    const source=await visual.getAttribute("data-phase-source");
    expect(["lesson","events"]).toContain(source);
  }
});
 
test("el catálogo filtra ejercicios por dificultad y conceptos combinados",async({page})=>{
  await page.goto("/");
  await goToSpace(page, "exercises");
  await expect(page.locator("#exercise-count")).toContainText("45");
  await page.locator("#exercise-level").selectOption("expert");
  await expect(page.locator("[data-select-exercise]")).toHaveCount(5);
  await page.locator("#exercise-level").selectOption("all");
  await page.locator('[data-concept-filter="Ciclo Para"]').click();
  await expect(page.locator("[data-select-exercise]")).not.toHaveCount(0);
  await page.locator('[data-concept-mode="any"]').click();
  await page.locator('[data-concept-filter="Decisiones"]').click();
  await expect(page.locator("#exercise-filter-summary")).toContainText("concepto(s)");
  await page.locator("#exercise-filters-clear").click();
  await expect(page.locator("#exercise-count")).toContainText("45");
});

test("la ficha del ejercicio no revela la solución hasta confirmar en el modal",async({page})=>{
  await page.goto("/");
  await goToSpace(page, "exercises");
  await page.locator("[data-page-next]").click();
  await page.locator('[data-select-exercise="23"]').click();
  await expect(page.locator("#exercise-detail h3")).toHaveText("Fibonacci: términos que no superen 40");
  await expect(page.locator("#exercise-detail")).not.toContainText("PSEUDOCÓDIGO");
  await page.locator("[data-start-exercise]").click();
  await expect(page.locator("#exercise-try-modal")).toBeVisible();
  await expect(page.locator("#exercise-try-statement")).toContainText("40");
  await page.locator("#exercise-try-confirm").click();
  await expect(page.locator('[data-view="simulator"]')).toBeVisible();
  await expect(page.locator("#simulator-exercise-title")).toContainText("Fibonacci");
  await expect(page.locator("#pseudocode-lines")).toContainText("mientras");
});

test("Ejercicios se mantiene dentro del ancho en móvil",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/");
  await goToSpace(page, "exercises");
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
