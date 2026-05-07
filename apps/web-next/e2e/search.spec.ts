import { test, expect } from "@playwright/test";

test.describe("Search", () => {
  test("search page loads", async ({ page }) => {
    await page.goto("/search");
    await expect(page.locator("input[type='search'], input[placeholder*='earch']").first()).toBeVisible();
  });

  test("search with query shows results or empty state", async ({ page }) => {
    await page.goto("/search?q=Kedarkantha");
    // Should show results section or "no results" message — not an error page
    await expect(page.locator("body")).not.toContainText("500");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });
});
