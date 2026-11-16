import { expect } from "@playwright/test";

const FICHA_SPACES = new Set(["hoy", "semana", "calendario", "actividades", "biblioteca"]);

export async function goToSpace(page, space) {
  if (space === "home") {
    await page.locator('.brand[data-go="home"]').click();
    return;
  }

  const section = FICHA_SPACES.has(space) ? "ficha" : "aprende";
  const current = await page.locator("html").getAttribute("data-section");
  const switcher = page.locator('[data-section-switch="' + section + '"]');

  if (current !== section || !(await switcher.isVisible())) {
    if (!(await switcher.isVisible())) {
      await page.locator('.brand[data-go="home"]').click();
    }
    await page.locator('[data-section-switch="' + section + '"]').click();
  }

  await page.locator('#primary-nav [data-space="' + space + '"]').click();
}
