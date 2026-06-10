import { expect, type FrameLocator, type Page } from "@playwright/test";
import { PADDLE_TEST_API_KEY } from "../helpers/fixtures";
import { navigateToLandingUrl } from "../helpers/test-helpers";

export const PADDLE_UI_STEP_TIMEOUT_MS = 60_000;
export const PADDLE_TEST_TIMEOUT_MS = 240_000;

export const PADDLE_TEST_OFFERING_ID = "paddle_e2e_test";

export const PADDLE_TEST_CARD_NUMBER = "4242 4242 4242 4242";
export const PADDLE_TEST_CARD_CVV = "123";
// Andorra requires no postcode, which keeps the form deterministic.
export const PADDLE_TEST_COUNTRY = "Andorra";

export type PaddleCheckoutMode = "inline" | "overlay";

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

export async function navigateToPaddleLandingUrl(
  page: Page,
  userId: string,
  queryString?: LandingQuery,
) {
  return await navigateToLandingUrl(
    page,
    userId,
    {
      offeringId: PADDLE_TEST_OFFERING_ID,
      ...queryString,
    },
    PADDLE_TEST_API_KEY,
  );
}

/**
 * Forces the Paddle checkout presentation mode regardless of the backend
 * per-project flag, by rewriting `paddle_billing_params.inline_checkout_enabled`
 * in the real /checkout/start response. This lets a single E2E project cover
 * both the overlay (production default) and inline modes deterministically.
 */
export async function forcePaddleCheckoutMode(
  page: Page,
  mode: PaddleCheckoutMode,
) {
  await page.route("*/**/checkout/start", async (route) => {
    const response = await route.fetch();
    const json = (await response.json()) as Record<string, unknown>;

    const paddleBillingParams = json.paddle_billing_params as
      | Record<string, unknown>
      | null
      | undefined;

    // Fail loudly if the backend response shape drifts; otherwise the helper
    // would silently stop forcing the mode and tests would exercise whatever
    // the project flag happens to be.
    expect(
      paddleBillingParams,
      "Expected paddle_billing_params in the /checkout/start response. " +
        "Did the backend response shape change?",
    ).toBeTruthy();

    await route.fulfill({
      response,
      json: {
        ...json,
        paddle_billing_params: {
          ...paddleBillingParams,
          inline_checkout_enabled: mode === "inline",
        },
      },
    });
  });
}

// Inline mode: the SDK renders a dedicated container and Paddle.js injects
// the checkout iframe inside it (see src/ui/paddle-inline-checkout-page.svelte).
export const getPaddleInlineCheckoutFrame = (page: Page) =>
  page.frameLocator("[data-testid='paddle-inline-checkout-container'] iframe");

export const getPaddleReturnButton = (page: Page) =>
  page.getByTestId("paddle-return-button");

// Overlay mode: Paddle.js appends its own full-screen iframe to <body>.
// Selector proven in rc-billing-checkout's Paddle E2E suite
// (src/e2e/test-helpers.ts).
export const getPaddleOverlayFrame = (page: Page) =>
  page.frameLocator("iframe.paddle-frame, iframe[name='paddle_frame']");

export async function confirmPaddleInlineCheckoutVisible(page: Page) {
  await expect(
    page.getByTestId("paddle-inline-checkout-container"),
  ).toBeVisible({ timeout: PADDLE_UI_STEP_TIMEOUT_MS });
  await expect(
    page.locator("[data-testid='paddle-inline-checkout-container'] iframe"),
  ).toBeVisible({ timeout: PADDLE_UI_STEP_TIMEOUT_MS });
}

export async function confirmPaddleCheckoutFormVisible(
  checkoutFrame: FrameLocator,
) {
  await expect(checkoutFrame.getByTestId("cardNumberInput")).toBeVisible({
    timeout: PADDLE_UI_STEP_TIMEOUT_MS,
  });
}

/**
 * Fills Paddle's checkout form and submits it. Works for both presentation
 * modes: pass the frame returned by getPaddleInlineCheckoutFrame or
 * getPaddleOverlayFrame.
 *
 * Field locators (Paddle's own test ids) and fill order proven in
 * rc-billing-checkout's Paddle E2E suite (src/e2e/test-helpers.ts).
 */
export async function completePaddleCheckoutForm(
  checkoutFrame: FrameLocator,
  email: string,
  fullName: string,
  fillEmail: boolean = true,
) {
  await confirmPaddleCheckoutFormVisible(checkoutFrame);

  await checkoutFrame.getByLabel("Country").selectOption(PADDLE_TEST_COUNTRY);

  const cardNumberInput = checkoutFrame.getByTestId("cardNumberInput");
  await expect(cardNumberInput).toBeVisible({
    timeout: PADDLE_UI_STEP_TIMEOUT_MS,
  });
  await cardNumberInput.fill(PADDLE_TEST_CARD_NUMBER);

  const expirationYear = (new Date().getFullYear() % 100) + 3;
  await checkoutFrame
    .getByPlaceholder("MM / YY")
    .fill(`01 / ${expirationYear}`);
  await checkoutFrame.getByLabel("CVV").fill(PADDLE_TEST_CARD_CVV);
  await checkoutFrame.getByLabel("Card holder").fill(fullName);

  const emailInput = checkoutFrame.getByTestId("authenticationEmailInput");
  if (fillEmail) {
    await expect(emailInput).toBeVisible({
      timeout: PADDLE_UI_STEP_TIMEOUT_MS,
    });
    await emailInput.fill(email);
  } else {
    // When the email arrives via query param Paddle may either prefill the
    // input or collapse it into a read-only summary line.
    const emailSummary = checkoutFrame.getByText(email, { exact: true });
    await expect(emailInput.or(emailSummary).first()).toBeVisible({
      timeout: PADDLE_UI_STEP_TIMEOUT_MS,
    });
    if (await emailInput.isVisible()) {
      await expect(emailInput).toHaveValue(email);
    }
  }

  // Verified against the sandbox: this checkout renders the submit as
  // "Subscribe now"/"Pay now" and shows no logout link (unlike the checkout
  // rc-billing-checkout tests against). The test id is kept first in case
  // Paddle ships it here too.
  const submitButton = checkoutFrame
    .getByTestId("cardPaymentFormSubmitButton")
    .or(
      checkoutFrame.getByRole("button", {
        name: /subscribe now|pay now|pay|subscribe|start trial/i,
      }),
    )
    .first();
  await expect(submitButton).toBeVisible({
    timeout: PADDLE_UI_STEP_TIMEOUT_MS,
  });
  await expect(submitButton).toBeEnabled({
    timeout: PADDLE_UI_STEP_TIMEOUT_MS,
  });
  await submitButton.click();
}

// Inline mode shows an RC-rendered processing state between Paddle's
// checkout.completed event and the backend purchase poll finishing.
export async function confirmPaddleProcessingPayment(page: Page) {
  await expect(page.locator(".rcb-paddle-processing")).toBeVisible({
    timeout: PADDLE_UI_STEP_TIMEOUT_MS,
  });
}

export async function confirmSandboxBannerVisible(page: Page) {
  await expect(page.locator(".rcb-ui-sandbox-banner")).toBeVisible({
    timeout: PADDLE_UI_STEP_TIMEOUT_MS,
  });
}
