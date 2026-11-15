import { test, expect } from "@playwright/test";

test("las ventanas se minimizan, fijan y restauran desde el rail",async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  const variables=page.locator('#PR > .variables-panel');
  await expect(variables).toBeVisible();
  await page.locator('[data-window-pin="variables"]').click();
  await expect(page.locator('[data-window-pin="variables"]')).toHaveAttribute("aria-pressed","true");
  await page.locator('[data-window-minimize="variables"]').click();
  await expect(variables).toBeHidden();
  await page.locator('#sim-window-rail [data-window-restore="variables"]').click();
  await expect(variables).toBeVisible();
  await expect(page.locator('[data-window-pin="variables"]')).toHaveAttribute("aria-pressed","true");
});

test("la ventana contextual no tapa la figura activa ni sale del viewport",async({page})=>{
  await page.setViewportSize({width:1920,height:1080});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator("#simulator-next").click();
  await expect(page.locator("#vf")).toHaveAttribute("data-anchor-node","1");
  const report=await page.evaluate(()=>{
    const vf=document.querySelector("#vf");const anchor=vf?.dataset.anchorNode;const node=anchor?document.querySelector("#flow-node-"+anchor):null;
    if(!vf||vf.hidden||!node)return null;
    const a=vf.getBoundingClientRect(),b=node.getBoundingClientRect();
    return {vf:{left:a.left,top:a.top,right:a.right,bottom:a.bottom},node:{left:b.left,top:b.top,right:b.right,bottom:b.bottom}};
  });
  expect(report).not.toBeNull();
  expect(report.vf.left).toBeGreaterThanOrEqual(0);
  expect(report.vf.top).toBeGreaterThanOrEqual(54);
  expect(report.vf.right).toBeLessThanOrEqual(1920);
  expect(report.vf.bottom).toBeLessThanOrEqual(1080);
  const overlap=report.vf.left<report.node.right&&report.vf.right>report.node.left&&report.vf.top<report.node.bottom&&report.vf.bottom>report.node.top;
  expect(overlap).toBe(false);
});
