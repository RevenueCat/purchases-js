import { expect } from "@playwright/test";
import { integrationTest } from "./helpers/integration-test";
import { BASE_URL } from "./helpers/fixtures";
import { skipPaywallsTestIfDisabled } from "./helpers/test-helpers";

const offeringsResponse = {
  current_offering_id: "offering_1",
  offerings: [
    {
      identifier: "offering_1",
      description: "Offering 1",
      metadata: null,
      packages: [
        {
          identifier: "$rc_monthly",
          platform_product_identifier: "monthly",
        },
      ],
      paywall_components: null,
    },
  ],
};

const productsResponse = {
  product_details: [
    {
      identifier: "monthly",
      product_type: "subscription",
      title: "Monthly test",
      description: null,
      default_purchase_option_id: "base_option",
      purchase_options: {
        base_option: {
          id: "base_option",
          price_id: "test_price_id",
          base: {
            period_duration: "P1M",
            cycle_count: 1,
            price: {
              amount_micros: 3000000,
              currency: "USD",
            },
          },
          trial: null,
          intro_price: null,
          discount: null,
        },
      },
    },
  ],
};

integrationTest(
  "removes auto-created paywall overlay when presentPaywall rejects for an offering without a paywall",
  async ({ page, userId }) => {
    skipPaywallsTestIfDisabled(integrationTest);

    await page.route("**/v1/subscribers/*/offerings", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: offeringsResponse,
      });
    });

    await page.route(
      "**/rcbilling/v1/subscribers/*/products**",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          json: productsResponse,
        });
      },
    );

    await page.goto(
      `${BASE_URL}rc_paywall_no_paywall_attached/${encodeURIComponent(userId)}`,
    );

    await page.getByRole("button", { name: "Show paywall" }).click();

    await expect(page.getByRole("alert")).toHaveText(
      "This offering doesn't have a paywall attached.",
    );
    await expect(page.locator("#rcb-ui-pw-root")).toHaveCount(0);

    const backgroundActionButton = page.getByRole("button", {
      name: "Background action 0",
    });
    await backgroundActionButton.click();
    await expect(
      page.getByRole("button", { name: "Background action 1" }),
    ).toBeVisible();
  },
);
