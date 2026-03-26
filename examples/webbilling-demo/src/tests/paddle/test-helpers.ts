import { expect, type Page } from "@playwright/test";
import { PADDLE_TEST_API_KEY } from "../helpers/fixtures";
import { navigateToLandingUrl } from "../helpers/test-helpers";

export const PADDLE_UI_STEP_TIMEOUT_MS = 30_000;
export const PADDLE_TEST_TIMEOUT_MS = 120_000;
export const PADDLE_TEST_OFFERING_ID = "Paddle E2E Test Offering";
export const PADDLE_TEST_CARD_NUMBER = "4242 4242 4242 4242";
export const PADDLE_TEST_CARD_CVV = "100";
export const PADDLE_TEST_CARD_EXPIRY = "12 / 34";
export const PADDLE_TEST_POSTCODE = "12345";

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

export const getPaddleCheckoutIframe = (page: Page) => page.locator("iframe");

export const getPaddleCheckoutFrame = (page: Page) =>
  page.frameLocator("iframe");

export async function confirmPaddleCheckoutVisible(page: Page) {
  const iframe = getPaddleCheckoutIframe(page);
  await expect(iframe).toBeVisible({ timeout: PADDLE_UI_STEP_TIMEOUT_MS });

  const checkoutFrame = getPaddleCheckoutFrame(page);
  await expect(
    checkoutFrame.getByRole("textbox", { name: /card number/i }),
  ).toBeVisible({
    timeout: PADDLE_UI_STEP_TIMEOUT_MS,
  });
}

export async function completePaddleCheckoutForm(
  page: Page,
  email: string,
  fullName: string,
  fillEmail: boolean = true,
) {
  await confirmPaddleCheckoutVisible(page);
  const checkoutFrame = getPaddleCheckoutFrame(page);

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
    const emailSummary = checkoutFrame.getByText(email, {
      exact: true,
    });

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
  await cardNumberInput.click();
  await cardNumberInput.clear();
  await cardNumberInput.pressSequentially(PADDLE_TEST_CARD_NUMBER, {
    delay: 15,
  });
  await cardNumberInput.blur();

  const expirationInput = checkoutFrame.getByRole("textbox", {
    name: /expiry/i,
  });
  await expirationInput.click();
  await expirationInput.clear();
  await expirationInput.pressSequentially(PADDLE_TEST_CARD_EXPIRY, {
    delay: 15,
  });
  await expirationInput.blur();

  const securityCodeInput = checkoutFrame.getByRole("textbox", {
    name: /cvv|security code/i,
  });
  await securityCodeInput.click();
  await securityCodeInput.clear();
  await securityCodeInput.pressSequentially(PADDLE_TEST_CARD_CVV, {
    delay: 15,
  });
  await securityCodeInput.blur();

  const cardHolderInput = checkoutFrame.getByRole("textbox", {
    name: /card holder|name on card/i,
  });
  await cardHolderInput.click();
  await cardHolderInput.clear();
  await cardHolderInput.pressSequentially(fullName, { delay: 10 });
  await cardHolderInput.blur();

  const postcodeInput = checkoutFrame.getByRole("textbox", {
    name: /zip\/postcode|postcode/i,
  });
  await postcodeInput.click();
  await postcodeInput.clear();
  await postcodeInput.pressSequentially(PADDLE_TEST_POSTCODE, { delay: 15 });
  await postcodeInput.blur();

  const payButton = checkoutFrame.getByRole("button", {
    name: /^pay /i,
  });
  await payButton.waitFor({
    state: "visible",
    timeout: PADDLE_UI_STEP_TIMEOUT_MS,
  });
  await expect(payButton).toBeEnabled({ timeout: PADDLE_UI_STEP_TIMEOUT_MS });

  const paddleCheckoutSubmission = page.waitForRequest(
    (request) => {
      if (request.method() !== "POST") {
        return false;
      }

      return /checkout-service\.paddle\.com\/transaction-checkout\//.test(
        request.url(),
      );
    },
    {
      timeout: PADDLE_UI_STEP_TIMEOUT_MS,
    },
  );

  await payButton.click();
  await paddleCheckoutSubmission;
}

export async function confirmPaddleProcessingPayment(page: Page) {
  const processingPayment = page.getByText("Processing payment");
  const paymentComplete = page.getByText("Payment complete");

  await expect(processingPayment.or(paymentComplete).first()).toBeVisible({
    timeout: PADDLE_UI_STEP_TIMEOUT_MS,
  });
}
