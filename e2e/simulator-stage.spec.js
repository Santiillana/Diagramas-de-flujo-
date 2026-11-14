import { test, expect } from "@playwright/test";
test("el escenario deja un área libre amplia y ocupa el lienzo",async({page})=>{
 await page.setViewportSize({width:1920,height:1080});await page.goto("/");
 await page.locator('[data-space="simulator"]').click();
 const metrics=await page.locator("#diagram-stage").evaluate(el=>({w:el.clientWidth,h:el.clientHeight,ratio:Number(el.dataset.availableRatio)}));
 expect(metrics.w).toBeGreaterThan(1900);expect(metrics.h).toBeGreaterThan(900);expect(metrics.ratio).toBeGreaterThanOrEqual(55);
 await page.locator("#simulator-panels-toggle").click();
 await expect(page.locator("#simulator-grid")).toHaveClass(/panels-hidden/);
 await page.waitForTimeout(100);
 await expect(page.locator("#diagram-stage svg")).toBeAttached();
});
test("paneles se contraen, se ocultan y recuerdan su estado",async({page})=>{
 await page.setViewportSize({width:1440,height:960});await page.goto("/");await page.locator('[data-space="simulator"]').click();
 const panel=page.locator('[data-floating-panel="problem"]');
 await panel.locator('[data-panel-collapse="problem"]').click();await expect(panel).toHaveClass(/is-panel-collapsed/);
 await panel.locator('[data-panel-collapse="problem"]').click();await expect(panel).not.toHaveClass(/is-panel-collapsed/);
 await panel.locator('[data-panel-hide="problem"]').click();await expect(panel).toBeHidden();
 await page.reload();await page.locator('[data-space="simulator"]').click();
 await expect(page.locator('[data-floating-panel="problem"]')).toBeHidden();
 await page.locator("#simulator-panels-toggle").click();await expect(page.locator('[data-floating-panel="problem"]')).toBeVisible();
});
test("H oculta y restaura paneles pero no intercepta campos",async({page})=>{
 await page.goto("/");await page.locator('[data-space="simulator"]').click();
 await page.keyboard.press("h");await expect(page.locator("#simulator-grid")).toHaveClass(/panels-hidden/);
 await page.keyboard.press("h");await expect(page.locator("#simulator-grid")).not.toHaveClass(/panels-hidden/);
 await page.locator("#simulator-inputs").focus();await page.keyboard.press("h");
 await expect(page.locator("#simulator-grid")).not.toHaveClass(/panels-hidden/);
});
test("las vistas del simulador siguen accesibles por pestañas en móvil",async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto("/");await page.locator('[data-space="simulator"]').click();
 for(const name of ["problem","diagram","scene","variables","output","history"]){
  await page.locator('[data-mobile-panel="'+name+'"]').click();
  await expect(page.locator('[data-mobile-panel="'+name+'"]')).toHaveAttribute("aria-selected","true");
 }
 await expect(page.locator("#diagram-stage svg")).toBeAttached();
});
test("capturas del escenario para escritorio, tableta y móvil",async({page})=>{
 for(const v of [{width:1920,height:1080},{width:1024,height:768},{width:390,height:844}]){
  await page.setViewportSize(v);await page.goto("/");await page.locator('[data-space="simulator"]').click();
  await page.screenshot({path:"test-results/task-a-stage-"+v.width+".png",fullPage:true});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
 }
});
