import { test, expect } from "@playwright/test";

test("app loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Paraglider Simulator/i);
});

test("simulator route renders", async ({ page }) => {
  await page.goto("/simulator");
  const hud = page.getByTestId("hud");
  await expect(hud).toBeVisible();
  await expect(hud).toContainText("SPD");
  await expect(hud).toContainText("ALT");
});

test("home navigates to simulator", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Paraglider Simulator/i })).toBeVisible();

  await page.getByRole("link", { name: /Launch Simulator/i }).first().click();
  await expect(page).toHaveURL(/\/simulator/);
  await expect(page.getByTestId("hud")).toBeVisible();
});

test("settings panel opens and closes", async ({ page }) => {
  await page.goto("/simulator");
  await expect(page.getByTestId("hud")).toBeVisible();

  const settingsBtn = page.getByTestId("settings-button");
  await settingsBtn.click();

  const panel = page.getByTestId("settings-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Instellingen");

  await panel.getByRole("button", { name: "Sluiten" }).click();
  await expect(panel).not.toBeVisible();
});

test("settings toggles can be changed", async ({ page }) => {
  await page.goto("/simulator");
  page.getByTestId("settings-button").click();

  const panel = page.getByTestId("settings-panel");
  await expect(panel).toBeVisible();

  const varioCheckbox = page.getByTestId("setting-vario");
  await expect(varioCheckbox).toBeChecked();
  await varioCheckbox.click();
  await expect(varioCheckbox).not.toBeChecked();
  await varioCheckbox.click();
  await expect(varioCheckbox).toBeChecked();
});

test("volume sliders persist after refresh", async ({ page }) => {
  await page.goto("/simulator");
  page.getByTestId("settings-button").click();

  const varioVolume = page.getByTestId("setting-vario-volume");
  await expect(varioVolume).toBeVisible();
  await varioVolume.evaluate((el: HTMLInputElement) => {
    el.value = "75";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(await varioVolume.inputValue()).toBe("75");

  await page.reload();
  await expect(page.getByTestId("hud")).toBeVisible();
  page.getByTestId("settings-button").click();

  const varioVolumeAfter = page.getByTestId("setting-vario-volume");
  await expect(varioVolumeAfter).toHaveValue("75");
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

test("restart flow from pause overlay", async ({ page }) => {
  await page.goto("/simulator");
  await expect(page.getByTestId("hud")).toBeVisible();

  page.getByTestId("pause-button").click();
  const overlay = page.getByTestId("pause-overlay");
  await expect(overlay).toBeVisible();

  await overlay.getByRole("button", { name: "Opnieuw" }).click();
  await expect(overlay).not.toBeVisible();
  await expect(page.getByTestId("hud")).toBeVisible();
});

test("settings in pause overlay", async ({ page }) => {
  await page.goto("/simulator");
  page.getByTestId("pause-button").click();

  const overlay = page.getByTestId("pause-overlay");
  await overlay.getByRole("button", { name: "Instellingen" }).click();

  const panel = page.getByTestId("settings-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Variometer");
});

test("landing flow shows post-flight summary", async ({ page }) => {
  test.setTimeout(95000);
  await page.goto("/simulator");
  await expect(page.getByTestId("hud")).toBeVisible();

  await page.keyboard.press("ArrowUp", { delay: 50000 });
  const landedOverlay = page.getByTestId("landed-overlay");
  await expect(landedOverlay).toBeVisible({ timeout: 45000 });
  await expect(landedOverlay).toContainText("Geland");

  const summary = page.getByTestId("landing-summary");
  await expect(summary).toBeVisible();
  await expect(summary).toContainText("Vluchttijd");
});

test("full session smoke - no crash", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Launch Simulator/i }).first().click();
  await expect(page).toHaveURL(/\/simulator/);
  await expect(page.getByTestId("hud")).toBeVisible();

  page.getByTestId("settings-button").click();
  await expect(page.getByTestId("settings-panel")).toBeVisible();
  page.getByTestId("settings-panel").getByRole("button", { name: "Sluiten" }).click();

  page.getByTestId("pause-button").click();
  await expect(page.getByTestId("pause-overlay")).toBeVisible();
  page.getByTestId("pause-overlay").getByRole("button", { name: "Hervat" }).click();

  page.getByTestId("pause-button").click();
  page.getByTestId("pause-overlay").getByRole("button", { name: "Opnieuw" }).click();

  await expect(page.getByTestId("hud")).toBeVisible();
});
