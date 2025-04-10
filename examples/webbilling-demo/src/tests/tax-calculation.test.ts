import { expect, test } from "@playwright/test";
import {
  enterCreditCardDetails,
  enterEmailAndContinue,
  getAllElementsByLocator,
  getUserId,
  setupTest,
  startPurchaseFlow,
} from "./utils.ts";

const CARD_SELECTOR = "div.card";

const TAXES_TEST_OFFERING_ID = "rcb_e2e_taxes";

// Assuming there's a selector or some identifiable locator for the tax breakdown UI element
const TAX_BREAKDOWN_ITEM_SELECTOR = ".rcb-pricing-table-row";
const ALLOW_TAX_CALCULATION_FF =
  process.env.VITE_ALLOW_TAX_CALCULATION_FF === "true";

const TAX_TEST_API_KEY = process.env.VITE_RC_TAX_E2E_API_KEY;

test.describe("Tax calculation breakdown", () => {
  test.skip(
    !ALLOW_TAX_CALCULATION_FF,
    "Tax calculation breakdown is disabled. To enable, set VITE_ALLOW_TAX_CALCULATION_FF=true in the environment variables.",
  );

  test("should not display the tax breakdown at the enter email step", async ({
    browser,
    browserName,
  }) => {
    const userId = getUserId(browserName);

    // Set up the page (standard user, location, default params)
    const page = await setupTest(
      browser,
      userId,
      {
        offeringId: TAXES_TEST_OFFERING_ID,
      },
      TAX_TEST_API_KEY,
    );

    // Select and make a purchase of the first available product card
    const cards = await getAllElementsByLocator(page, CARD_SELECTOR);
    const targetCard = cards[0];

    // Perform a purchase action
    await startPurchaseFlow(targetCard);

    await expect(page.getByText("Total excluding tax")).not.toBeVisible();
  });

  test("should display the tax breakdown at the checkout step", async ({
    browser,
    browserName,
  }) => {
    const userId = getUserId(browserName);

    // Set up the page (standard user, location, default params)
    const page = await setupTest(
      browser,
      userId,
      {
        offeringId: TAXES_TEST_OFFERING_ID,
      },
      TAX_TEST_API_KEY,
    );

    // Select and make a purchase of the first available product card
    const cards = await getAllElementsByLocator(page, CARD_SELECTOR);
    const targetCard = cards[0];

    // Perform a purchase action
    await startPurchaseFlow(targetCard);
    await enterEmailAndContinue(page, userId);

    await expect(page.getByText("Total excluding tax")).toBeVisible();
    await expect(page.getByText("Total due today")).toBeVisible();
  });

  test("should update taxes when changing the credit card info changes", async ({
    browser,
    browserName,
  }) => {
    const userId = getUserId(browserName);

    // Set up the page (standard user, location, default params)
    const page = await setupTest(
      browser,
      userId,
      {
        offeringId: TAXES_TEST_OFFERING_ID,
      },
      TAX_TEST_API_KEY,
    );

    // Select and make a purchase of the first available product card
    const cards = await getAllElementsByLocator(page, CARD_SELECTOR);
    const targetCard = cards[0];

    // Perform a purchase action
    await startPurchaseFlow(targetCard);
    await enterEmailAndContinue(page, userId);

    // Expecting the first calculation to be done.
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
  });

  test("should not display the tax breakdown if not collecting location is selected", async ({
    browser,
    browserName,
  }) => {
    const userId = getUserId(browserName);

    // Set up the page (standard user, location, default params)
    const page = await setupTest(
      browser,
      userId,
      {
        offeringId: TAXES_TEST_OFFERING_ID,
      },
      TAX_TEST_API_KEY,
    );

    // Select and make a purchase of the first available product card
    const cards = await getAllElementsByLocator(page, CARD_SELECTOR);
    const targetCard = cards[0];

    // Perform a purchase action
    await startPurchaseFlow(targetCard);
    await enterEmailAndContinue(page, userId);

    // Expecting the first calculation to be done.
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
  });

  test("product price and total should match for inclusive taxes", async ({
    browser,
    browserName,
  }) => {
    const userId = getUserId(browserName);

    // Set up the page (standard user, location, default params)
    const page = await setupTest(
      browser,
      userId,
      {
        offeringId: TAXES_TEST_OFFERING_ID,
      },
      TAX_TEST_API_KEY,
    );

    // Select and make a purchase of the first available product card
    const cards = await getAllElementsByLocator(page, CARD_SELECTOR);
    const targetCard = cards[0];

    // Perform a purchase action
    await startPurchaseFlow(targetCard);
    await enterEmailAndContinue(page, userId);

    await enterCreditCardDetails(page, "4242 4242 4242 4242", {
      countryCode: "IT",
    });

    const priceBreakdownLines = await page
      .locator(TAX_BREAKDOWN_ITEM_SELECTOR)
      .all();

    await expect(
      priceBreakdownLines[0].getByText(/Total excluding tax/),
    ).toBeVisible();
    await expect(priceBreakdownLines[0].getByText("$8.19")).toBeVisible();

    await expect(priceBreakdownLines[1].getByText(/VAT - Italy/)).toBeVisible();
    await expect(priceBreakdownLines[1].getByText("$1.80")).toBeVisible();

    const totalDueTodayLine = page.locator(
      `${TAX_BREAKDOWN_ITEM_SELECTOR}.rcb-header`,
    );

    await expect(totalDueTodayLine.getByText(/Total due today/)).toBeVisible();
    await expect(totalDueTodayLine.getByText("$9.99")).toBeVisible();
  });

  test("should show error message when the postal code was not recognized", async ({
    browser,
    browserName,
  }) => {
    const userId = getUserId(browserName);

    // Set up the page (standard user, location, default params)
    const page = await setupTest(
      browser,
      userId,
      {
        offeringId: TAXES_TEST_OFFERING_ID,
      },
      TAX_TEST_API_KEY,
    );

    // Select and make a purchase of the first available product card
    const cards = await getAllElementsByLocator(page, CARD_SELECTOR);
    const targetCard = cards[0];

    // Perform a purchase action
    await startPurchaseFlow(targetCard);
    await enterEmailAndContinue(page, userId);

    // Expecting the first calculation to be done.
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
  });
});
