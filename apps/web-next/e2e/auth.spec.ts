import { test, expect } from "@playwright/test";

test.describe("Auth flows", () => {
  test("sign-up page loads", async ({ page }) => {
    await page.goto("/auth/sign-up");
    await expect(page.getByRole("heading", { name: /sign up|create account|join/i })).toBeVisible();
  });

  test("sign-in page loads", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("sign-in with wrong credentials shows error", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await page.fill("input[type='email']", "wrong@test.com");
    await page.fill("input[type='password']", "wrongpassword123");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    // Should show an error, not redirect to dashboard
    await expect(page).toHaveURL(/sign-in/);
  });

  test("forgot password page accessible", async ({ page }) => {
    await page.goto("/auth/forgot-password");
    await expect(page.locator("input[type='email']")).toBeVisible();
  });

  test("account page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/account");
    // Should redirect to sign-in
    await expect(page).toHaveURL(/sign-in/);
  });
});
