import { test, expect } from "@playwright/test";

test("zoom de rueda conserva el punto bajo el cursor y respeta límites 0,25–3",async({page})=>{
  await page.setViewportSize({width:1920,height:1080});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await expect(page.locator("#flow-svg")).toBeVisible();
  const hit=await page.locator("#diagram-pan-hit").boundingBox();
  const x=hit.x+hit.width*.52,y=hit.y+hit.height*.48;
  const pointBefore=await page.evaluate(({x,y})=>{
    const stage=document.querySelector("#diagram-stage").getBoundingClientRect();
    const canvas=document.querySelector("#flow-diagram-container");
    const zoom=Number(canvas.dataset.cameraZoom),cx=Number(canvas.dataset.cameraX),cy=Number(canvas.dataset.cameraY);
    return {x:(x-stage.left-cx)/zoom,y:(y-stage.top-cy)/zoom,zoom};
  },{x,y});
  await page.mouse.move(x,y);
  await page.mouse.wheel(0,-120);
  const pointAfter=await page.evaluate(({x,y})=>{
    const stage=document.querySelector("#diagram-stage").getBoundingClientRect();
    const canvas=document.querySelector("#flow-diagram-container");
    const zoom=Number(canvas.dataset.cameraZoom),cx=Number(canvas.dataset.cameraX),cy=Number(canvas.dataset.cameraY);
    return {x:(x-stage.left-cx)/zoom,y:(y-stage.top-cy)/zoom,zoom};
  },{x,y});
  expect(Math.abs(pointBefore.x-pointAfter.x)).toBeLessThanOrEqual(2);
  expect(Math.abs(pointBefore.y-pointAfter.y)).toBeLessThanOrEqual(2);
  await expect(page.locator("#sim-camera-follow")).toBeVisible();
  for(let i=0;i<40;i++)await page.mouse.wheel(0,-1000);
  let zoom=Number(await page.locator("#flow-diagram-container").getAttribute("data-camera-zoom"));
  expect(zoom).toBeLessThanOrEqual(3);
  for(let i=0;i<100;i++)await page.mouse.wheel(0,1000);
  zoom=Number(await page.locator("#flow-diagram-container").getAttribute("data-camera-zoom"));
  expect(zoom).toBeGreaterThanOrEqual(.25);
});

test("el minimapa refleja el diagrama y permite volver a centrar la cámara",async({page})=>{
  await page.setViewportSize({width:1920,height:1080});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  const minimap=page.locator("#sim-minimap");
  await expect(minimap).toBeVisible();
  await expect(page.locator("#sim-minimap-svg .minimap-nodes rect")).not.toHaveCount(0,{timeout:5000});
  const initialCamera=await page.locator("#diagram-camera-toggle").getAttribute("aria-pressed");
  expect(initialCamera).toBe("true");
  const before=await page.locator("#flow-diagram-container").getAttribute("data-camera-x");
  const box=await page.locator("#sim-minimap-svg").boundingBox();
  await page.mouse.click(box.x+box.width*.72,box.y+box.height*.5);
  await expect(page.locator("#sim-camera-follow")).toBeVisible();
  const after=await page.locator("#flow-diagram-container").getAttribute("data-camera-x");
  expect(after).not.toBe(before);
  await page.locator("#sim-camera-follow").click();
  await expect(page.locator("#diagram-camera-toggle")).toHaveAttribute("aria-pressed","true");
  await expect(page.locator("#sim-camera-follow")).toBeHidden();
});
