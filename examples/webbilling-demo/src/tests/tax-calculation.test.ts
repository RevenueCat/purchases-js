import { expect } from "@playwright/test";
import {
  enterCreditCardDetails,
  enterEmail,
  clickPayButton,
  startPurchaseFlow,
  navigateToLandingUrl,
  getPackageCards,
  confirmPaymentComplete,
  getStripePaymentFrame,
  confirmPayButtonDisabled,
} from "./helpers/test-helpers";
import {
  integrationTest,
  skipTaxCalculationTestIfDisabled,
} from "./helpers/integration-test";
import {
  FLORIDA_CUSTOMER_DETAILS,
  INVALID_CUSTOMER_DETAILS,
  ITALY_CUSTOMER_DETAILS,
  NEW_YORK_CUSTOMER_DETAILS,
  SPAIN_CUSTOMER_DETAILS,
  TAX_TEST_API_KEY,
  TEXAS_CUSTOMER_DETAILS,
} from "./helpers/fixtures";
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
    "Entering only email does not trigger payment method validation errors",
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

      const stripeFrame = getStripePaymentFrame(page);
      const cardError = stripeFrame.getByText(/Your card number is incomplete/);
      await expect(cardError).not.toBeVisible();

      await confirmPayButtonDisabled(page);
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
      await enterCreditCardDetails(
        page,
        "4242 4242 4242 4242",
        NEW_YORK_CUSTOMER_DETAILS,
      );

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
      await enterCreditCardDetails(
        page,
        "4242 4242 4242 4242",
        ITALY_CUSTOMER_DETAILS,
      );

      await expect(page.getByText("Total excluding tax")).toBeVisible();

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
      await enterCreditCardDetails(
        page,
        "4242 4242 4242 4242",
        FLORIDA_CUSTOMER_DETAILS,
      );

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
      await enterCreditCardDetails(
        page,
        "4242 4242 4242 4242",
        INVALID_CUSTOMER_DETAILS,
      );

      await expect(
        page.getByText(/We couldn't verify your billing address./),
      ).toBeVisible();
    },
  );

  integrationTest(
    "In-flight tax calculation is aborted when the user changes their billing address",
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

      let calculateTaxesCount = 0;
      await page.route("**/calculate_taxes", async (route) => {
        calculateTaxesCount++;

        // Add some throttle to reduce flakiness
        await new Promise((resolve) => setTimeout(resolve, 3000));
        await route.continue();
      });

      await enterEmail(page, email);
      await enterCreditCardDetails(
        page,
        "4242 4242 4242 4242",
        INVALID_CUSTOMER_DETAILS,
      );

      const skeleton = page.getByTestId("tax-loading-skeleton");
      await expect(skeleton).toBeVisible();

      await expect(calculateTaxesCount).toBe(1);

      // Clear the country code, to make sure that the change event is triggered by Stripe
      await enterCreditCardDetails(
        page,
        "4242 4242 4242 4242",
        ITALY_CUSTOMER_DETAILS,
      );

      await enterCreditCardDetails(
        page,
        "4242 4242 4242 4242",
        NEW_YORK_CUSTOMER_DETAILS,
      );

      await expect(page.getByText(/Sales Tax - New York/)).toBeVisible();

      await expect(calculateTaxesCount).toBe(2);

      await expect(
        page.getByText(/We couldn't verify your billing address./i),
      ).not.toBeVisible();
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

      await enterCreditCardDetails(
        page,
        "4242 4242 4242 4242",
        ITALY_CUSTOMER_DETAILS,
      );
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

  integrationTest(
    "Tax calculation is not performed if payment info is incomplete",
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

      let calculateTaxesCount = 0;
      await page.route("**/calculate_taxes", async (route) => {
        calculateTaxesCount++;
        await route.continue();
      });

      await enterCreditCardDetails(
        page,
        "4242 4242 4242 4242",
        ITALY_CUSTOMER_DETAILS,
      );
      const skeleton = page.getByTestId("tax-loading-skeleton");
      await expect(skeleton).not.toBeVisible();

      await confirmPayButtonDisabled(page);

      await expect(calculateTaxesCount).toBe(0);

      // Remove the last digit of the card number
      await enterCreditCardDetails(
        page,
        "4242 4242 4242 424",
        ITALY_CUSTOMER_DETAILS,
      );

      await enterEmail(page, email);

      await expect(calculateTaxesCount).toBe(0);
      await expect(page.getByText(/VAT - Italy/)).not.toBeVisible();

      await enterCreditCardDetails(
        page,
        "4242 4242 4242 4242",
        ITALY_CUSTOMER_DETAILS,
      );

      await expect(page.getByText(/VAT - Italy/)).toBeVisible();

      await expect(calculateTaxesCount).toBe(1);
    },
  );

  integrationTest(
    "Tax calculation is performed upon submission and message is shown when final amount differs from initial amount",
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

      let calculateTaxesCount = 0;
      await page.route("**/calculate_taxes", async (route) => {
        calculateTaxesCount++;
        await route.continue();
      });

      await enterEmail(page, email);
      await enterCreditCardDetails(
        page,
        "4242 4242 4242 4242",
        TEXAS_CUSTOMER_DETAILS,
      );
      await expect(page.getByText(/Sales Tax - Texas/)).toBeVisible();

      await expect(calculateTaxesCount).toBe(1);

      await enterCreditCardDetails(
        page,
        "4242 4242 4242 4242",
        ITALY_CUSTOMER_DETAILS,
      );

      // A tax calculation is not performed because the system cannot detect a change in the billing address
      await expect(page.getByText(/VAT - Italy/)).not.toBeVisible();

      await expect(calculateTaxesCount).toBe(1);

      await clickPayButton(page);

      await expect(
        page.getByText(
          /The total price was updated with tax based on your billing address/i,
        ),
      ).toBeVisible();
      await expect(page.getByText(/VAT - Italy/)).toBeVisible();
      await expect(calculateTaxesCount).toBe(2);
    },
  );

  integrationTest(
    "Tax calculation is performed upon submission but no message is shown when final amount matches initial amount",
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

      let calculateTaxesCount = 0;
      await page.route("**/calculate_taxes", async (route) => {
        calculateTaxesCount++;
        await route.continue();
      });

      await enterEmail(page, email);
      await enterCreditCardDetails(
        page,
        "4242 4242 4242 4242",
        ITALY_CUSTOMER_DETAILS,
      );

      await expect(page.getByText(/VAT - Italy/)).toBeVisible();

      await expect(calculateTaxesCount).toBe(1);

      await enterCreditCardDetails(
        page,
        "4242 4242 4242 4242",
        SPAIN_CUSTOMER_DETAILS,
      );

      await expect(page.getByText(/VAT - Spain/)).not.toBeVisible();

      await expect(calculateTaxesCount).toBe(1);

      await clickPayButton(page);

      await expect(
        page.getByText(
          /The total price was updated with tax based on your billing address/i,
        ),
      ).not.toBeVisible();
      await expect(page.getByText(/VAT - Spain/)).toBeVisible();
      await expect(calculateTaxesCount).toBe(2);
    },
  );
});
