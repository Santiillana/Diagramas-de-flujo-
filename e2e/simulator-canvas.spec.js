import { test, expect } from "@playwright/test";

test("la rueda desplaza el lienzo; solo Ctrl/⌘+rueda y los botones hacen zoom",async({page})=>{
  await page.setViewportSize({width:1920,height:1080});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await expect(page.locator("#flow-svg")).toBeVisible();
  const canvas=page.locator("#flow-diagram-container");
  const before=await canvas.evaluate(el=>({
    x:Number(el.dataset.cameraX),y:Number(el.dataset.cameraY),zoom:Number(el.dataset.cameraZoom)
  }));
  const hit=await page.locator("#diagram-pan-hit").boundingBox();
  await page.mouse.move(hit.x+hit.width*.5,hit.y+hit.height*.5);
  await page.mouse.wheel(0,180);
  const after=await canvas.evaluate(el=>({
    x:Number(el.dataset.cameraX),y:Number(el.dataset.cameraY),zoom:Number(el.dataset.cameraZoom)
  }));
  expect(after.y).not.toBe(before.y);
  expect(after.zoom).toBeCloseTo(before.zoom,5);
  await expect(page.locator("#diagram-camera-toggle")).toHaveAttribute("aria-pressed","false");
  await expect(page.locator("#sim-camera-follow")).toHaveCount(0);
  await expect(page.getByText("Cámara libre · Seguir el proceso")).toHaveCount(0);

  await page.evaluate(()=>{
    const target=document.querySelector("#diagram-pan-hit");
    target.dispatchEvent(new WheelEvent("wheel",{deltaY:-120,ctrlKey:true,bubbles:true,cancelable:true,clientX:innerWidth/2,clientY:innerHeight/2}));
  });
  const ctrlZoom=Number(await canvas.getAttribute("data-camera-zoom"));
  expect(ctrlZoom).toBeGreaterThan(after.zoom);

  await page.locator("#diagram-zoom-in").click();
  const buttonZoom=Number(await canvas.getAttribute("data-camera-zoom"));
  expect(buttonZoom).toBeGreaterThan(ctrlZoom);
  await page.locator("#diagram-zoom-out").click();
  const smaller=Number(await canvas.getAttribute("data-camera-zoom"));
  expect(smaller).toBeLessThan(buttonZoom);
  await page.locator("#diagram-fit").click();
  await expect.poll(async()=>Number(await canvas.getAttribute("data-camera-zoom"))).toBeCloseTo(1,4);
});

test("no existe minimapa y la cámara se reactiva en el siguiente paso",async({page})=>{
  await page.setViewportSize({width:1920,height:1080});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await expect(page.locator("#sim-minimap")).toHaveCount(0);
  await expect(page.locator(".sim-minimap")).toHaveCount(0);
  await expect(page.locator("#sim-camera-follow")).toHaveCount(0);
  await page.locator("#diagram-camera-toggle").click();
  await expect(page.locator("#diagram-camera-toggle")).toHaveAttribute("aria-pressed","false");
  await page.locator("#simulator-next").click();
  await expect(page.locator("#diagram-camera-toggle")).toHaveAttribute("aria-pressed","true");
});

test("la ficha recorre las rutas SVG y dibuja el rastro activo e histórico",async({page})=>{
  await page.setViewportSize({width:1920,height:1080});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  for(let step=0;step<3;step++)await page.locator("#simulator-next").click();
  await expect(page.locator("#flow-diagram-container .flow-token")).toHaveAttribute("visibility","visible");
  await expect(page.locator("#diagram-stage #flow-active-trail")).toBeAttached();
  await expect(page.locator("#diagram-stage #flow-trail")).toBeAttached();
  await expect.poll(async()=>((await page.locator("#diagram-stage #flow-active-trail").getAttribute("points"))??"").trim().split(/\s+/).length).toBeGreaterThan(1);
  await expect(page.locator("#flow-svg .diagram-edge.is-token-route")).not.toHaveCount(0);
});
