import { test, expect } from "@playwright/test";

test("la navegación principal contiene exactamente cuatro espacios",async({page})=>{
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/");
  const spaces=["learn","exercises","simulator","lab"];
  await expect(page.locator("#primary-nav [data-space]")).toHaveCount(4);
  for(const space of spaces){
    await page.locator('#primary-nav [data-space="'+space+'"]').click();
    await expect(page.locator('[data-view="'+space+'"]')).toBeVisible();
    await expect(page.locator('#primary-nav [data-space="'+space+'"]')).toHaveAttribute("aria-current","page");
    await expect(page.locator("body")).toHaveAttribute("data-active-space",space);
  }
  await expect(page.locator('[data-view="builder"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

const headerViewports = [
  {name:"pantalla amplia",width:1920},
  {name:"referencia",width:1649},
  {name:"escritorio",width:1440},
  {name:"tableta",width:1024},
  {name:"móvil",width:390}
];

test("la barra superior conserva una sola fila y no se corta en los cinco anchos de referencia",async({page})=>{
  for(const viewport of headerViewports){
    await page.setViewportSize({width:viewport.width,height:1000});
    await page.goto("/");
    await expect(page.locator("#primary-nav [data-space]")).toHaveCount(4);
    const geometry=await page.evaluate(()=>{
      const rect=selector=>{
        const r=document.querySelector(selector).getBoundingClientRect();
        return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height};
      };
      const header=document.querySelector("#hd");
      const nav=document.querySelector("#primary-nav");
      return {
        brand:rect(".brand"),nav:rect("#primary-nav"),actions:rect(".topbar-actions"),
        centers:[".brand","#primary-nav",".topbar-actions"].map(selector=>{
          const r=document.querySelector(selector).getBoundingClientRect();return r.top+r.height/2;
        }),
        headerOverflow:header.scrollWidth-header.clientWidth,
        navOverflow:nav.scrollWidth-nav.clientWidth,
        pageOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
      };
    });
    expect(Math.max(...geometry.centers)-Math.min(...geometry.centers),viewport.name+" debe mantener marca, navegación y acciones en una fila").toBeLessThanOrEqual(3);
    expect(geometry.brand.right).toBeLessThanOrEqual(geometry.nav.left+1);
    expect(geometry.nav.right).toBeLessThanOrEqual(geometry.actions.left+1);
    expect(geometry.headerOverflow).toBeLessThanOrEqual(1);
    expect(geometry.navOverflow).toBeLessThanOrEqual(1);
    expect(geometry.pageOverflow).toBeLessThanOrEqual(1);
    for(const space of ["learn","exercises","simulator","lab"]){
      await page.locator('#primary-nav [data-space="'+space+'"]').click();
      await expect(page.locator('[data-view="'+space+'"]')).toBeVisible();
      await expect(page.locator('#primary-nav [data-space="'+space+'"]')).toHaveAttribute("aria-current","page");
    }
    await page.locator("#hd").screenshot({path:"test-results/module-1-header-"+viewport.width+".png"});
  }
});

for(const viewport of [
  {name:"pantalla amplia",width:1920,height:1000},
  {name:"referencia",width:1649,height:1000},
  {name:"escritorio",width:1440,height:1000},
  {name:"tableta",width:1024,height:768},
  {name:"móvil",width:390,height:844}
]){
  test("los cuatro espacios no desbordan el ancho en "+viewport.name,async({page})=>{
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    await page.goto("/");
    for(const space of ["exercises","learn","simulator","lab"]){
      await page.locator('#primary-nav [data-space="'+space+'"]').click();
      await expect(page.locator('[data-view="'+space+'"]')).toBeVisible();
      const width=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      expect(width,"desbordamiento en "+space+" a "+viewport.width+"px").toBeLessThanOrEqual(1);
    }
  });
}

test("el Simulador conserva sus cuatro ventanas y el dock dentro de su lienzo",async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  for(const selector of ["#sim-window-context","#sim-window-code","#PV","#PR","#dock","#flow-svg"]){
    await expect(page.locator(selector)).toBeVisible();
  }
  await expect(page.locator("#simulator-output-details")).toBeAttached();
  await expect(page.locator("#simulator-history-details")).toBeAttached();
  const dock=await page.locator("#dock").boundingBox();
  const stage=await page.locator("#diagram-stage").boundingBox();
  expect(dock).not.toBeNull();expect(stage).not.toBeNull();
  expect(dock.y).toBeGreaterThan(stage.y);
});

test("tema y movimiento reducido responden a los controles",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion","reduced");
  await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
  await page.locator('[data-action="toggle-theme"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-theme","light");
  await page.locator('[data-action="toggle-motion"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-motion","full");
});
