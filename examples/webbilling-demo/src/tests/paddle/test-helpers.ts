import { expect, type Page } from "@playwright/test";
import { PADDLE_TEST_API_KEY } from "../helpers/fixtures";
import {
  type RouteFulfillOptions,
  navigateToLandingUrl,
} from "../helpers/test-helpers";

export const PADDLE_UI_STEP_TIMEOUT_MS = 30_000;
export const PADDLE_TEST_TIMEOUT_MS = 120_000;
export const PADDLE_TEST_OFFERING_ID = "Paddle E2E Test Offering";

type LandingQuery = {
  offeringId?: string;
  useRcPaywall?: boolean;
  lang?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  optOutOfAutoUTM?: boolean;
  email?: string;
  $displayName?: string;
  nickname?: string;
  hideBackButtons?: boolean;
  discountCode?: string;
};

type MockPaddleConfig = {
  autoComplete?: boolean;
  autoClose?: boolean;
};

export async function navigateToPaddleLandingUrl(
  page: Page,
  userId: string,
  queryString?: LandingQuery,
) {
  const queryWithOfferingId: LandingQuery = {
    ...queryString,
    offeringId: PADDLE_TEST_OFFERING_ID,
  };

  return await navigateToLandingUrl(
    page,
    userId,
    queryWithOfferingId,
    PADDLE_TEST_API_KEY,
  );
}

export async function installMockPaddleBilling(
  page: Page,
  config: MockPaddleConfig = {},
) {
  const { autoComplete = true, autoClose = false } = config;

  await page.addInitScript(
    ({ autoCompleteInMock, autoCloseInMock }) => {
      type PaddleEvent = { name: string; data?: Record<string, unknown> };

      let eventCallback:
        | ((event: PaddleEvent) => void | Promise<void>)
        | undefined;

      const emit = (event: PaddleEvent, delayMS: number = 0) => {
        window.setTimeout(() => {
          if (eventCallback) {
            void eventCallback(event);
          }
        }, delayMS);
      };

      const paddleInstance = {
        Initialized: false,
        Environment: {
          set: () => {},
        },
        Initialize: () => {
          paddleInstance.Initialized = true;
        },
        Update: (params: {
          eventCallback?: (event: PaddleEvent) => void | Promise<void>;
        }) => {
          if (params?.eventCallback) {
            eventCallback = params.eventCallback;
          }
        },
        Checkout: {
          open: () => {
            emit({ name: "checkout.loaded" }, 0);

            if (autoCloseInMock) {
              emit(
                {
                  name: "checkout.closed",
                  data: { status: "closed_by_user" },
                },
                10,
              );
              return;
            }

            if (autoCompleteInMock) {
              emit({ name: "checkout.completed" }, 20);
            }
          },
          close: () => {},
        },
      };

      (
        window as Window & {
          PaddleBillingV1?: unknown;
        }
      ).PaddleBillingV1 = paddleInstance;
    },
    {
      autoCompleteInMock: autoComplete,
      autoCloseInMock: autoClose,
    },
  );
}

export async function mockSuccessfulPaddleCheckoutStatus(
  page: Page,
  productIdentifier: string = "paddle_monthly",
) {
  await page.route("*/**/checkout/*", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }

    const mockedResponse: RouteFulfillOptions = {
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        operation: {
          status: "succeeded",
          is_expired: false,
          redemption_info: null,
          store_transaction_identifier: "test-store-transaction-id",
          product_identifier: productIdentifier,
          purchase_date: new Date().toISOString(),
        },
      }),
    };

    await route.fulfill(mockedResponse);
  });
}

export async function confirmPaddleProcessingPayment(page: Page) {
  const processingPayment = page.getByText("Processing payment");
  const paymentComplete = page.getByText("Payment complete");

  await expect(processingPayment.or(paymentComplete).first()).toBeVisible({
    timeout: PADDLE_UI_STEP_TIMEOUT_MS,
  });
}
