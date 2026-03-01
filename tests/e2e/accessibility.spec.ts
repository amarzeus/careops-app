import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility Tests
 * Uses @axe-core/playwright to audit key pages for WCAG compliance.
 */

test.describe("Accessibility Audits (WCAG)", () => {
  test("[a11y] Landing page should be accessible", async ({ page, baseURL }) => {
    await page.goto(baseURL || "http://localhost:5000/");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log(
        "[Landing Page] Violations:",
        JSON.stringify(accessibilityScanResults.violations, null, 2)
      );
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("[a11y] Login page should be accessible", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/login`);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("[a11y] Register page should be accessible", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/register`);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("[a11y] Pricing page should be accessible", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/pricing`);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log(
        "[Pricing Page] Violations:",
        JSON.stringify(accessibilityScanResults.violations, null, 2)
      );
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
