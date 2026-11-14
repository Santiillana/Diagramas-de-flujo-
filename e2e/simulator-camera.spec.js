import { test, expect } from "@playwright/test";

test("la cámara sigue los nodos con movimiento suave y puede reactivarse",async({page})=>{
 await page.emulateMedia({reducedMotion:"no-preference"});
 await page.goto("/");
 await page.locator('[data-space="simulator"]').click();
 const stage=page.locator("#diagram-stage");
 await page.locator("#simulator-next").click();
 await expect(stage).toHaveAttribute("data-camera-target","1");
 await expect.poll(()=>stage.getAttribute("data-pan-offset"),{timeout:2500}).not.toBe("0,0");
 await page.locator("#diagram-camera-toggle").click();
 await expect(page.locator("#diagram-camera-toggle")).toHaveAttribute("aria-pressed","false");
 await page.locator("#diagram-camera-toggle").click();
 await expect(page.locator("#diagram-camera-toggle")).toHaveAttribute("aria-pressed","true");
 await page.locator("#simulator-next").click();
 await expect.poll(()=>stage.getAttribute("data-camera-target")).toBe("2");
});

test("la rueda acerca el diagrama al cursor y desactiva la cámara automática",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="simulator"]').click();
 const stage=page.locator("#diagram-stage"),box=await stage.boundingBox();
 await page.mouse.move(box.x+box.width*.55,box.y+box.height*.45);
 await page.mouse.wheel(0,-180);
 await expect.poll(async()=>Number(await stage.getAttribute("data-zoom"))).toBeGreaterThan(1);
 await expect(page.locator("#diagram-camera-toggle")).toHaveAttribute("aria-pressed","false");
 await expect(stage).toHaveAttribute("data-wheel-zoom","1");
 await page.locator("#diagram-fit").click();
 await expect(stage).toHaveAttribute("data-zoom","1.000");
});

test("el gesto de pellizco modifica el zoom alrededor del centro de los dedos",async({page})=>{
 await page.setViewportSize({width:800,height:900});
 await page.goto("/");
 await page.locator('[data-space="simulator"]').click();
 const stage=page.locator("#diagram-stage");
 await stage.evaluate(el=>{
  const send=(type,id,x,y)=>el.dispatchEvent(new PointerEvent(type,{
   bubbles:true,cancelable:true,pointerId:id,pointerType:"touch",isPrimary:id===11,
   clientX:x,clientY:y,button:0,buttons:type==="pointerup"?0:1
  }));
  const box=el.getBoundingClientRect(),y=box.top+box.height*.55;
  send("pointerdown",11,box.left+box.width*.35,y);
  send("pointerdown",12,box.left+box.width*.65,y);
  send("pointermove",11,box.left+box.width*.20,y);
  send("pointermove",12,box.left+box.width*.80,y);
  send("pointerup",12,box.left+box.width*.80,y);
  send("pointerup",11,box.left+box.width*.20,y);
 });
 await expect(stage).toHaveAttribute("data-pinch-start","1");
 await expect.poll(async()=>Number(await stage.getAttribute("data-zoom"))).toBeGreaterThan(1);
 await expect(page.locator("#diagram-camera-toggle")).toHaveAttribute("aria-pressed","false");
});

test("pantalla completa ajusta el diagrama al viewport y sale por el control interno",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="simulator"]').click();
 const stage=page.locator("#diagram-stage");
 await page.locator("#diagram-fullscreen").click();
 await expect.poll(()=>page.evaluate(()=>Boolean(document.fullscreenElement))).toBe(true);
 await expect(stage).toHaveAttribute("data-fullscreen","true");
 await expect(page.locator("#diagram-fullscreen-exit")).toBeVisible();
 await expect.poll(()=>stage.getAttribute("data-available-width")).toBeTruthy();
 await page.locator("#diagram-fullscreen-exit").click();
 await expect.poll(()=>page.evaluate(()=>Boolean(document.fullscreenElement))).toBe(false);
 await expect(stage).toHaveAttribute("data-fullscreen","false");
});
