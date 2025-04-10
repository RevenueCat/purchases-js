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
import { integrationTest } from "./helpers/integration-test";
import { TAX_TEST_API_KEY } from "./helpers/fixtures";
import { TAX_TEST_OFFERING_ID } from "./helpers/fixtures";

const ALLOW_TAX_CALCULATION_FF =
  process.env.VITE_ALLOW_TAX_CALCULATION_FF === "true";

integrationTest.skip(
  !ALLOW_TAX_CALCULATION_FF,
  "Tax calculation is disabled. To enable, set VITE_ALLOW_TAX_CALCULATION_FF=true in the environment variables.",
);

integrationTest(
  "Does NOT display taxes at the email step",
  async ({ page, userId }) => {
    page = await navigateToLandingUrl(page, userId);

    const packageCards = await getPackageCards(page);
    await startPurchaseFlow(packageCards[1]);

    await expect(page.getByText("Total excluding tax")).not.toBeVisible();
  },
);

integrationTest(
  "Displays taxes at the checkout step",
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
    await startPurchaseFlow(packageCards[1]);

    await enterEmail(page, email);
    await clickPayButton(page);

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
    await startPurchaseFlow(packageCards[1]);

    await expect(page.getByText("Total excluding tax")).toBeVisible();
    await expect(page.getByText(/Sales Tax - New York/)).not.toBeVisible();
    await expect(page.getByText("Total due today")).toBeVisible();

    await enterEmail(page, email);
    await enterCreditCardDetails(page, "4242 4242 4242 4242", {
      countryCode: "US",
      postalCode: "12345",
    });
    await clickPayButton(page);

    await expect(page.getByText("Total excluding tax")).toBeVisible();
    await expect(page.getByText(/Sales Tax - New York/)).toBeVisible();
    await expect(page.getByText("Total due today")).toBeVisible();
  },
);

integrationTest("Displays inclusive taxes", async ({ page, userId, email }) => {
  page = await navigateToLandingUrl(
    page,
    userId,
    {
      offeringId: TAX_TEST_OFFERING_ID,
    },
    TAX_TEST_API_KEY,
  );

  const packageCards = await getPackageCards(page);
  await startPurchaseFlow(packageCards[1]);

  await enterEmail(page, email);
  await enterCreditCardDetails(page, "4242 4242 4242 4242", {
    countryCode: "IT",
  });

  await clickPayButton(page);

  await expect(page.getByText(/Total excluding tax/)).toBeVisible();
  await expect(page.getByText("$8.19")).toBeVisible();

  await expect(page.getByText(/VAT - Italy/)).toBeVisible();
  await expect(page.getByText("$1.80")).toBeVisible();

  await expect(page.getByText(/Total due today/)).toBeVisible();
  await expect(page.getByText("$9.99")).toBeVisible();
});

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
    await startPurchaseFlow(packageCards[1]);

    await enterEmail(page, email);
    await clickPayButton(page);

    await expect(page.getByText("Total excluding tax")).toBeVisible();
    await expect(page.getByText("Sales Tax - New York (8%)")).not.toBeVisible();
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
