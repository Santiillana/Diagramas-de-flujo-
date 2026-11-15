import {test,expect} from "@playwright/test";

async function openLab(page){
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator('[data-space="lab"]').click();
}

test("Laboratorio presenta exactamente tres formas de practicar",async({page})=>{
  await openLab(page);
  await expect(page.locator("#lab-mode-cards [data-lab-mode]")).toHaveCount(3);
  await expect(page.locator("#lab-mode-cards [data-lab-mode='read']")).toContainText("Sigue la ficha");
  await expect(page.locator("#lab-mode-cards [data-lab-mode='build']")).toContainText("Arma el diagrama");
  await expect(page.locator("#lab-mode-cards [data-lab-mode='debug']")).toContainText("Caza el error");
});

test("Sigue la ficha conserva traza y predicción",async({page})=>{
  await openLab(page);
  await page.locator('[data-lab-mode="read"]').click();
  await expect(page.locator("#lab-context-title")).toContainText("Suma de dos números");
  await expect(page.locator("#lab-diagram-container svg")).toBeVisible();
  await page.locator('[data-lab-activity="predict"]').click();
  await page.locator("#lab-task-content [data-predict]").first().click();
  await page.locator("#lab-reveal-prediction").click();
  await expect(page.locator("#lab-predict-feedback")).toContainText("El evento real es");
});

test("Arma el diagrama agrupa ordenar, identificar símbolos y completar huecos",async({page})=>{
  await openLab(page);
  await page.locator('[data-lab-mode="build"]').click();
  await expect(page.locator('#lab-activity-list [data-lab-activity="order"]')).toBeVisible();
  await page.locator('[data-lab-activity="order"]').click();
  await expect(page.locator("#lab-task-title")).toContainText("Ordena instrucciones");
  await page.locator('[data-lab-activity="symbol"]').click();
  await expect(page.locator("#lab-task-title")).toContainText("símbolo");
  await page.locator('[data-lab-activity="fill-gap"]').click();
  await expect(page.locator("#lab-task-title")).toContainText("hueco");
});

test("el lienzo libre vive dentro de Arma el diagrama y permite añadir piezas",async({page})=>{
  await openLab(page);
  await page.locator('[data-lab-mode="build"]').click();
  await page.locator("#lab-open-builder").click();
  await expect(page.locator("#lab-builder-stage")).toBeVisible();
  const cards=page.locator("#builder-canvas-list [data-node-card]");
  const initial=await cards.count();
  await page.locator('#lab-builder-stage [data-add-node="process"]').click();
  await expect(cards).toHaveCount(initial+1);
  await expect(page.locator("#view-lab")).toBeVisible();
  await expect(page.locator("#view-builder")).toHaveCount(0);
});

test("Caza el error localiza la línea y compara una corrección con los mismos datos",async({page})=>{
  await openLab(page);
  await page.locator('[data-lab-mode="debug"]').click();
  await page.locator('[data-lab-activity="error"]').click();
  await page.locator('[data-error-line="0"]').click();
  await expect(page.locator("#lab-task-content")).toContainText("Inicializado en cero");
  await page.locator('[data-error-fix="0"]').click();
  await expect(page.locator("#lab-error-feedback")).toContainText("ANTES · ORIGINAL");
  await expect(page.locator("#lab-error-feedback")).toContainText("DESPUÉS · CORRECCIÓN");
});

test("¿Y si...? compara ambos recorridos e identifica su primera divergencia",async({page})=>{
  await openLab(page);
  await page.locator('[data-lab-mode="debug"]').click();
  await page.locator('[data-lab-activity="whatif"]').click();
  await page.locator("#lab-whatif-code").fill("leer a,b\nimp a-b");
  await page.locator("#lab-whatif-inputs").fill("8,5");
  await page.locator("#lab-whatif-run").click();
  await expect(page.locator("#lab-whatif-result")).toContainText("[13]");
  await expect(page.locator("#lab-whatif-result")).toContainText("[3]");
  await expect(page.locator("#lab-whatif-result")).toContainText("PRIMER PUNTO DE DIVERGENCIA");
});
