import { expect, type FrameLocator, type Page } from "@playwright/test";
import { PADDLE_TEST_API_KEY } from "../helpers/fixtures";
import { navigateToLandingUrl } from "../helpers/test-helpers";

export const PADDLE_UI_STEP_TIMEOUT_MS = 60_000;
export const PADDLE_TEST_TIMEOUT_MS = 240_000;

// TODO(WST-707): confirm this is the offering *identifier* (not the display
// name) in the Paddle E2E project before enabling the suite.
export const PADDLE_TEST_OFFERING_ID = "Paddle E2E Test Offering";

export const PADDLE_TEST_CARD_NUMBER = "4242 4242 4242 4242";
export const PADDLE_TEST_CARD_EXPIRY = "12 / 34";
export const PADDLE_TEST_CARD_CVV = "100";
export const PADDLE_TEST_POSTCODE = "12345";

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
// The iframe is served from *.paddle.com (sandbox-buy.paddle.com in sandbox).
// TODO(WST-713): verify the exact iframe attributes headed against the
// sandbox and pin a more specific selector (e.g. name="paddle_frame").
export const getPaddleOverlayFrame = (page: Page) =>
  page.frameLocator("iframe[src*='paddle.com']");

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
  await expect(
    checkoutFrame.getByRole("textbox", { name: /card number/i }),
  ).toBeVisible({ timeout: PADDLE_UI_STEP_TIMEOUT_MS });
}

/**
 * Fills Paddle's checkout form. Works for both presentation modes: pass the
 * frame returned by getPaddleInlineCheckoutFrame or getPaddleOverlayFrame.
 *
 * Field locators ported from #820 (credit: @nicfix).
 */
export async function completePaddleCheckoutForm(
  checkoutFrame: FrameLocator,
  email: string,
  fullName: string,
  fillEmail: boolean = true,
) {
  await confirmPaddleCheckoutFormVisible(checkoutFrame);

  const emailInput = checkoutFrame.getByRole("textbox", {
    name: /email address/i,
  });

  if (fillEmail) {
    await emailInput.waitFor({
      state: "visible",
      timeout: PADDLE_UI_STEP_TIMEOUT_MS,
    });
    await emailInput.fill(email);
    await emailInput.blur();
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

  const cardNumberInput = checkoutFrame.getByRole("textbox", {
    name: /card number/i,
  });
  await cardNumberInput.waitFor({
    state: "visible",
    timeout: PADDLE_UI_STEP_TIMEOUT_MS,
  });
  await cardNumberInput.fill(PADDLE_TEST_CARD_NUMBER);

  const cardholderNameInput = checkoutFrame.getByRole("textbox", {
    name: /name on card|cardholder name/i,
  });
  await cardholderNameInput.waitFor({
    state: "visible",
    timeout: PADDLE_UI_STEP_TIMEOUT_MS,
  });
  await cardholderNameInput.fill(fullName);

  const expiryInput = checkoutFrame.getByRole("textbox", {
    name: /expiry|expiration/i,
  });
  await expiryInput.waitFor({
    state: "visible",
    timeout: PADDLE_UI_STEP_TIMEOUT_MS,
  });
  await expiryInput.fill(PADDLE_TEST_CARD_EXPIRY);

  const cvvInput = checkoutFrame.getByRole("textbox", {
    name: /security code|cvv|cvc/i,
  });
  await cvvInput.waitFor({
    state: "visible",
    timeout: PADDLE_UI_STEP_TIMEOUT_MS,
  });
  await cvvInput.fill(PADDLE_TEST_CARD_CVV);

  // Paddle only asks for a postcode in some country configurations.
  const postcodeInput = checkoutFrame.getByRole("textbox", {
    name: /postal code|zip code|postcode/i,
  });
  if (await postcodeInput.isVisible()) {
    await postcodeInput.fill(PADDLE_TEST_POSTCODE);
  }

  const submitButton = checkoutFrame
    .getByRole("button", { name: /pay|subscribe|start trial|continue/i })
    .first();
  await submitButton.waitFor({
    state: "visible",
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
