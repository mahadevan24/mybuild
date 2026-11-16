import { test, expect } from "@playwright/test";

test.describe("GoalClash - 3D Real-Life Goal Village Builder", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("loads the village HUD and displays initial resources and stats", async ({ page }) => {
    // Check Title
    await expect(page).toHaveTitle(/GoalClash/i);

    // Check Player Level and Streak
    await expect(page.locator("text=Chief of Ambition")).toBeVisible();
    await expect(page.locator("text=Builders")).toBeVisible();

    // Check Resources (Gold, Elixir, Gems)
    await expect(page.locator("text=4,000").first()).toBeVisible();
    await expect(page.locator("text=250")).toBeVisible(); // Gems

    // Check Three.js Canvas
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();
  });

  test("opens and interacts with the Real-Life Goals Nexus", async ({ page }) => {
    // Click Goals button
    await page.click("button:has-text('Goals')");

    // Modal should be visible
    await expect(page.locator("text=Real-Life Goal Nexus")).toBeVisible();
    await expect(page.locator("text=Deep Coding / LeetCode Sprint")).toBeVisible();

    // Log progress on a goal
    const logButton = page.locator("button:has-text('Log +1')").first();
    await expect(logButton).toBeVisible();
    await logButton.click();

    // Progress bar or values should have updated
    await expect(page.locator("text=Real-Life Goal Nexus")).toBeVisible();

    // Test adding a custom goal
    await page.click("button:has-text('Add Goal')");
    await expect(page.locator("text=Manifest New Real-Life Goal")).toBeVisible();

    await page.fill("input[placeholder*='authentication']", "Read System Design Chapter 4");
    await page.click("button:has-text('Create & Link to Village')");

    await expect(page.locator("text=Read System Design Chapter 4")).toBeVisible();

    // Close modal
    await page.locator("button:has-text('Goals')").first(); // close via X
    const closeBtn = page.locator("button:has(.lucide-x)").first();
    await closeBtn.click();
  });

  test("opens Shop, browses categories, and enters placement mode", async ({ page }) => {
    // Open Shop
    await page.click("button:has-text('Shop')");
    await expect(page.locator("text=Village Architect Shop")).toBeVisible();

    // Check category tabs
    await page.click("button:has-text('Goal Shrines')");
    await expect(page.locator("text=Forge of Code")).toBeVisible();
    await expect(page.locator("text=Dojo of Strength")).toBeVisible();

    await page.click("button:has-text('Economy & Energy')");
    await expect(page.locator("text=Focus Mine")).toBeVisible();
    await expect(page.locator("text=Vital Energy Well")).toBeVisible();

    // Close Shop
    const closeBtn = page.locator("button:has(.lucide-x)").first();
    await closeBtn.click();
    await expect(page.locator("text=Village Architect Shop")).not.toBeVisible();
  });

  test("opens Settings modal and tests demo boost and sound toggle", async ({ page }) => {
    // Open Settings
    await page.click("button[title='Settings']");
    await expect(page.locator("text=Village Settings")).toBeVisible();

    // Sound effects toggle
    await expect(page.locator("text=Sound Effects")).toBeVisible();

    // Claim Demo Fast-Track Boost
    await page.click("text=Claim");

    // Close Settings
    const closeBtn = page.locator("button:has(.lucide-x)").first();
    await closeBtn.click();
    await expect(page.locator("text=Village Settings")).not.toBeVisible();
  });
});
