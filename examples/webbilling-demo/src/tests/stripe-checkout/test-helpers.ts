import { expect, type Page } from "@playwright/test";
import { STRIPE_CHECKOUT_TEST_API_KEY } from "../helpers/fixtures";
import {
  type integrationTest,
  SKIP_STRIPE_TESTS_ON_CAPTCHA,
} from "../helpers/integration-test";
import { navigateToLandingUrl } from "../helpers/test-helpers";

export const STRIPE_CHECKOUT_UI_STEP_TIMEOUT_MS = 60_000;
export const STRIPE_CHECKOUT_TEST_TIMEOUT_MS = 240_000;

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

const getStripeCheckoutEmailInput = (page: Page) => {
  const checkoutFrame = getStripeEmbeddedCheckoutFrame(page);

  return checkoutFrame
    .getByLabel(/email/i)
    .or(checkoutFrame.getByPlaceholder(/email@example.com/i))
    .or(checkoutFrame.locator("[name='email']"))
    .first();
};

// hCaptcha challenge frames use a #frame=challenge fragment; Cloudflare
// Turnstile loads from challenges.cloudflare.com.
const CAPTCHA_FRAME_URL_PATTERN =
  /hcaptcha\.com\/.*frame=challenge|challenges\.cloudflare\.com/i;

export const hasCaptchaChallenge = (page: Page) =>
  page.frames().some((frame) => CAPTCHA_FRAME_URL_PATTERN.test(frame.url()));

// A CAPTCHA the test cannot solve only blocks releases on CI, where
// SKIP_STRIPE_TESTS_ON_CAPTCHA is set; locally the var is unset and the test
// fails as usual.
export async function confirmPaymentCompleteOrSkipOnCaptcha(
  test: typeof integrationTest,
  page: Page,
  timeout: number,
) {
  const successText = page.getByText("Payment complete");
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await successText.isVisible()) {
      return;
    }
    test.skip(
      SKIP_STRIPE_TESTS_ON_CAPTCHA && hasCaptchaChallenge(page),
      "Stripe presented a CAPTCHA challenge that cannot be solved by the test.",
    );
    await page.waitForTimeout(500);
  }
  await expect(successText).toBeVisible({ timeout: 1_000 });
}

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

export async function confirmStripeCheckoutEmailPrefilled(
  page: Page,
  email: string,
) {
  await confirmStripeCheckoutVisible(page);

  const checkoutFrameElement = page.locator(
    "[data-testid='stripe-checkout-mount'] iframe",
  );
  const checkoutFrameHandle = await checkoutFrameElement.elementHandle();
  const checkoutFrame = await checkoutFrameHandle?.contentFrame();

  await expect
    .poll(
      async () => {
        return await checkoutFrame?.evaluate(() => {
          const formControlValues = Array.from(
            document.querySelectorAll("input, textarea, select"),
          ).map((element) => {
            if (
              element instanceof HTMLInputElement ||
              element instanceof HTMLTextAreaElement ||
              element instanceof HTMLSelectElement
            ) {
              return element.value;
            }

            return "";
          });

          return [document.body.innerText, ...formControlValues].join("\n");
        });
      },
      { timeout: STRIPE_CHECKOUT_UI_STEP_TIMEOUT_MS },
    )
    .toContain(email);
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
    const emailInput = getStripeCheckoutEmailInput(page);

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
