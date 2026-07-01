import type { Page, Request, Route } from "@playwright/test";
import { expect } from "@playwright/test";
import {
  FLORIDA_CUSTOMER_DETAILS,
  FULL_ADDRESS_TEST_API_KEY,
  FULL_ADDRESS_TAX_TEST_OFFERING_ID,
  INVALID_CUSTOMER_DETAILS,
  ITALY_CUSTOMER_DETAILS,
  NEW_YORK_CUSTOMER_DETAILS,
  NEW_YORK_FULL_ADDRESS,
  SPAIN_TAX_RESPONSE,
  SPAIN_TAX_INCLUSIVE_DISCOUNTED_RESPONSE,
  TAX_TEST_API_KEY,
  TAX_TEST_OFFERING_ID,
  TAX_TEST_OFFERING_ID_WITH_DISCOUNT,
  NOT_COLLECTING_TAX_RESPONSE,
  INVALID_TAX_LOCATION_RESPONSE,
  NEW_YORK_TAX_RESPONSE,
  ITALY_TAX_RESPONSE,
  STRIPE_TAX_NOT_ACTIVE_RESPONSE,
  INVALID_TAX_ORIGIN_RESPONSE,
  MISSING_STRIPE_PERMISSION_RESPONSE,
  TAX_TEST_DISCOUNT_CODE,
} from "./helpers/fixtures";
import {
  integrationTest,
  SKIP_TAX_REAL_TESTS,
} from "./helpers/integration-test";
import {
  clickPayButton,
  confirmPayButtonDisabled,
  confirmPaymentComplete,
  confirmPaymentError,
  confirmTaxCalculating,
  confirmTaxCalculation,
  confirmTaxNotCalculating,
  enterBillingAddress,
  enterCreditCardDetails,
  enterEmail,
  enterSecurityCode,
  getPackageCards,
  getStripeAddressFrame,
  getStripePaymentFrame,
  navigateToLandingUrl,
  startPurchaseFlow,
} from "./helpers/test-helpers";
import type { RouteFulfillOptions } from "./helpers/test-helpers";

const TAX_BREAKDOWN_ITEM_SELECTOR = ".rcb-pricing-table-row";
const REFRESH_PRICING_PATH = "**/checkout/*";

const isPricingRefreshRequest = (request: Request) =>
  request.method() === "PATCH";

async function routePricingRefreshRequest(
  page: Page,
  handler: (route: Route, request: Request) => Promise<void>,
) {
  await page.route(REFRESH_PRICING_PATH, async (route) => {
    const request = route.request();

    if (!isPricingRefreshRequest(request)) {
      await route.fallback();
      return;
    }

    await handler(route, request);
  });
}

const navigateToTaxesLandingUrl = (
  page: Page,
  userId: string,
  offeringId: string = TAX_TEST_OFFERING_ID,
  discountCode?: string,
) =>
  navigateToLandingUrl(
    page,
    userId,
    { offeringId: offeringId, discountCode: discountCode },
    TAX_TEST_API_KEY,
  );

const mockTaxCalculationRequest = async (
  page: Page,
  fulfillment: RouteFulfillOptions,
) => {
  let completed = false;
  await routePricingRefreshRequest(page, async (route) => {
    if (!completed) {
      await route.fulfill(fulfillment);
      completed = true;
    } else {
      await route.fallback();
    }
  });
};

/**
 * Counts pricing refresh (tax calculation) requests. In mocked mode every
 * request is fulfilled with a canned response; in real mode the request is
 * proxied to the backend (failing the test if the rate limit is hit). Returns
 * a counter object whose `count` reflects the number of requests observed.
 */
const trackPricingRefreshRequests = async (page: Page, mockMode: boolean) => {
  const counter = { count: 0 };
  await routePricingRefreshRequest(page, async (route) => {
    counter.count++;
    if (mockMode) {
      await route.fulfill(NEW_YORK_TAX_RESPONSE);
    } else {
      const response = await route.fetch();
      const json = await response.json();
      if (json["failed_reason"] === "rate_limit_exceeded") {
        throw new Error("Stripe Tax Calculation API rate limit reached.");
      }
      await route.fulfill({ response, json });
    }
  });
  return counter;
};

