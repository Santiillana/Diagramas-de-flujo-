import { test, expect, goToSpace } from "./navigation.js";

async function openExercises(page){
  await page.goto("/");
  await goToSpace(page,"exercises");
}

test("el catálogo presenta 45 retos y los cinco accesos rápidos por nivel",async({page})=>{
  await openExercises(page);
  await expect(page.locator("#exercise-count")).toHaveText("45 de 45 ejercicios");
  await expect(page.locator("#exercise-level-shortcuts [data-exercise-level-shortcut]")).toHaveCount(5);
  await expect(page.locator('[data-exercise-level-shortcut="all"]')).toContainText("45");
  await expect(page.locator('[data-exercise-level-shortcut="basic"]')).toContainText("20");
  await expect(page.locator('[data-exercise-level-shortcut="intermediate"]')).toContainText("10");
  await expect(page.locator('[data-exercise-level-shortcut="advanced"]')).toContainText("10");
  await expect(page.locator('[data-exercise-level-shortcut="expert"]')).toContainText("5");
  await expect(page.locator("[data-select-exercise]")).toHaveCount(12);
});

test("los accesos rápidos por dificultad permanecen sincronizados con el selector",async({page})=>{
  await openExercises(page);
  for(const [level,count] of [["basic",20],["intermediate",10],["advanced",10],["expert",5],["all",45]]){
    await page.locator('[data-exercise-level-shortcut="'+level+'"]').click();
    await expect(page.locator("#exercise-level")).toHaveValue(level);
    await expect(page.locator("#exercise-count")).toHaveText(count+" de 45 ejercicios");
    await expect(page.locator('[data-exercise-level-shortcut="'+level+'"]')).toHaveAttribute("aria-pressed","true");
  }
  await page.locator("#exercise-level").selectOption("expert");
  await expect(page.locator('[data-exercise-level-shortcut="expert"]')).toHaveAttribute("aria-pressed","true");
  await expect(page.locator("#exercise-count")).toHaveText("5 de 45 ejercicios");
});

test("el filtro de ejercicios de clase conserva exactamente los cuatro retos asignados",async({page})=>{
  await openExercises(page);
  await page.locator("#exercise-class-only").check();
  await expect(page.locator("#exercise-count")).toHaveText("4 de 45 ejercicios");
  const ids=await page.locator("[data-select-exercise]").evaluateAll(cards=>cards.map(card=>Number(card.getAttribute("data-select-exercise"))).sort((a,b)=>a-b));
  expect(ids).toEqual([22,23,24,28]);
  await page.locator("#exercise-class-only").uncheck();
  await expect(page.locator("#exercise-count")).toHaveText("45 de 45 ejercicios");
});

test("la búsqueda por número o título y la paginación recorren los 45 identificadores sin duplicados",async({page})=>{
  await openExercises(page);
  await page.locator("#exercise-search").fill("23");
  await expect(page.locator("#exercise-count")).toHaveText("1 de 45 ejercicios");
  await expect(page.locator('[data-select-exercise="23"]')).toBeVisible();
  await page.locator("#exercise-filters-clear").click();
  await expect(page.locator("#exercise-count")).toHaveText("45 de 45 ejercicios");

  const ids=[];
  for(let index=0;index<4;index++){
    const current=await page.locator("[data-select-exercise]").evaluateAll(cards=>cards.map(card=>Number(card.getAttribute("data-select-exercise"))));
    ids.push(...current);
    if(index<3)await page.locator("[data-page-next]").click();
  }
  expect(ids).toHaveLength(45);
  expect(new Set(ids).size).toBe(45);
  expect([...ids].sort((a,b)=>a-b)).toEqual(Array.from({length:45},(_,index)=>index+1));
});

test("los conceptos se combinan y los filtros activos se pueden limpiar",async({page})=>{
  await openExercises(page);
  await page.locator("#exercise-concept-details > summary").click();
  await page.locator('[data-concept-filter="Ciclo Para"]').click();
  await expect(page.locator("#exercise-concepts-summary")).toHaveText("1 seleccionado(s)");
  await expect(page.locator("#exercise-filter-summary")).toContainText("1 concepto(s)");
  await expect(page.locator("#exercise-active-filters")).toContainText("Ciclo Para");
  await page.locator('[data-concept-mode="any"]').click();
  await page.locator('[data-concept-filter="Decisiones"]').click();
  await expect(page.locator("#exercise-filter-summary")).toContainText("2 concepto(s)");
  await expect(page.locator("#exercise-active-filters .exercise-active-filter")).toHaveCount(2);
  await page.locator("#exercise-filters-clear").click();
  await expect(page.locator("#exercise-count")).toHaveText("45 de 45 ejercicios");
  await expect(page.locator("#exercise-active-filters")).toBeHidden();
  await expect(page.locator("#exercise-concepts-summary")).toHaveText("Todos los conceptos");
});

test("la ficha amplía el contexto sin revelar pseudocódigo ni solución antes de la confirmación",async({page})=>{
  await openExercises(page);
  await page.locator("#exercise-search").fill("Fibonacci");
  await page.locator('[data-select-exercise="23"]').click();
  await expect(page.locator("#exercise-detail h3")).toHaveText("Fibonacci: términos que no superen 40");
  await expect(page.locator(".exercise-detail-stats")).toContainText("método(s)");
  await expect(page.locator("#exercise-detail")).toContainText("DATOS DE ENTRADA");
  await expect(page.locator("#exercise-detail")).toContainText("RESULTADOS ESPERADOS");
  await expect(page.locator("#exercise-detail")).toContainText("CONDICIONES Y RESTRICCIONES");
  await expect(page.locator("#exercise-detail")).not.toContainText("PSEUDOCÓDIGO");
  await page.locator("[data-start-exercise]").click();
  await expect(page.locator("#exercise-try-modal")).toBeVisible();
  await expect(page.locator("#exercise-try-statement")).toContainText("40");
  await page.locator("#exercise-try-back").click();
  await expect(page.locator("#exercise-try-modal")).toBeHidden();
  await page.locator("[data-start-exercise]").click();
  await page.locator("#exercise-try-confirm").click();
  await expect(page.locator('[data-view="simulator"]')).toBeVisible();
  await expect(page.locator("#simulator-exercise-title")).toContainText("Fibonacci");
});

test("el catálogo, sus filtros y la ficha no producen desbordamiento en móvil",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openExercises(page);
  await page.locator("#exercise-concept-details > summary").click();
  await page.locator('[data-concept-filter="Ciclo Para"]').click();
  await page.locator('[data-select-exercise]').first().click();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.locator("#exercise-detail")).toBeVisible();
});
