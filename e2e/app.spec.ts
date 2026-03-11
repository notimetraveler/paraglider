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

test("pause button shows pause overlay", async ({ page }) => {
  await page.goto("/simulator");
  const pauseBtn = page.getByTestId("pause-button");
  await expect(pauseBtn).toBeVisible();

  await pauseBtn.click();
  const overlay = page.getByTestId("pause-overlay");
  await expect(overlay).toBeVisible();
  await expect(overlay).toContainText("Pauze");

  await overlay.getByRole("button", { name: "Hervat" }).click();
  await expect(overlay).not.toBeVisible();
});
