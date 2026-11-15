import { test } from "@playwright/test";

test("diagnóstico de reparto horizontal de la barra",async({page})=>{
  for(const width of [1920,1440,1280,1024]){
    await page.setViewportSize({width,height:900});
    await page.goto("/");
    await page.locator('[data-space="simulator"]').click();
    const measured=await page.evaluate(()=>{
      const rect=selector=>{
        const el=document.querySelector(selector);if(!el)return null;
        const r=el.getBoundingClientRect(),s=getComputedStyle(el);
        return {selector,x:r.x,right:r.right,width:r.width,y:r.y,height:r.height,display:s.display,position:s.position,flex:s.flex,minWidth:s.minWidth,maxWidth:s.maxWidth,overflow:s.overflow};
      };
      return {
        header:rect("#hd"),brand:rect(".brand"),nav:rect("#primary-nav"),toolbar:rect("#simulator-toolbar"),
        strip:rect("#sim-exercise-strip"),search:rect("#sim-exercise-search"),filter:rect("#sim-exercise-level-filter"),
        select:rect("#sim-exercise-select"),controls:rect(".sim-toolbar-controls"),camera:rect("#diagram-camera-toggle"),
        zoomIn:rect("#diagram-zoom-in"),textSmaller:rect("#simulator-text-smaller"),actions:rect(".topbar-actions"),
        navBuilder:rect('[data-space="builder"]')
      };
    });
    console.log("TOOLBAR_LAYOUT "+width+" "+JSON.stringify(measured));
  }
});
