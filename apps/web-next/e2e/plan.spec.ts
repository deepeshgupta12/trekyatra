import { test, expect } from "@playwright/test";

test.describe("Trip planning wizard", () => {
  test("plan page loads with step 1", async ({ page }) => {
    await page.goto("/plan");
    await expect(page.getByText("Find your perfect trek")).toBeVisible();
    await expect(page.getByText("Step 1 of 4")).toBeVisible();
  });

  test("wizard advances through all 4 steps", async ({ page }) => {
    await page.goto("/plan");
    // Step 1 → 2
    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page.getByText("Step 2 of 4")).toBeVisible();
    // Step 2 → 3: select experience
    await page.locator("input[type='radio']").first().check();
    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page.getByText("Step 3 of 4")).toBeVisible();
    // Step 3 → 4
    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page.getByText("Step 4 of 4")).toBeVisible();
  });

  test("generate plan button triggers API call", async ({ page }) => {
    await page.goto("/plan");
    // Walk through all steps
    await page.getByRole("button", { name: /Continue/ }).click();
    await page.locator("input[type='radio']").first().check();
    await page.getByRole("button", { name: /Continue/ }).click();
    await page.getByRole("button", { name: /Continue/ }).click();
    // Step 4: generate
    const generateBtn = page.getByRole("button", { name: /Generate my trek plan/ });
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();
    // Should either show plan or loading state
    await expect(page.locator("body")).not.toContainText("500");
  });
});
