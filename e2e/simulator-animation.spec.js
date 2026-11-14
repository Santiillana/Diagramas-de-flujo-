import { test, expect } from "@playwright/test";

test("la ficha recorre la conexión SVG del paso adyacente",async({page})=>{
 await page.emulateMedia({reducedMotion:"no-preference"});
 await page.goto("/");
 await page.locator('[data-space="simulator"]').click();
 const next=page.locator("#simulator-next");
 await next.click();await next.click();await next.click();
 const token=page.locator("#flow-diagram-container .flow-token");
 await expect(token).toHaveAttribute("visibility","visible");
 await expect(token).toHaveAttribute("data-travelling","true");
 await expect(page.locator("#flow-diagram-container .diagram-edge.is-token-path")).toHaveCount(1);
 await expect.poll(()=>token.getAttribute("data-travelling"),{timeout:2500}).toBe(null);
});
test("la rama falsa se distingue con clase y etiqueta F",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="simulator"]').click();
 await page.locator('[data-simulator-exercise="7"]').click();
 const decision=page.locator("#trace-history li").filter({hasText:"DECISIÓN"}).first();
 await decision.click();
 const falseRoutes=page.locator(".diagram-edge.is-route-false");
 await expect(falseRoutes.first()).toBeVisible();
 await expect(falseRoutes.first().locator(".diagram-edge-label")).toContainText("F");
});
test("movimiento completo, reducido y apagado se alternan y persisten",async({page})=>{
 await page.goto("/");
 const button=page.locator('[data-action="toggle-motion"]');
 await expect(page.locator("html")).toHaveAttribute("data-motion","full");
 await button.click();await expect(page.locator("html")).toHaveAttribute("data-motion","reduced");
 await button.click();await expect(page.locator("html")).toHaveAttribute("data-motion","off");
 await button.click();await expect(page.locator("html")).toHaveAttribute("data-motion","full");
 await page.reload();await expect(page.locator("html")).toHaveAttribute("data-motion","full");
});
