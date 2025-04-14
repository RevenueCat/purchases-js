import { expect } from "@playwright/test";
import {
  enterCreditCardDetails,
  enterEmail,
  clickPayButton,
  startPurchaseFlow,
  navigateToLandingUrl,
  getPackageCards,
  clickContinueButton,
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
    "Displays taxes on email entry page",
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
      await clickContinueButton(page);
      await expect(page.getByText("Total excluding tax")).toBeVisible();
      await expect(page.getByText("Total due today")).toBeVisible();
    },
  );

  integrationTest(
    "Refreshes taxes when card info changes",
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
      await clickContinueButton(page);

      await expect(page.getByText("Total excluding tax")).toBeVisible();
      await expect(page.getByText(/Sales Tax - New York/)).not.toBeVisible();
      await expect(page.getByText("Total due today")).toBeVisible();

      await enterCreditCardDetails(page, "4242 4242 4242 4242", {
        countryCode: "US",
        postalCode: "12345",
      });

      await expect(page.getByText("Total excluding tax")).toBeVisible();
      await expect(page.getByText(/Sales Tax - New York/)).toBeVisible();
      await expect(page.getByText("Total due today")).toBeVisible();
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
      await clickContinueButton(page);
      await enterCreditCardDetails(page, "4242 4242 4242 4242", {
        countryCode: "IT",
      });
      await clickPayButton(page);

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
      await enterEmail(page, email);
      await clickContinueButton(page);

      await expect(page.getByText("Total excluding tax")).toBeVisible();
      await expect(page.getByText(/Sales Tax - New York/)).not.toBeVisible();
      await expect(page.getByText("Total due today")).toBeVisible();

      await enterCreditCardDetails(page, "4242 4242 4242 4242", {
        countryCode: "US",
        postalCode: "33125", // Miami, FL
      });
      await clickPayButton(page);

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

      await enterEmail(page, email);
      await clickContinueButton(page);

      await expect(page.getByText("Total excluding tax")).toBeVisible();
      await expect(
        page.getByText("Sales Tax - New York (8%)"),
      ).not.toBeVisible();
      await expect(page.getByText("Total due today")).toBeVisible();

      await enterCreditCardDetails(page, "4242 4242 4242 4242", {
        countryCode: "US",
        postalCode: "00093",
      });

      await expect(
        page.getByText(/We couldn’t verify your billing address./),
      ).toBeVisible({ timeout: 3000 });
    },
  );
});
