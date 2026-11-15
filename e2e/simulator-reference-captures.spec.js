import { test, expect } from "@playwright/test";

test("captura el ejercicio 24 en pasos 1, 3 y 7 en escritorio y móvil",async({page},testInfo)=>{
  const sizes=[
    {name:"desktop",width:1920,height:1080},
    {name:"mobile",width:390,height:844}
  ];
  for(const size of sizes){
    await page.setViewportSize({width:size.width,height:size.height});
    await page.goto("/");
    await page.locator('[data-space="simulator"]').click();
    await page.locator("#sim-exercise-select").selectOption("24");
    await expect(page.locator("#flow-svg")).toBeVisible();
    if(size.name==="mobile"){
      await page.locator('#simulator-mobile-tabs [data-mobile-panel="diagram"]').click();
      await expect(page.locator("#flow-diagram-container")).toBeVisible();
    }
    for(const step of [1,3,7]){
      await page.locator("#simulator-timeline").evaluate((input,value)=>{
        input.value=String(value);
        input.dispatchEvent(new Event("input",{bubbles:true}));
      },step);
      await expect(page.locator("#timeline-count")).toContainText("/");
      await expect(page.locator("#flow-svg")).toBeVisible();
      await page.screenshot({
        path:testInfo.outputPath("exercise-24-step-"+step+"-"+size.name+".png"),
        fullPage:true,animations:"disabled"
      });
    }
  }
});
