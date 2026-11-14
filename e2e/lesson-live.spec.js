import { test, expect } from "@playwright/test";
import { lessons } from "../src/content/lessons.js";
import { lessonPrograms } from "../src/content/lesson-programs.js";

test("Aprende ejecuta el mini-programa de la lección con el intérprete y permite cambiar los datos",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="learn"]').click();
 const live=page.locator("[data-lesson-live]");
 await expect(live).toBeVisible();
 await page.locator('[data-lesson-live-action="run"]').click();
 await page.locator('[data-lesson-live-action="last"]').click();
 await expect(page.locator("[data-lesson-live-result]")).toContainText("Programa finalizado");
 await expect(page.locator("[data-lesson-live-output]")).toContainText("8");
 await expect(page.locator("[data-lesson-live-diagram] #lesson-live-flow-svg")).toBeVisible();
 await expect(page.locator('[id="flow-svg"]')).toHaveCount(1);
 await page.locator('[data-lesson-live-action="previous"]').click();
 await expect(page.locator("[data-lesson-live-scene] .scene-visual-output")).toBeVisible();
 await page.locator("[data-lesson-live-input]").fill("5");
 await page.locator('[data-lesson-live-action="run"]').click();
 await page.locator('[data-lesson-live-action="last"]').click();
 await expect(page.locator("[data-lesson-live-output]")).toContainText("10");
});

test("las catorce lecciones ejecutan su pseudocódigo y generan la salida de referencia",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="learn"]').click();
 for(const lesson of lessons){
  await page.locator('[data-lesson-id="'+lesson.id+'"]').click();
  const live=page.locator("[data-lesson-live]");
  await expect(live).toBeVisible();
  await live.locator('[data-lesson-live-action="run"]').click();
  await live.locator('[data-lesson-live-action="last"]').click();
  await expect(live.locator("[data-lesson-live-result]")).toContainText("Programa finalizado");
  const output=live.locator("[data-lesson-live-output]");
  for(const value of lessonPrograms[lesson.id].expectedOutputs){
   await expect(output).toContainText(String(value));
  }
  await expect(live.locator("[data-lesson-live-code] li.is-active")).toHaveCount(0);
 }
});

test("cambiar de lección no arrastra el estado de ejecución anterior",async({page})=>{
 await page.goto("/");
 await page.locator('[data-space="learn"]').click();
 await page.locator('[data-lesson-live-action="run"]').click();
 await page.locator('[data-lesson-live-action="last"]').click();
 await page.locator('[data-lesson-id="decisions"]').click();
 await expect(page.locator("[data-lesson-live-progress]")).toHaveText("Sin ejecución");
 await expect(page.locator("[data-lesson-live-output]")).toContainText("Sin resultados");
});
