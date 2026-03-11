import { test, expect } from "@playwright/test";

test("app loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Create Next App|paraglider/i);
});

test("simulator route renders", async ({ page }) => {
  await page.goto("/simulator");
  const hud = page.getByTestId("hud");
  await expect(hud).toBeVisible();
  await expect(hud).toContainText("SPD");
  await expect(hud).toContainText("ALT");
});
