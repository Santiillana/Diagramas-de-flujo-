import { test, expect, openDiagramLessons } from "./navigation.js";

test("Aprende organiza las 17 lecciones en cuatro bloques y una ruta lateral",async({page})=>{
  await page.goto("/");
  await openDiagramLessons(page);
  await expect(page.locator("#lesson-catalog [data-lesson-id]")).toHaveCount(17);
  await expect(page.locator(".lesson-catalog-group-title")).toHaveText([
    "01 · Fundamentos","02 · Datos y operaciones","03 · Decisiones","04 · Ciclos"
  ]);
  await expect(page.locator("#lesson-route-count")).toHaveText("1 de 17");
  await expect(page.locator(".lesson-glossary summary")).toHaveText("Glosario del tema");
});

test("el progreso de lectura es continuo y completa solo tras practicar o saltar",async({page})=>{
  await page.goto("/");
  await openDiagramLessons(page);
  await page.locator('#lesson-catalog [data-lesson-id="algorithm"]').click();
  await expect(page.locator(".lesson-reading-progress")).toBeVisible();
  await expect(page.locator("#lesson-idea")).toBeVisible();
  await expect(page.locator("#lesson-concept")).toBeVisible();
  await expect(page.locator("#lesson-term")).toBeVisible();
  await expect(page.locator("#lesson-example")).toBeVisible();
  await expect(page.locator("#lesson-practice")).toBeVisible();
  const done=page.locator("[data-lesson-complete]");
  await expect(done).toBeDisabled();
  await page.locator("[data-skip-practice]").click();
  await expect(done).toBeEnabled();
  await done.click();
  await expect(page.locator(".lesson-completion")).toHaveText("COMPLETADA");
  await expect(page.locator("[data-lesson-next]")).toBeVisible();
});

test("cada lección conserva escena, ejemplo ejecutable y comprobación inmediata",async({page})=>{
  await page.goto("/");
  await openDiagramLessons(page);
  const ids=["algorithm","reading","terminals","input","process","output","variables","arithmetic","comparisons","decisions","nested-decisions","counters-accumulators","for","while","do-while","nested-loops","validation-sentinel"];
  for(const id of ids){
    await page.locator('#lesson-catalog [data-lesson-id="'+id+'"]').click();
    const reader=page.locator("#lesson-detail");
    await expect(reader.locator("#lesson-concept .lesson-scene-host")).toBeVisible();
    await expect(reader.locator("#lesson-example .lesson-worked-steps li").first()).toBeVisible();
    await expect(reader.locator("#lesson-practice .lesson-option")).toHaveCount(3);
    await expect(reader.locator("[data-visual-player]")).toBeVisible();
  }
});

test("la escena avanza con controles y muestra su secuencia estática",async({page})=>{
  await page.goto("/");
  await openDiagramLessons(page);
  await page.locator('#lesson-catalog [data-lesson-id="while"]').click();
  const first=await page.locator(".visual-step-count").innerText();
  await page.locator("[data-visual-next]").click();
  await expect(page.locator(".visual-step-count")).not.toHaveText(first);
  await page.locator("[data-visual-prev]").click();
  await page.locator("[data-visual-reset]").click();
  await page.locator(".lesson-static-sequence summary").click();
  await expect(page.locator(".lesson-static-sequence li")).not.toHaveCount(0);
});

test("el movimiento reducido abre la secuencia estática y evita reproducir",async({page})=>{
  await page.addInitScript(()=>localStorage.setItem("traza:v2:motion","reduced"));
  await page.goto("/");
  await openDiagramLessons(page);
  await page.locator('#lesson-catalog [data-lesson-id="while"]').click();
  await expect(page.locator(".lesson-static-sequence")).toHaveAttribute("open","");
  await page.locator("[data-visual-play]").click();
  await expect(page.locator("[data-visual-play]")).toHaveAttribute("aria-pressed","false");
});

test("las lecciones se mantienen dentro del ancho en móvil",async({page})=>{
  await page.setViewportSize({width:375,height:812});
  await page.goto("/");
  await openDiagramLessons(page);
  await page.locator("[data-learn-list]").click();
  await page.locator('#lesson-catalog [data-lesson-id="decisions"]').click();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.locator("[data-learn-list]").click();
  await expect(page.locator(".lesson-catalog-panel")).toBeVisible();
});
