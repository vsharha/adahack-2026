import { test, expect } from "@playwright/test";

test.describe("Optiver Carbon Portfolio", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display main page title", async ({ page }) => {
    await expect(page).toHaveTitle(/Optiver Carbon Portfolio/);
  });

  test("should display hero section", async ({ page }) => {
    await expect(
      page.getByText(
        "How much does it cost to make a carbon portfolio more reliable?",
      ),
    ).toBeVisible();
  });

  test("should display key metrics", async ({ page }) => {
    await expect(page.getByText("Target Tonnes")).toBeVisible();
    await expect(page.getByText("Diversified Cost")).toBeVisible();
    await expect(page.getByText("Success Rate")).toBeVisible();
  });

  test("should display portfolio comparison chart", async ({ page }) => {
    await expect(page.getByText("Portfolio Comparison")).toBeVisible();
    await expect(
      page.getByText("Cost vs. Modelled Success Rate"),
    ).toBeVisible();
  });

  test("should display holdings table", async ({ page }) => {
    await expect(page.getByText("Portfolio Holdings")).toBeVisible();
    await expect(page.getByText("Diversified Candidate Credits")).toBeVisible();
  });

  test("should support dark mode toggle", async ({ page }) => {
    // Click theme toggle button
    const themeButton = page.getByLabel("Toggle theme");
    await expect(themeButton).toBeVisible();

    // Open dropdown and select dark mode
    await themeButton.click();
    await page.getByText("Dark").click();

    // Verify dark class is applied
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("should copy summary to clipboard", async ({ page }) => {
    const copyButton = page.getByText("Copy summary");
    await expect(copyButton).toBeVisible();

    // Grant clipboard permissions
    const context = page.context();
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await copyButton.click();
    await expect(page.getByText("Copied!")).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 390, height: 844 });

    // Verify key sections are still visible
    await expect(page.getByText("Optiver Carbon Portfolio")).toBeVisible();
    await expect(page.getByText("Target Tonnes")).toBeVisible();
  });
});
