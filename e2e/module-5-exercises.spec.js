import {test,expect} from "@playwright/test";

test("Ejercicios conserva los 45 problemas, busca y pagina sin perder el catálogo",async({page})=>{
  await page.goto("/");
  await expect(page.locator("#exercise-count")).toContainText("45 de 45");
  await expect(page.locator("#exercise-grid [data-select-exercise]")).toHaveCount(12);
  await expect(page.locator(".exercise-pagination")).toContainText("Página 1 de 4");
  await page.locator("[data-page-next]").click();
  await expect(page.locator(".exercise-pagination")).toContainText("Página 2 de 4");
  await expect(page.locator('#exercise-grid [data-select-exercise="13"]')).toBeVisible();
  await page.locator("#exercise-search").fill("Fibonacci");
  await expect(page.locator("#exercise-count")).toHaveText("1 de 45 ejercicios");
  await expect(page.locator('#exercise-grid [data-select-exercise="23"]')).toBeVisible();
  await page.locator("#exercise-search").fill("");
  await expect(page.locator("#exercise-count")).toHaveText("45 de 45 ejercicios");
});

test("los filtros combinan dificultad y metadatos con modo Todos o Cualquiera",async({page})=>{
  await page.goto("/");
  await page.locator("#exercise-level").selectOption("basic");
  await expect(page.locator("#exercise-count")).toHaveText("20 de 45 ejercicios");

  await page.locator('#exercise-concepts [data-concept-filter="Ciclo Para"]').click();
  await page.locator('#exercise-concepts [data-concept-filter="Contadores"]').click();
  const allCount=Number((await page.locator("#exercise-count").textContent()).match(/^\d+/)?.[0]??0);
  expect(allCount).toBeGreaterThan(0);

  await page.locator('[data-concept-mode="any"]').click();
  const anyCount=Number((await page.locator("#exercise-count").textContent()).match(/^\d+/)?.[0]??0);
  expect(anyCount).toBeGreaterThanOrEqual(allCount);
  await expect(page.locator('[data-concept-mode="any"]')).toHaveAttribute("aria-pressed","true");

  await page.locator("#exercise-filters-clear").click();
  await expect(page.locator("#exercise-level")).toHaveValue("all");
  await expect(page.locator("#exercise-count")).toHaveText("45 de 45 ejercicios");
  await expect(page.locator('[data-concept-mode="all"]')).toHaveAttribute("aria-pressed","true");
  await expect(page.locator("#exercise-concepts .is-selected")).toHaveCount(0);
});

test("la ficha y el modal permiten intentar el ejercicio sin revelar el método antes de tiempo",async({page})=>{
  await page.goto("/");
  await page.locator("#exercise-search").fill("Suma de dos números");
  await page.locator('[data-select-exercise="1"]').click();
  const detail=page.locator("#exercise-detail");
  await expect(detail).toContainText("Suma de dos números");
  await expect(detail).toContainText("OBJETIVO");
  await expect(detail).toContainText("DATOS QUE DEBES CONSIDERAR");
  await expect(detail).toContainText("CONDICIONES Y RESTRICCIONES");
  await expect(detail.locator("pre,code,.lesson-code")).toHaveCount(0);

  await detail.locator("[data-start-exercise]").click();
  const modal=page.locator("#exercise-try-modal");
  await expect(modal).toBeVisible();
  await expect(modal).toContainText("ANTES DE VER LA SOLUCIÓN");
  await expect(modal).toContainText("Lee dos números e imprime su suma.");
  await expect(modal).toContainText("Datos de entrada");
  await expect(modal.locator("pre,code")).toHaveCount(0);

  await page.locator("#exercise-try-back").click();
  await expect(modal).toBeHidden();
  await expect(page.locator("#exercise-search")).toHaveValue("Suma de dos números");
  await expect(detail).toContainText("Suma de dos números");
  await expect(page.locator('[data-select-exercise="1"]')).toHaveAttribute("aria-pressed","true");
});

test("Confirmar Ya lo intenté abre el ejercicio con ciclos que se seleccionó",async({page})=>{
  await page.goto("/");
  await page.locator("#exercise-search").fill("Contar de 1 hasta N");
  await page.locator('[data-select-exercise="10"]').click();
  await expect(page.locator("#exercise-detail")).toContainText("Ciclo Para");
  await page.locator("#exercise-detail [data-start-exercise]").click();
  await expect(page.locator("#exercise-try-modal")).toBeVisible();
  await page.locator("#exercise-try-confirm").click();
  await expect(page.locator("#view-simulator")).toBeVisible();
  await expect(page.locator("#simulator-exercise-number")).toHaveText("10");
  await expect(page.locator("#simulator-exercise-title")).toHaveText("Contar de 1 hasta N");
  await expect(page.locator("#simulator-inputs")).toHaveValue("4");
});

test("el catálogo y sus filtros caben en escritorio y móvil",async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto("/");
  await expect(page.locator("#exercise-grid")).toBeVisible();
  await expect(page.locator("#exercise-detail")).toBeVisible();
  await page.screenshot({path:"test-results/module-5-exercises-desktop.png",fullPage:true});

  await page.setViewportSize({width:390,height:844});
  await page.reload();
  const geometry=await page.evaluate(()=>({
    viewport:window.innerWidth,
    document:document.documentElement.scrollWidth,
    filter:document.querySelector(".catalog-filter-panel")?.getBoundingClientRect().width,
    cards:[...document.querySelectorAll("#exercise-grid .exercise-card")].map(el=>el.getBoundingClientRect().width)
  }));
  expect(geometry.document).toBeLessThanOrEqual(geometry.viewport);
  expect(geometry.filter).toBeGreaterThan(0);
  expect(geometry.cards.every(width=>width>0)).toBe(true);
  await page.screenshot({path:"test-results/module-5-exercises-mobile.png",fullPage:true});
});
