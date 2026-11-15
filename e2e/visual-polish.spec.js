import { test, expect } from "@playwright/test";

test("pulido global mantiene cuerpo legible y pseudocódigo a 14 px",async({page})=>{
 await page.goto("/");
 await page.locator('[data-select-exercise="1"]').click();
 const metrics=await page.evaluate(()=>{
  const px=selector=>Number.parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
  return {
   body:px("body"),
   lesson:px("#lesson-detail .lesson-explanation p"),
   pseudocode:px(".exercise-pseudocode"),
   dock:px(".simulator-dock #dock-step-title")
  };
 });
 expect(metrics.body).toBeGreaterThanOrEqual(14);
 expect(metrics.lesson).toBeGreaterThanOrEqual(14);
 expect(metrics.pseudocode).toBeGreaterThanOrEqual(14);
 expect(metrics.dock).toBeGreaterThanOrEqual(16);
});
test("tema claro y oscuro conservan los tokens de contraste semántico",async({page})=>{
 await page.goto("/");
 const read=()=>page.evaluate(()=>({
  muted:getComputedStyle(document.documentElement).getPropertyValue("--muted").trim(),
  positive:getComputedStyle(document.documentElement).getPropertyValue("--positive").trim(),
  warning:getComputedStyle(document.documentElement).getPropertyValue("--warning").trim(),
  danger:getComputedStyle(document.documentElement).getPropertyValue("--danger").trim()
 }));
 const light=await read();
 await page.locator("html").evaluate(el=>el.dataset.theme="dark");
 const dark=await read();
 for(const key of ["muted","positive","warning","danger"]){
  expect(light[key]).not.toBe("");
  expect(dark[key]).not.toBe("");
  expect(dark[key]).not.toBe(light[key]);
 }
});
