import { test, expect } from "@playwright/test";

test("pulido global mantiene cuerpo legible y pseudocódigo a 14 px",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="simulator"]').click();
 const metrics=await page.evaluate(()=>{
  const px=selector=>Number.parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
  return {
   body:px("body"),
   lesson:px("#simulator-exercise-statement"),
   pseudocode:px(".pseudocode-lines li"),
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
  danger:getComputedStyle(document.documentElement).getPropertyValue("--danger").trim(),
  canvas:getComputedStyle(document.documentElement).getPropertyValue("--canvas").trim(),
  positiveSoft:getComputedStyle(document.documentElement).getPropertyValue("--positive-soft").trim(),
  warningSoft:getComputedStyle(document.documentElement).getPropertyValue("--warning-soft").trim(),
  dangerSoft:getComputedStyle(document.documentElement).getPropertyValue("--danger-soft").trim()
 }));
 const contrast=palette=>page.evaluate(values=>{
  const luminance=hex=>{
   const channels=hex.replace("#","").match(/.{2}/g).map(pair=>parseInt(pair,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
   return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
  };
  const ratio=(a,b)=>{const [high,low]=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (high+.05)/(low+.05);};
  return {
   muted:ratio(values.muted,values.canvas),
   positive:ratio(values.positive,values.positiveSoft),
   warning:ratio(values.warning,values.warningSoft),
   danger:ratio(values.danger,values.dangerSoft)
  };
 },palette);
 const light=await read();
 const lightContrast=await contrast(light);
 await page.locator("html").evaluate(el=>el.dataset.theme="dark");
 const dark=await read();
 const darkContrast=await contrast(dark);
 for(const key of ["muted","positive","warning","danger"]){
  expect(light[key]).not.toBe("");
  expect(dark[key]).not.toBe("");
  expect(dark[key]).not.toBe(light[key]);
  expect(lightContrast[key],key+" en tema claro").toBeGreaterThanOrEqual(4.5);
  expect(darkContrast[key],key+" en tema oscuro").toBeGreaterThanOrEqual(4.5);
 }
});
