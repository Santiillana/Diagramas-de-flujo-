import { test, expect, goToSpace } from "./navigation.js";
async function openLearn(page){await page.goto("/");await goToSpace(page, "learn");}
test("Aprende organiza las 17 lecciones en cinco bloques progresivos",async({page})=>{
 await openLearn(page);
 await expect(page.locator("#lesson-catalog [data-lesson-id]")).toHaveCount(17);
 await expect(page.locator(".lesson-catalog-group-title")).toHaveText(["01 · Fundamentos","02 · Figuras básicas","03 · Variables y operaciones","04 · Decisiones y rutas","05 · Ciclos"]);
});
test("cada lección explica cuándo se usa, muestra una escena, resuelve un ejemplo y comprueba comprensión",async({page})=>{
 await openLearn(page);
 const ids=["algorithm","reading","terminals","input","process","output","variables","arithmetic","comparisons","decisions","nested-decisions","counters-accumulators","for","while","do-while","nested-loops","validation-sentinel"];
 for(const id of ids){
  await page.locator('[data-lesson-id="'+id+'"]').click();
  await expect(page.locator("[data-when-to-use]")).toBeVisible();
  await page.locator("[data-lesson-next]").click();
  const visual=page.locator(".lesson-visual");
  await expect(visual).toHaveAttribute("data-lesson-id",id);
  await expect(visual.locator(".lesson-scene-host")).toBeVisible();
  await expect(visual.locator(".lesson-phase")).not.toHaveCount(0);
  if(id==="for")await expect(visual.locator(".lesson-phase")).toHaveCount(5);
  await page.locator("[data-lesson-next]").click();
  await expect(page.locator(".lesson-worked-steps li")).toHaveCount(3);
  await page.locator("[data-lesson-next]").click();
  await expect(page.locator(".lesson-common-error")).toBeVisible();
  await expect(page.locator(".lesson-option")).toHaveCount(3);
 }
});
test("la escena avanza, retrocede y respeta el movimiento reducido",async({page})=>{
 await page.addInitScript(()=>localStorage.setItem("traza:v2:motion","full"));
 await openLearn(page);
 await page.locator('[data-lesson-id="while"]').click();
 await page.locator("[data-lesson-next]").click();
 const first=await page.locator(".visual-step-count").innerText();
 await page.locator("[data-visual-next]").click();
 await expect(page.locator(".visual-step-count")).not.toHaveText(first);
 await page.locator("[data-visual-prev]").click();
 await page.locator("[data-visual-reset]").click();
 await page.locator('[data-action="toggle-motion"]').click();
 await page.locator("[data-visual-play]").click();
 await expect(page.locator("[data-visual-play]")).toHaveAttribute("aria-pressed","false");
});
test("la prueba interactiva ejecuta el pseudocódigo real con datos modificados",async({page})=>{
 await openLearn(page);
 await page.locator('[data-lesson-id="algorithm"]').click();
 await page.locator("[data-lesson-next]").click();
 await page.locator("[data-lesson-next]").click();
 await page.locator(".lesson-interactive-test > summary").click();
 await page.locator("#lesson-data-input").fill("5");
 await page.locator("[data-run-mini-program]").click();
 await expect(page.locator("#lesson-data-result")).toContainText("Salida: 10");
});
test("Aprende conserva una composición legible en escritorio y móvil",async({page},testInfo)=>{
 await page.setViewportSize({width:1440,height:900});
 await openLearn(page);
 await page.locator('[data-lesson-id="decisions"]').click();
 await page.locator("[data-lesson-next]").click();
 await expect(page.locator(".lesson-visual .lesson-scene-host")).toBeVisible();
 await page.screenshot({path:testInfo.outputPath("learn-desktop.png"),fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.locator('[data-lesson-id="do-while"]').click();
 await page.locator("[data-lesson-next]").click();
 await expect(page.locator(".lesson-visual .lesson-scene-host")).toBeVisible();
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 expect(overflow).toBeLessThanOrEqual(1);
 await page.screenshot({path:testInfo.outputPath("learn-mobile.png"),fullPage:true});
});
