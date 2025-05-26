import type { Page, Request } from "@playwright/test";
import { expect } from "@playwright/test";
import {
  FLORIDA_CUSTOMER_DETAILS,
  INVALID_CUSTOMER_DETAILS,
  ITALY_CUSTOMER_DETAILS,
  NEW_YORK_CUSTOMER_DETAILS,
  SPAIN_CUSTOMER_DETAILS,
  SPAIN_TAX_RESPONSE,
  TAX_TEST_API_KEY,
  TAX_TEST_OFFERING_ID,
  TEXAS_CUSTOMER_DETAILS,
  NOT_COLLECTING_TAX_RESPONSE,
  INVALID_TAX_LOCATION_RESPONSE,
  TEXAS_TAX_RESPONSE,
  NEW_YORK_TAX_RESPONSE,
  ITALY_TAX_RESPONSE,
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
  enterCreditCardDetails,
  enterEmail,
  enterSecurityCode,
  getPackageCards,
  getStripePaymentFrame,
  navigateToLandingUrl,
  startPurchaseFlow,
} from "./helpers/test-helpers";
import type { RouteFulfillOptions } from "./helpers/test-helpers";

const TAX_BREAKDOWN_ITEM_SELECTOR = ".rcb-pricing-table-row";
const TAX_ROUTE_PATH = "**/checkout/*/calculate_taxes";

const navigateToTaxesLandingUrl = (page: Page, userId: string) =>
  navigateToLandingUrl(
    page,
    userId,
    { offeringId: TAX_TEST_OFFERING_ID },
    TAX_TEST_API_KEY,
  );

const mockTaxCalculationRequest = async (
  page: Page,
  fulfillment: RouteFulfillOptions,
) => {
  let completed = false;
  await page.route(TAX_ROUTE_PATH, async (route) => {
    if (!completed) {
      await route.fulfill(fulfillment);
      completed = true;
    } else {
      route.fallback();
    }
  });
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

      integrationTest.beforeEach(async ({ page }) => {
        if (mockMode) {
          // Prevent the real requests from being performed
          await page.route(TAX_ROUTE_PATH, async (route) => {
            route.abort();
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

          await page.route(TAX_ROUTE_PATH, async (route) => {
            const body = await route.request().postDataJSON();
            if (body !== null && body["country_code"] === "IT") {
              setTimeout(async () => {
                route.fallback();
              }, 10_000);
            } else {
              route.fallback();
            }
          });

          let italyTaxCalculationRequest: Request | undefined;
          const italyTaxCalculationRequestPromise = page.waitForRequest(
            (request) => {
              italyTaxCalculationRequest = request;
              return (
                request.url().includes("/calculate_taxes") &&
                request.postDataJSON().country_code === "IT"
              );
            },
          );

          const newYorkTaxCalculationRequestPromise = page.waitForRequest(
            (request) =>
              request.url().includes("/calculate_taxes") &&
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
          await page.route(TAX_ROUTE_PATH, async (route) => {
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

      integrationTest(
        "Tax calculation is performed upon submission and message is shown when final amount differs from initial amount",
        async ({ page, userId, email }) => {
          if (mockMode) {
            await mockTaxCalculationRequest(page, ITALY_TAX_RESPONSE);
            await mockTaxCalculationRequest(page, TEXAS_TAX_RESPONSE);
            await mockTaxCalculationRequest(page, SPAIN_TAX_RESPONSE);
          }

          page = await navigateToTaxesLandingUrl(page, userId);

          const packageCards = await getPackageCards(page);
          await startPurchaseFlow(packageCards[0]);

          await expect(page.getByText("Total excluding tax")).toBeVisible();

          let calculateTaxesCount = 0;
          await page.route(TAX_ROUTE_PATH, async (route) => {
            calculateTaxesCount++;
            await route.fallback();
          });

          await enterEmail(page, email);
          await enterCreditCardDetails(
            page,
            "4242 4242 4242 4242",
            TEXAS_CUSTOMER_DETAILS,
          );

          await confirmTaxCalculation(page);
          await expect(page.getByText(/Sales Tax - Texas/)).toBeVisible();
          await expect(calculateTaxesCount).toBe(1);

          await enterCreditCardDetails(
            page,
            "4242 4242 4242 4242",
            ITALY_CUSTOMER_DETAILS,
          );

          // A tax calculation is not performed because the system cannot detect a change in the billing address
          await confirmTaxNotCalculating(page);
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
          if (mockMode) {
            await mockTaxCalculationRequest(page, SPAIN_TAX_RESPONSE);
            await mockTaxCalculationRequest(page, ITALY_TAX_RESPONSE);
            await mockTaxCalculationRequest(page, SPAIN_TAX_RESPONSE);
          }

          page = await navigateToTaxesLandingUrl(page, userId);

          const packageCards = await getPackageCards(page);
          await startPurchaseFlow(packageCards[0]);

          await expect(page.getByText("Total excluding tax")).toBeVisible();

          let calculateTaxesCount = 0;
          await page.route(TAX_ROUTE_PATH, async (route) => {
            calculateTaxesCount++;
            await route.fallback();
          });

          await enterEmail(page, email);
          await enterCreditCardDetails(
            page,
            "4242 4242 4242 4242",
            ITALY_CUSTOMER_DETAILS,
          );

          await confirmTaxCalculation(page);
          await expect(page.getByText(/VAT - Italy/)).toBeVisible();
          await expect(calculateTaxesCount).toBe(1);

          await enterCreditCardDetails(
            page,
            "4242 4242 4242 4242",
            SPAIN_CUSTOMER_DETAILS,
          );

          await confirmTaxNotCalculating(page);
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
    },
  );
});

integrationTest.describe("Tax calculation setup errors", () => {
  integrationTest.fixme("Stripe tax not active", async ({ page, userId }) => {
    await page.route(TAX_ROUTE_PATH, async (route) => {
      await route.fulfill({
        json: {
          mocked: true,
          code: 7898,
          message:
            "Stripe account setup error: Stripe Tax must be active to calculate taxes.",
        },
        status: 422,
      });
    });

    page = await navigateToTaxesLandingUrl(page, userId);
    const packageCards = await getPackageCards(page);
    await startPurchaseFlow(packageCards[0]);
    await confirmPaymentError(page, "Stripe Tax not active");
  });

  integrationTest.fixme(
    "Invalid tax origin address",
    async ({ page, userId }) => {
      await page.route(TAX_ROUTE_PATH, async (route) => {
        await route.fulfill({
          json: {
            mocked: true,
            code: 7899,
            message:
              "Stripe account setup error: Origin address for Stripe Tax is missing or invalid.",
          },
          status: 422,
        });
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
      await page.route(TAX_ROUTE_PATH, async (route) => {
        await route.fulfill({
          json: {
            mocked: true,
            code: 7900,
            message:
              "Stripe account setup error: Required permission is missing.",
          },
          status: 422,
        });
      });

      page = await navigateToTaxesLandingUrl(page, userId);
      const packageCards = await getPackageCards(page);
      await startPurchaseFlow(packageCards[0]);
      await confirmPaymentError(page, "Missing Stripe permission");
    },
  );
});
