import { expect } from "@playwright/test";
import { integrationTest } from "./helpers/integration-test";
import {
  navigateToInElementPaywallUrl,
  skipPaywallsTestIfDisabled,
} from "./helpers/test-helpers";
import { RC_PAYWALL_TEST_OFFERING_ID } from "./helpers/fixtures";

integrationTest(
  "Embedded paywall uses in-element layout in desktop mode",
  async ({ page, userId }) => {
    skipPaywallsTestIfDisabled(integrationTest);

    await page.setViewportSize({ width: 1440, height: 1100 });
    page = await navigateToInElementPaywallUrl(page, userId, {
      offeringId: RC_PAYWALL_TEST_OFFERING_ID,
    });

    await expect(page.getByText("E2E Tests for Purchases JS")).toBeVisible();
    await expect(page.locator(".rcb-ui-container.inside")).toBeVisible();

    const layoutBehavior = await page.locator("#layout-query-container").evaluate(
      (layoutQueryContainer) => {
        const computedStyle = window.getComputedStyle(layoutQueryContainer);
        const layout =
          layoutQueryContainer.querySelector<HTMLElement>(".rcb-ui-layout");
        const navbar =
          layoutQueryContainer.querySelector<HTMLElement>(".rcb-ui-navbar");
        const main =
          layoutQueryContainer.querySelector<HTMLElement>(".rcb-ui-main");

        if (!layout || !navbar || !main) {
          throw new Error("Failed to find paywall layout elements");
        }

        const navbarWidth = navbar.getBoundingClientRect().width;
        const mainWidth = main.getBoundingClientRect().width;
        const totalWidth = navbarWidth + mainWidth;

        return {
          overflowY: computedStyle.overflowY,
          flexDirection: window.getComputedStyle(layout).flexDirection,
          navbarRatio: totalWidth > 0 ? navbarWidth / totalWidth : 0,
        };
      },
    );

    expect(layoutBehavior.overflowY).toBe("hidden");
    expect(layoutBehavior.flexDirection).toBe("row");
    expect(layoutBehavior.navbarRatio).toBeGreaterThan(0.43);
    expect(layoutBehavior.navbarRatio).toBeLessThan(0.47);
  },
);

integrationTest(
  "Embedded paywall keeps single-column layout on small widths",
  async ({ page, userId }) => {
    skipPaywallsTestIfDisabled(integrationTest);

    await page.setViewportSize({ width: 640, height: 1100 });
    page = await navigateToInElementPaywallUrl(page, userId, {
      offeringId: RC_PAYWALL_TEST_OFFERING_ID,
    });

    await expect(page.getByText("E2E Tests for Purchases JS")).toBeVisible();

    const layoutBehavior = await page.locator("#layout-query-container").evaluate(
      (layoutQueryContainer) => {
        const layout =
          layoutQueryContainer.querySelector<HTMLElement>(".rcb-ui-layout");
        const navbar =
          layoutQueryContainer.querySelector<HTMLElement>(".rcb-ui-navbar");
        const shell = document.querySelector<HTMLElement>(
          "[data-testid='embedded-paywall-shell']",
        );

        if (!layout || !navbar || !shell) {
          throw new Error("Failed to find in-element paywall containers");
        }

        const navbarWidth = navbar.getBoundingClientRect().width;
        const shellWidth = shell.getBoundingClientRect().width;

        return {
          flexDirection: window.getComputedStyle(layout).flexDirection,
          navbarToShellRatio: shellWidth > 0 ? navbarWidth / shellWidth : 0,
        };
      },
    );

    expect(layoutBehavior.flexDirection).toBe("column");
    expect(layoutBehavior.navbarToShellRatio).toBeGreaterThan(0.95);
  },
);
