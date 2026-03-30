import { expect, type Page } from "@playwright/test";
import { STRIPE_CHECKOUT_TEST_API_KEY } from "../helpers/fixtures";
import { navigateToLandingUrl } from "../helpers/test-helpers";

export const STRIPE_CHECKOUT_UI_STEP_TIMEOUT_MS = 30_000;
export const STRIPE_CHECKOUT_TEST_TIMEOUT_MS = 120_000;

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

export async function navigateToStripeCheckoutLandingUrl(
  page: Page,
  userId: string,
  queryString?: LandingQuery,
) {
  return await navigateToLandingUrl(
    page,
    userId,
    queryString,
    STRIPE_CHECKOUT_TEST_API_KEY,
  );
}

export const getStripeEmbeddedCheckoutFrame = (page: Page) =>
  page.frameLocator("[data-testid='stripe-checkout-mount'] iframe");

export async function confirmStripeCheckoutVisible(page: Page) {
  await expect(page.getByTestId("stripe-checkout-container")).toBeVisible({
    timeout: STRIPE_CHECKOUT_UI_STEP_TIMEOUT_MS,
  });
  await expect(
    page.locator("[data-testid='stripe-checkout-mount'] iframe"),
  ).toBeVisible({
    timeout: STRIPE_CHECKOUT_UI_STEP_TIMEOUT_MS,
  });
}

export async function completeStripeCheckoutEmbeddedForm(
  page: Page,
  email: string,
  fullName: string,
  fillEmail: boolean = true,
) {
  await confirmStripeCheckoutVisible(page);

  const checkoutFrame = getStripeEmbeddedCheckoutFrame(page);

  if (fillEmail) {
    const emailInput = checkoutFrame
      .getByLabel(/email/i)
      .or(checkoutFrame.getByPlaceholder(/email@example.com/i))
      .or(checkoutFrame.locator("[name='email']"))
      .first();

    await emailInput.waitFor({
      state: "visible",
      timeout: STRIPE_CHECKOUT_UI_STEP_TIMEOUT_MS,
    });
    await emailInput.fill(email);
    await emailInput.blur();
  }

  const fullNameInput = checkoutFrame
    .getByLabel(/full name on card/i)
    .or(checkoutFrame.getByLabel(/cardholder name/i))
    .or(checkoutFrame.getByLabel(/name on card/i))
    .or(checkoutFrame.getByPlaceholder(/full name/i))
    .or(checkoutFrame.locator("[name='name']"))
    .first();
  await fullNameInput.waitFor({
    state: "visible",
    timeout: STRIPE_CHECKOUT_UI_STEP_TIMEOUT_MS,
  });
  await fullNameInput.fill(fullName);
  await fullNameInput.blur();

  const cardNumberInput = checkoutFrame
    .getByPlaceholder(/1234 1234/i)
    .or(checkoutFrame.getByLabel(/card number/i))
    .first();
  await cardNumberInput.waitFor({
    state: "visible",
    timeout: STRIPE_CHECKOUT_UI_STEP_TIMEOUT_MS,
  });
  await cardNumberInput.fill("4242 4242 4242 4242");

  const expirationInput = checkoutFrame
    .getByPlaceholder(/mm\s*\/\s*yy/i)
    .or(checkoutFrame.getByLabel(/expiration/i))
    .first();
  await expirationInput.waitFor({
    state: "visible",
    timeout: STRIPE_CHECKOUT_UI_STEP_TIMEOUT_MS,
  });
  await expirationInput.fill("12 / 34");

  const securityCodeInput = checkoutFrame
    .getByLabel(/security code|cvc/i)
    .or(checkoutFrame.getByPlaceholder(/cvc/i))
    .first();
  await securityCodeInput.waitFor({
    state: "visible",
    timeout: STRIPE_CHECKOUT_UI_STEP_TIMEOUT_MS,
  });
  await securityCodeInput.fill("123");

  const submitButton = checkoutFrame
    .getByRole("button", {
      name: /pay|subscribe|start trial|continue/i,
    })
    .first();
  await submitButton.waitFor({
    state: "visible",
    timeout: STRIPE_CHECKOUT_UI_STEP_TIMEOUT_MS,
  });
  await submitButton.click();
}
