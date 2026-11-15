import { test, expect } from "@playwright/test";

test("la navegación activa cada uno de los cinco espacios", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/");
  const spaces = ["learn", "exercises", "simulator", "lab", "builder"];
  for (const space of spaces) {
    await page.locator(`[data-space="${space}"]`).click();
    await expect(page.locator(`[data-view="${space}"]`)).toBeVisible();
    await expect(page.locator(`[data-space="${space}"]`)).toHaveAttribute("aria-current", "page");
    await expect(page.locator("body")).toHaveAttribute("data-active-space", space);
  }
  expect(pageErrors).toEqual([]);
});

for (const viewport of [
  { name: "escritorio", width: 1440, height: 1000 },
  { name: "tableta horizontal", width: 1024, height: 768 },
  { name: "móvil", width: 390, height: 844 }
]) {
  test(`las cinco vistas no provocan desbordamiento horizontal en ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    for (const space of ["exercises", "learn", "simulator", "lab", "builder"]) {
      await page.locator(`[data-space="${space}"]`).click();
      await expect(page.locator(`[data-view="${space}"]`)).toBeVisible();
      const report = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        offenders: [...document.querySelectorAll("body *")].map(element => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {tag:element.tagName,id:element.id,className:typeof element.className==="string"?element.className:"",left:Math.round(rect.left),right:Math.round(rect.right),width:Math.round(rect.width),overflow:style.overflow,position:style.position};
        }).filter(item => item.width>0 && item.right>innerWidth+1 && item.overflow!=="hidden").sort((a,b)=>b.right-a.right).slice(0,12)
      }));
      const overflow = report.scrollWidth-report.width;
      expect(overflow, `overflow horizontal en ${space} a ${viewport.width}px: ${JSON.stringify(report.offenders)}`).toBeLessThanOrEqual(1);
    }
  });
}

test("el dock ocupa su propia fila y no cubre el diagrama", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  const diagram = await page.locator(".diagram-panel").boundingBox();
  const dock = await page.locator(".execution-dock").boundingBox();
  expect(diagram).not.toBeNull();
  expect(dock).not.toBeNull();
  expect(dock.y).toBeGreaterThanOrEqual(diagram.y + diagram.height);
});

test("tema y movimiento reducido responden a controles y preferencia del sistema", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.locator('[data-action="toggle-theme"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.locator('[data-action="toggle-motion"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "full");
});

test("el prototipo original permanece enlazado y accesible", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('a[href="./reference/diagramas_de_flujo_original.html"]').first()).toHaveAttribute("target", "_blank");
  const response = await page.request.get("/reference/diagramas_de_flujo_original.html");
  expect(response.ok()).toBeTruthy();
});
