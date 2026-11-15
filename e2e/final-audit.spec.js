import { test, expect } from "@playwright/test";

test("captura las cinco secciones en escritorio, tableta y móvil",async({page},testInfo)=>{
  test.setTimeout(90000);
  const viewports=[
    ["desktop",1440,1000],
    ["tablet",1024,768],
    ["mobile",390,844]
  ];
  const spaces=["learn","exercises","simulator","lab","builder"];
  for(const [size,width,height] of viewports){
    await page.setViewportSize({width,height});
    await page.goto("/");
    for(const space of spaces){
      await page.locator('[data-space="'+space+'"]').click();
      await expect(page.locator('[data-view="'+space+'"]')).toBeVisible();
      if(space==="simulator")await expect(page.locator("#flow-svg")).toBeVisible();
      if(space==="lab")await expect(page.locator("#lab-diagram-container svg")).toBeAttached();
      if(space==="builder")await expect(page.locator("#builder-canvas-list")).toBeVisible();
      await page.screenshot({
        path:testInfo.outputPath(size+"-"+space+".png"),
        fullPage:true,
        animations:"disabled"
      });
    }
  }
});

test("un ciclo de 499 vueltas termina sin congelar la interfaz",async({page})=>{
  test.setTimeout(60000);
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  page.on("console",message=>{
    if(["error","warning"].includes(message.type()))errors.push(message.type()+": "+message.text());
  });
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator("#simulator-exercise-picker [data-simulator-exercise='10']").click();
  await page.locator("#simulator-inputs").fill("499");
  await page.locator("#simulator-run").click();
  await expect(page.locator("#simulator-status")).toContainText("TRAZA GENERADA");
  await page.locator("#simulator-last").click();
  await expect(page.locator("#simulator-output li")).toHaveCount(499);
  expect(errors).toEqual([]);
});

test("recorrer los 40 ejercicios no genera errores ni advertencias en consola",async({page})=>{
  test.setTimeout(90000);
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  page.on("console",message=>{
    if(["error","warning"].includes(message.type()))errors.push(message.type()+": "+message.text());
  });
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  for(let id=1;id<=40;id++){
    await page.locator("#simulator-exercise-picker [data-simulator-exercise='"+id+"']").click();
    await expect(page.locator("#simulator-status")).toContainText("TRAZA GENERADA");
  }
  expect(errors).toEqual([]);
});