[true, false].forEach((mockMode) => {
  integrationTest.describe(
    `Tax calculation (${mockMode ? "mocked" : "real"})`,
    () => {
      integrationTest.skip(
        !mockMode && SKIP_TAX_REAL_TESTS,
        `Tax calculation ${mockMode ? "mocked" : "real"} tests are disabled.
        To enable, set VITE_SKIP_TAX_REAL_TESTS_UNTIL=2025-02-21 in the environment variables.`,
      );

      integrationTest.skip(
        ({ browserName }) => !mockMode && browserName !== "chromium",
        "Real tax calculation tests only run in Chromium",
      );

      integrationTest.beforeEach(async ({ page }) => {
        if (mockMode) {
          // Prevent the real requests from being performed
          await routePricingRefreshRequest(page, async (route) => {
            await route.abort();
          });
        } else {
          // Fail the test if the rate limit is reached
          await routePricingRefreshRequest(page, async (route) => {
            const response = await route.fetch();
            const json = await response.json();
            if (json["failed_reason"] === "rate_limit_exceeded") {
              throw new Error("Stripe Tax Calculation API rate limit reached.");
            }
            await route.fulfill({ response, json });
          });
        }
      });

      integrationTest(
        "Does NOT display taxes when tax collection is disabled",
        async ({ page, userId }) => {
          page = await navigateToLandingUrl(page, userId);
          const packageCards = await getPackageCards(page);
          await startPurchaseFlow(packageCards[1]);
          await confirmTaxNotCalculating(page); // Not very reliable since there is no visual queue when this does not happen
          await expect(page.getByText("Total due today")).toBeVisible();
          await expect(page.getByText("Total excluding tax")).not.toBeVisible();
        },
      );

      integrationTest(
        "Displays taxes on payment entry page",
        async ({ page, userId }) => {
          if (mockMode) {
            await mockTaxCalculationRequest(page, SPAIN_TAX_RESPONSE);
          }

          page = await navigateToTaxesLandingUrl(page, userId);

          const packageCards = await getPackageCards(page);
          await startPurchaseFlow(packageCards[0]);
          await expect(page.getByText("Total excluding tax")).toBeVisible();
          await expect(page.getByText("Total due today")).toBeVisible();
        },
      );

      integrationTest(
        "Entering only email does not trigger payment method validation errors",
        async ({ page, userId, email }) => {
          if (mockMode) {
            await mockTaxCalculationRequest(page, SPAIN_TAX_RESPONSE);
          }

          page = await navigateToTaxesLandingUrl(page, userId);

          const packageCards = await getPackageCards(page);
          await startPurchaseFlow(packageCards[0]);

          await expect(page.getByText("Total excluding tax")).toBeVisible();
          await expect(
            page.getByText(/Sales Tax - New York/),
          ).not.toBeVisible();
          await expect(page.getByText("Total due today")).toBeVisible();

          await enterEmail(page, email);

          const stripeFrame = getStripePaymentFrame(page);
          const cardError = stripeFrame.getByText(
            /Your card number is incomplete/,
          );
          await expect(cardError).not.toBeVisible();

          await confirmPayButtonDisabled(page);
        },
      );

      integrationTest(
        "Refreshes taxes when card info changes and performs payment",
        async ({ page, userId, email }) => {
          if (mockMode) {
            await mockTaxCalculationRequest(page, NEW_YORK_TAX_RESPONSE);
            await mockTaxCalculationRequest(page, SPAIN_TAX_RESPONSE);
          }

          page = await navigateToTaxesLandingUrl(page, userId);

          const packageCards = await getPackageCards(page);
          await startPurchaseFlow(packageCards[0]);

          await expect(page.getByText("Total excluding tax")).toBeVisible();
          await expect(
            page.getByText(/Sales Tax - New York/),
          ).not.toBeVisible();
          await expect(page.getByText("Total due today")).toBeVisible();

          await enterEmail(page, email);
          await enterCreditCardDetails(
            page,
            "4242 4242 4242 4242",
            NEW_YORK_CUSTOMER_DETAILS,
          );
          await confirmTaxCalculation(page);
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
          if (mockMode) {
            await mockTaxCalculationRequest(page, ITALY_TAX_RESPONSE);
            await mockTaxCalculationRequest(page, SPAIN_TAX_RESPONSE);
          }

          page = await navigateToTaxesLandingUrl(page, userId);

          const packageCards = await getPackageCards(page);
          await startPurchaseFlow(packageCards[0]);

          await enterEmail(page, email);
          await enterCreditCardDetails(
            page,
            "4242 4242 4242 4242",
            ITALY_CUSTOMER_DETAILS,
          );
          await confirmTaxCalculation(page);
          await expect(page.getByText(/VAT - Italy/)).toBeVisible();

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
        "Displays correct discount and tax-inclusive totals",
        async ({ page, userId }) => {
          if (mockMode) {
            await mockTaxCalculationRequest(
              page,
              SPAIN_TAX_INCLUSIVE_DISCOUNTED_RESPONSE,
            );
          }

          page = await navigateToTaxesLandingUrl(
            page,
            userId,
            TAX_TEST_OFFERING_ID_WITH_DISCOUNT,
            TAX_TEST_DISCOUNT_CODE,
          );

          const packageCards = await getPackageCards(page);
          await startPurchaseFlow(packageCards[0]);

          const pricingRows = page.locator(TAX_BREAKDOWN_ITEM_SELECTOR);
          await expect(pricingRows).toHaveCount(5);

          const lines = await pricingRows.all();
          expect(lines).toHaveLength(5);
          await expect(lines[0].getByText(/Subtotal/)).toBeVisible();
          await expect(lines[0].getByText("$9.99")).toBeVisible();
          await expect(lines[1].getByText(/Discount/)).toBeVisible();
          await expect(lines[1].getByText("-$1.00")).toBeVisible();
          await expect(lines[2].getByText(/Total excluding tax/)).toBeVisible();
          await expect(lines[2].getByText("$7.43")).toBeVisible();
          await expect(lines[3].getByText(/VAT - Spain \(21%\)/)).toBeVisible();
          await expect(lines[3].getByText("$1.56")).toBeVisible();
          await expect(lines[4].getByText(/Total due today/)).toBeVisible();
          await expect(lines[4].getByText("$8.99")).toBeVisible();
        },
      );

      integrationTest(
        "Does NOT display taxes if not collecting in location",
        async ({ page, userId, email }) => {
          if (mockMode) {
            await mockTaxCalculationRequest(page, NOT_COLLECTING_TAX_RESPONSE);
            await mockTaxCalculationRequest(page, SPAIN_TAX_RESPONSE);
          }

          // Set up the page (standard user, location, default params)
          page = await navigateToTaxesLandingUrl(page, userId);

          const cards = await getPackageCards(page);
          const targetCard = cards[0];

          await startPurchaseFlow(targetCard);

          await expect(page.getByText("Total excluding tax")).toBeVisible();
          await expect(
            page.getByText(/Sales Tax - New York/),
          ).not.toBeVisible();
          await expect(page.getByText("Total due today")).toBeVisible();

          await enterEmail(page, email);
          await enterCreditCardDetails(
            page,
            "4242 4242 4242 4242",
            FLORIDA_CUSTOMER_DETAILS,
          );

          await confirmTaxCalculation(page);

          await expect(page.getByText("Total excluding tax")).not.toBeVisible();
          await expect(
            page.getByText(/Sales Tax - New York/),
          ).not.toBeVisible();
          await expect(page.getByText("Total due today")).toBeVisible();
        },
      );

      integrationTest(
        "Does NOT display taxes if postal code is not recognized",
        async ({ page, userId, email }) => {
          if (mockMode) {
            await mockTaxCalculationRequest(
              page,
              INVALID_TAX_LOCATION_RESPONSE,
            );
            await mockTaxCalculationRequest(page, SPAIN_TAX_RESPONSE);
          }

          page = await navigateToTaxesLandingUrl(page, userId);

          const packageCards = await getPackageCards(page);
          await startPurchaseFlow(packageCards[0]);

          await expect(page.getByText("Total excluding tax")).toBeVisible();
          await expect(
            page.getByText(/Sales Tax - New York/),
          ).not.toBeVisible();
          await expect(page.getByText("Total due today")).toBeVisible();

          await enterEmail(page, email);
          await enterCreditCardDetails(
            page,
            "4242 4242 4242 4242",
            INVALID_CUSTOMER_DETAILS,
          );

          await confirmTaxCalculation(page);
          await expect(page.getByText("Total excluding tax")).not.toBeVisible();
          await expect(
            page.getByText(/Sales Tax - New York/),
          ).not.toBeVisible();
          await expect(page.getByText("Total due today")).toBeVisible();
        },
      );

      integrationTest(
        "In-flight tax calculation is aborted when the user changes their billing address",
        async ({ page, userId, email }) => {
          if (mockMode) {
            await mockTaxCalculationRequest(page, NEW_YORK_TAX_RESPONSE);
            await mockTaxCalculationRequest(page, ITALY_TAX_RESPONSE);
          }

          page = await navigateToTaxesLandingUrl(page, userId);

          const packageCards = await getPackageCards(page);
          await startPurchaseFlow(packageCards[0]);

          await expect(page.getByText("Total excluding tax")).toBeVisible();
          await expect(page.getByText("Total due today")).toBeVisible();

          await routePricingRefreshRequest(page, async (route, request) => {
            const body = await request.postDataJSON();
            if (body !== null && body["country_code"] === "IT") {
              setTimeout(async () => {
                await route.fallback();
              }, 10_000);
            } else {
              await route.fallback();
            }
          });

          let italyTaxCalculationRequest: Request | undefined;
          const italyTaxCalculationRequestPromise = page.waitForRequest(
            (request) => {
              italyTaxCalculationRequest = request;
              return (
                isPricingRefreshRequest(request) &&
                request.postDataJSON().country_code === "IT"
              );
            },
          );

          const newYorkTaxCalculationRequestPromise = page.waitForRequest(
            (request) =>
              isPricingRefreshRequest(request) &&
              request.postDataJSON().country_code === "US",
          );

          await enterEmail(page, email);
          await enterCreditCardDetails(
            page,
            "4242 4242 4242 4242",
            ITALY_CUSTOMER_DETAILS,
          );

          await confirmTaxCalculating(page);

          // Must wait for the request to be started,
          // visual skeleton is not enough to prevent race condition
          await italyTaxCalculationRequestPromise;

          await enterSecurityCode(page, "");

          await enterCreditCardDetails(
            page,
            "4242 4242 4242 4242",
            NEW_YORK_CUSTOMER_DETAILS,
          );

          await confirmTaxCalculation(page);

          // Must wait for the request to be started,
          // visual skeleton is not enough to prevent race condition
          await newYorkTaxCalculationRequestPromise;

          const errorText =
            italyTaxCalculationRequest?.failure()?.["errorText"] ?? "";

          expect([
            "Load request cancelled",
            "NS_BINDING_ABORTED",
            "net::ERR_ABORTED",
            "cancelled",
          ]).toContain(errorText);

          await expect(page.getByText(/Sales Tax - New York/)).toBeVisible();
        },
      );

      integrationTest(
        "Tax calculation is not performed until the user has entered their email",
        async ({ page, userId, email }) => {
          if (mockMode) {
            await mockTaxCalculationRequest(page, ITALY_TAX_RESPONSE);
            await mockTaxCalculationRequest(page, SPAIN_TAX_RESPONSE);
          }

          page = await navigateToTaxesLandingUrl(page, userId);

          const packageCards = await getPackageCards(page);
          await startPurchaseFlow(packageCards[0]);

          await expect(page.getByText("Total excluding tax")).toBeVisible();
          await expect(page.getByText("Total due today")).toBeVisible();

          await enterCreditCardDetails(
            page,
            "4242 4242 4242 4242",
            ITALY_CUSTOMER_DETAILS,
          );

          await confirmTaxNotCalculating(page);
          await enterEmail(page, email);
          await confirmTaxCalculation(page);
          await expect(page.getByText(/VAT - Italy/)).toBeVisible();
        },
      );

      integrationTest(
        "Tax calculation is not performed if payment info is incomplete",
        async ({ page, userId, email }) => {
          if (mockMode) {
            await mockTaxCalculationRequest(page, ITALY_TAX_RESPONSE);
            await mockTaxCalculationRequest(page, SPAIN_TAX_RESPONSE);
          }

          page = await navigateToTaxesLandingUrl(page, userId);

          const packageCards = await getPackageCards(page);
          await startPurchaseFlow(packageCards[0]);

          await expect(page.getByText("Total excluding tax")).toBeVisible();
          await expect(page.getByText(/VAT - Italy/)).not.toBeVisible();
          await expect(page.getByText("Total due today")).toBeVisible();

          let calculateTaxesCount = 0;
          await routePricingRefreshRequest(page, async (route) => {
            calculateTaxesCount++;
            await route.fallback();
          });

          await enterCreditCardDetails(
            page,
            "4242 4242 4242 4242",
            ITALY_CUSTOMER_DETAILS,
          );

          await confirmPayButtonDisabled(page);
          await confirmTaxNotCalculating(page);
          await expect(calculateTaxesCount).toBe(0);

          // Remove the last digit of the card number
          await enterCreditCardDetails(
            page,
            "4242 4242 4242 424",
            ITALY_CUSTOMER_DETAILS,
          );

          await enterEmail(page, email);

          await confirmPayButtonDisabled(page);
          await confirmTaxNotCalculating(page);
          await expect(calculateTaxesCount).toBe(0);
          await expect(page.getByText(/VAT - Italy/)).not.toBeVisible();

          // Fix the card number
          await enterCreditCardDetails(
            page,
            "4242 4242 4242 4242",
            ITALY_CUSTOMER_DETAILS,
          );

          await confirmTaxCalculation(page);
          await expect(page.getByText(/VAT - Italy/)).toBeVisible();
          await expect(calculateTaxesCount).toBe(1);
        },
      );
    },
  );
});

integrationTest.describe("Tax calculation setup errors", () => {
  integrationTest.fixme("Stripe tax not active", async ({ page, userId }) => {
    await routePricingRefreshRequest(page, async (route) => {
      await route.fulfill(STRIPE_TAX_NOT_ACTIVE_RESPONSE);

      page = await navigateToTaxesLandingUrl(page, userId);
      const packageCards = await getPackageCards(page);
      await startPurchaseFlow(packageCards[0]);
      await confirmPaymentError(page, "Stripe Tax not active");
    });
  });

  integrationTest.fixme(
    "Invalid tax origin address",
    async ({ page, userId }) => {
      await routePricingRefreshRequest(page, async (route) => {
        await route.fulfill(INVALID_TAX_ORIGIN_RESPONSE);
      });

      page = await navigateToTaxesLandingUrl(page, userId);
      const packageCards = await getPackageCards(page);
      await startPurchaseFlow(packageCards[0]);
      await confirmPaymentError(page, /Invalid tax origin address/);
    },
  );

  integrationTest.fixme(
    "Missing Stripe permission",
    async ({ page, userId }) => {
      await routePricingRefreshRequest(page, async (route) => {
        await route.fulfill(MISSING_STRIPE_PERMISSION_RESPONSE);
      });

      page = await navigateToTaxesLandingUrl(page, userId);
      const packageCards = await getPackageCards(page);
      await startPurchaseFlow(packageCards[0]);
      await confirmPaymentError(page, "Missing Stripe permission");
    },
  );
});

const navigateToFullAddressLandingUrl = (page: Page, userId: string) =>
  navigateToLandingUrl(
    page,
    userId,
    { offeringId: FULL_ADDRESS_TAX_TEST_OFFERING_ID },
    FULL_ADDRESS_TEST_API_KEY,
  );

// Allow any pending debounced tax refresh (and its request) to flush before we
// snapshot or assert request counts. Slightly larger than the client-side
// debounce window (500ms).
const DEBOUNCE_FLUSH_MS = 1500;

[true, false].forEach((mockMode) => {
  integrationTest.describe(
    `Tax calculation with full address collection (${mockMode ? "mocked" : "real"})`,
    () => {
      integrationTest.skip(
        !FULL_ADDRESS_TEST_API_KEY,
        `Full billing address tax tests are disabled. To enable, set
        VITE_RC_FULL_ADDRESS_E2E_API_KEY to an API key whose project has both
        tax collection and full billing address collection enabled.`,
      );

      integrationTest.skip(
        !mockMode && SKIP_TAX_REAL_TESTS,
        `Real tax calculation tests are disabled.
        To enable, set VITE_SKIP_TAX_REAL_TESTS_UNTIL=2025-02-21 in the environment variables.`,
      );

      // Stripe Address Element interactions are only reliable in Chromium.
      integrationTest.skip(
        ({ browserName }) => browserName !== "chromium",
        "Full billing address tax tests only run in Chromium",
      );

      integrationTest(
        "Debounces tax recalculation while typing the address line 1",
        async ({ page, userId, email }) => {
          const pricing = await trackPricingRefreshRequests(page, mockMode);

          page = await navigateToFullAddressLandingUrl(page, userId);

          const packageCards = await getPackageCards(page);
          await startPurchaseFlow(packageCards[0]);

          await enterEmail(page, email);
          await enterCreditCardDetails(
            page,
            "4242 4242 4242 4242",
            NEW_YORK_CUSTOMER_DETAILS,
          );

          // Fill the complete billing address (including the name) so the form
          // validates and the initial tax calculation succeeds.
          await enterBillingAddress(page, NEW_YORK_FULL_ADDRESS);

          await confirmTaxCalculation(page);
          // Let any debounced refresh triggered by the steps above flush.
          await page.waitForTimeout(DEBOUNCE_FLUSH_MS);

          const requestsBeforeTyping = pricing.count;

          // Re-type the address line 1 character by character to emit a burst
          // of `change` events. The debounce should coalesce them into a
          // single tax calculation.
          const line1Input =
            getStripeAddressFrame(page).getByLabel("Address line 1");
          await line1Input.fill("");
          await line1Input.pressSequentially("1 Times Square");

          await confirmTaxCalculation(page);
          await page.waitForTimeout(DEBOUNCE_FLUSH_MS);

          expect(pricing.count).toBe(requestsBeforeTyping + 1);
        },
      );

      integrationTest(
        "Does NOT recalculate taxes when only the name changes",
        async ({ page, userId, email }) => {
          const pricing = await trackPricingRefreshRequests(page, mockMode);

          page = await navigateToFullAddressLandingUrl(page, userId);

          const packageCards = await getPackageCards(page);
          await startPurchaseFlow(packageCards[0]);

          await enterEmail(page, email);
          await enterCreditCardDetails(
            page,
            "4242 4242 4242 4242",
            NEW_YORK_CUSTOMER_DETAILS,
          );

          // Fill the complete billing address (including the name) so the form
          // validates and the initial tax calculation succeeds.
          await enterBillingAddress(page, NEW_YORK_FULL_ADDRESS);

          await confirmTaxCalculation(page);
          await page.waitForTimeout(DEBOUNCE_FLUSH_MS);

          const requestsBeforeName = pricing.count;

          // Changing ONLY the name must neither show the loading skeleton nor
          // trigger a tax recalculation, since the name is not a tax-relevant
          // field.
          const nameInput = getStripeAddressFrame(page).getByLabel("Name");
          await nameInput.fill("");
          await nameInput.pressSequentially("John Smith");

          await confirmTaxNotCalculating(page);
          await page.waitForTimeout(DEBOUNCE_FLUSH_MS);

          expect(pricing.count).toBe(requestsBeforeName);
        },
      );
    },
  );
});
