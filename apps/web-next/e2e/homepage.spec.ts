import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads and shows hero section", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/TrekYatra/);
    await expect(page.getByText("Find the right trail")).toBeVisible();
  });

  test("search bar is interactive", async ({ page }) => {
    await page.goto("/");
    const searchInput = page.locator("input[placeholder='Trek name or keyword']");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Kedarkantha");
    await page.locator("button", { hasText: "Discover" }).click();
    await expect(page).toHaveURL(/\/search/);
  });

  test("quick search pill navigates to search", async ({ page }) => {
    await page.goto("/");
    await page.locator("button", { hasText: "Beginner snow treks" }).click();
    await expect(page).toHaveURL(/\/search\?q=/);
  });

  test("operators CTA section visible and links to /operators", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Find your guide. Trek with confidence.")).toBeVisible();
    const browseBtn = page.getByRole("link", { name: /Browse operators/ });
    await expect(browseBtn).toBeVisible();
    await browseBtn.click();
    await expect(page).toHaveURL("/operators");
  });

  test("Plan My Trek CTA links to /plan", async ({ page }) => {
    await page.goto("/");
    const planBtn = page.getByRole("link", { name: /Plan My Trek/ }).last();
    await planBtn.click();
    await expect(page).toHaveURL("/plan");
  });

  test("mobile layout renders correctly at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.getByText("Find the right trail")).toBeVisible();
  });
});
