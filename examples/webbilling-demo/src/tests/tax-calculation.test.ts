import { expect } from "@playwright/test";
import {
  enterCreditCardDetails,
  enterEmail,
  clickPayButton,
  startPurchaseFlow,
  navigateToLandingUrl,
  getPackageCards,
  confirmPaymentComplete,
} from "./helpers/test-helpers";
import {
  integrationTest,
  skipTaxCalculationTestIfDisabled,
} from "./helpers/integration-test";
import { TAX_TEST_API_KEY } from "./helpers/fixtures";
import { TAX_TEST_OFFERING_ID } from "./helpers/fixtures";

const TAX_BREAKDOWN_ITEM_SELECTOR = ".rcb-pricing-table-row";

integrationTest.describe("Tax calculation", () => {
  skipTaxCalculationTestIfDisabled(integrationTest);

  integrationTest(
    "Does NOT display taxes when tax collection is disabled",
    async ({ page, userId }) => {
      page = await navigateToLandingUrl(page, userId);
      const packageCards = await getPackageCards(page);
      await startPurchaseFlow(packageCards[1]);
      await expect(page.getByText("Total due today")).toBeVisible();
      await expect(page.getByText("Total excluding tax")).not.toBeVisible();
    },
  );

  integrationTest(
    "Displays taxes on payment entry page",
    async ({ page, userId }) => {
      page = await navigateToLandingUrl(
        page,
        userId,
        {
          offeringId: TAX_TEST_OFFERING_ID,
        },
        TAX_TEST_API_KEY,
      );

      const packageCards = await getPackageCards(page);
      await startPurchaseFlow(packageCards[0]);
      await expect(page.getByText("Total excluding tax")).toBeVisible();
      await expect(page.getByText("Total due today")).toBeVisible();
    },
  );

  integrationTest(
    "Refreshes taxes when card info changes and performs payment",
    async ({ page, userId, email }) => {
      page = await navigateToLandingUrl(
        page,
        userId,
        {
          offeringId: TAX_TEST_OFFERING_ID,
        },
        TAX_TEST_API_KEY,
      );

      const packageCards = await getPackageCards(page);
      await startPurchaseFlow(packageCards[0]);

      await expect(page.getByText("Total excluding tax")).toBeVisible();
      await expect(page.getByText(/Sales Tax - New York/)).not.toBeVisible();
      await expect(page.getByText("Total due today")).toBeVisible();

      await enterEmail(page, email);
      await enterCreditCardDetails(page, "4242 4242 4242 4242", {
        countryCode: "US",
        postalCode: "12345",
      });

      await expect(page.getByText("Total excluding tax")).toBeVisible();
      await expect(page.getByText(/Sales Tax - New York/)).toBeVisible();
      await expect(page.getByText("Total due today")).toBeVisible();

      await clickPayButton(page);
      await confirmPaymentComplete(page);
    },
  );

  integrationTest(
    "Displays inclusive taxes",
    async ({ page, userId, email }) => {
      page = await navigateToLandingUrl(
        page,
        userId,
        {
          offeringId: TAX_TEST_OFFERING_ID,
        },
        TAX_TEST_API_KEY,
      );

      const packageCards = await getPackageCards(page);
      await startPurchaseFlow(packageCards[0]);
      await enterEmail(page, email);
      await enterCreditCardDetails(page, "4242 4242 4242 4242", {
        countryCode: "IT",
      });

      const lines = await page.locator(TAX_BREAKDOWN_ITEM_SELECTOR).all();
      expect(lines).toHaveLength(3);
      await expect(lines[0].getByText(/Total excluding tax/)).toBeVisible();
      await expect(lines[0].getByText("$8.19")).toBeVisible();
      await expect(lines[1].getByText(/VAT - Italy/)).toBeVisible();
      await expect(lines[1].getByText("$1.80")).toBeVisible();
      await expect(lines[2].getByText(/Total due today/)).toBeVisible();
      await expect(lines[2].getByText("$9.99")).toBeVisible();
    },
  );

  integrationTest(
    "Does NOT display taxes if not collecting in location",
    async ({ page, userId, email }) => {
      // Set up the page (standard user, location, default params)
      page = await navigateToLandingUrl(
        page,
        userId,
        {
          offeringId: TAX_TEST_OFFERING_ID,
        },
        TAX_TEST_API_KEY,
      );

      const cards = await getPackageCards(page);
      const targetCard = cards[0];

      await startPurchaseFlow(targetCard);

      await expect(page.getByText("Total excluding tax")).toBeVisible();
      await expect(page.getByText(/Sales Tax - New York/)).not.toBeVisible();
      await expect(page.getByText("Total due today")).toBeVisible();

      await enterEmail(page, email);
      await enterCreditCardDetails(page, "4242 4242 4242 4242", {
        countryCode: "US",
        postalCode: "33125", // Miami, FL
      });

      await expect(page.getByText("Total excluding tax")).not.toBeVisible();
      await expect(page.getByText(/Sales Tax - New York/)).not.toBeVisible();
      await expect(page.getByText("Total due today")).toBeVisible();
    },
  );

  integrationTest(
    "Postal code not recognized error",
    async ({ page, userId, email }) => {
      page = await navigateToLandingUrl(
        page,
        userId,
        {
          offeringId: TAX_TEST_OFFERING_ID,
        },
        TAX_TEST_API_KEY,
      );

      const packageCards = await getPackageCards(page);
      await startPurchaseFlow(packageCards[0]);

      await expect(page.getByText("Total excluding tax")).toBeVisible();
      await expect(page.getByText(/Sales Tax - New York/)).not.toBeVisible();
      await expect(page.getByText("Total due today")).toBeVisible();

      await enterEmail(page, email);
      await enterCreditCardDetails(page, "4242 4242 4242 4242", {
        countryCode: "US",
        postalCode: "00093",
      });

      await expect(
        page.getByText(/We couldn't verify your billing address./),
      ).toBeVisible();
    },
  );

  integrationTest(
    "Tax calculation is aborted when the user changes their billing address",
    async ({ page, userId, email }) => {
      await page.route("**/calculate_taxes", async (route) => {
        // Add some throttle to reduce flakiness
        await new Promise((resolve) => setTimeout(resolve, 3000));
        await route.continue();
      });

      page = await navigateToLandingUrl(
        page,
        userId,
        {
          offeringId: TAX_TEST_OFFERING_ID,
        },
        TAX_TEST_API_KEY,
      );

      const packageCards = await getPackageCards(page);
      await startPurchaseFlow(packageCards[0]);

      await expect(page.getByText("Total excluding tax")).toBeVisible();
      await expect(page.getByText(/Sales Tax - New York/)).not.toBeVisible();
      await expect(page.getByText("Total due today")).toBeVisible();

      await enterEmail(page, email);
      await enterCreditCardDetails(page, "4242 4242 4242 4242", {
        countryCode: "US",
        postalCode: "00093",
      });

      const skeleton = page.getByTestId("tax-loading-skeleton");
      await expect(skeleton).toBeVisible();

      // Clear the country code, to make sure that the change event is triggered by Stripe
      await enterCreditCardDetails(page, "4242 4242 4242 4242", {
        countryCode: "IT",
      });

      await enterCreditCardDetails(page, "4242 4242 4242 4242", {
        countryCode: "US",
        postalCode: "12345",
      });

      await expect(
        page.getByText(/We couldn't verify your billing address./),
      ).not.toBeVisible();

      await expect(page.getByText(/Sales Tax - New York/)).toBeVisible();
    },
  );

  integrationTest(
    "Tax calculation is not performed until the user has entered their email",
    async ({ page, userId, email }) => {
      page = await navigateToLandingUrl(
        page,
        userId,
        {
          offeringId: TAX_TEST_OFFERING_ID,
        },
        TAX_TEST_API_KEY,
      );

      const packageCards = await getPackageCards(page);
      await startPurchaseFlow(packageCards[0]);

      await expect(page.getByText("Total excluding tax")).toBeVisible();
      await expect(page.getByText(/VAT - Italy/)).not.toBeVisible();
      await expect(page.getByText("Total due today")).toBeVisible();

      await enterCreditCardDetails(page, "4242 4242 4242 4242", {
        countryCode: "IT",
      });
      const skeleton = page.getByTestId("tax-loading-skeleton");
      await expect(skeleton).not.toBeVisible();

      await confirmPayButtonDisabled(page);

      const taxCalculationPromise = page.waitForRequest("**/calculate_taxes");
      await enterEmail(page, email);
      await taxCalculationPromise;

      await expect(skeleton).toBeVisible();
      await expect(page.getByText(/VAT - Italy/)).toBeVisible();
    },
  );
});
