import { test, expect, goToSpace } from "./navigation.js";

test("las figuras y bifurcaciones se leen sin recortes en móvil, tableta y escritorio",async({page})=>{
  for(const width of [375,768,1280]){
    await page.setViewportSize({width,height:860});
    await page.goto("/");
    await goToSpace(page,"simulator");
    await page.locator("#simulator-controls-toggle").click();
    await page.locator("#sim-exercise-select").selectOption("7");
    await expect(page.locator("#flow-diagram-container #flow-node-2 text")).toContainText("¿n≥3?");
    const labels=page.locator("#flow-diagram-container .diagram-edge-label-wrap");
    await expect(labels.filter({hasText:"Sí ✓"}).first()).toBeVisible();
    await expect(labels.filter({hasText:"No ✗"}).first()).toBeVisible();
    await page.locator("#sim-exercise-select").selectOption("10");
    await expect(page.locator("#flow-diagram-container .diagram-node.node-for .for-label")).toContainText("i = 1; i≤n; i++");
    await page.locator("#simulator-next").click();
    await page.locator("#simulator-next").click();
    await expect(page.locator("#scene-content")).toHaveAttribute("data-event-type","loop-init");
    await expect(page.locator("#flow-diagram-container .for-part-0")).toHaveClass(/is-active-part/);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    if(width===1280)await page.locator("#diagram-stage").screenshot({path:"test-results/simulator-diagram-redesign.png"});
  }
});
