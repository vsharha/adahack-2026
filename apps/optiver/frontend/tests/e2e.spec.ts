import { test, expect } from "@playwright/test";

const appUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.beforeEach(async ({ page }) => {
  await page.goto(appUrl);
});

test("shows the portfolio decision and comparison", async ({ page }) => {
  await expect(
    page.getByRole("heading", {
      name: "The cheapest tonne is rarely the safest.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "The cost of being wrong" }),
  ).toBeVisible();
  await expect(page.getByText("$181,659").first()).toBeVisible();
});

test("shared-risk selection updates linked results", async ({ page }) => {
  await page.getByRole("button", { name: /ρ = 0.3/ }).click();
  await expect(
    page.getByText("Modelled target hit rate").locator(".."),
  ).toContainText("98.3%");
  await expect(page.locator(".comparison-head")).toContainText("ρ=0.3");
});

test("full-group shock check shows both failure and resilience", async ({
  page,
}) => {
  const drill = page.locator("#shock");
  await expect(drill).toContainText("66,668 tCO₂e");
  await expect(drill).toContainText("Target missed");

  await drill.getByRole("button", { name: /Country China/ }).click();
  await expect(drill).toContainText("108,336 tCO₂e");
  await expect(drill).toContainText("Target met");
});

test("theme and copy controls work", async ({ page, context }) => {
  await page.getByRole("button", { name: "Toggle theme" }).click();
  await page.getByRole("menuitem", { name: /Dark/ }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Copy summary to clipboard" }).click();
  await expect(page.getByText("Copied", { exact: true })).toBeVisible();
});

test("first render follows the system theme and saved preference", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.evaluate(() => localStorage.removeItem("optiver-appearance"));
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).colorScheme,
    ),
  ).toBe("dark");

  await page.evaluate(() =>
    localStorage.setItem("optiver-appearance", "light"),
  );
  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).colorScheme,
    ),
  ).toBe("light");
});

test("mobile layout keeps the hero and page within the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator('[data-hero-card="mandate"]')).toContainText(
    "100,000",
  );
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasOverflow).toBe(false);
});
