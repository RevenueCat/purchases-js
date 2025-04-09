import {
  type Page,
  type Locator,
  type Browser,
  expect,
} from "@playwright/test";

export const RC_PAYWALL_TEST_OFFERING_ID = "rc_paywalls_e2e_test_2";
export const RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES =
  "rc_paywalls_e2e_test_variables_2";

export const CARD_SELECTOR = "div.card";
export const PACKAGE_SELECTOR = "button.rc-pw-package";
export const _LOCAL_URL = "http://localhost:3001/";
export function getUserId(browserName: string) {
  return `rc_billing_demo_test_${Date.now()}_${browserName}`;
}

export async function navigateToUrl(
  page: Page,
  userId: string,
  queryString?: {
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
  },
): Promise<void> {
  const baseUrl =
    (import.meta.env?.VITE_RC_BILLING_DEMO_URL as string | undefined) ??
    _LOCAL_URL;

  const {
    offeringId,
    useRcPaywall,
    lang,
    utm_source,
    utm_campaign,
    utm_term,
    utm_content,
    utm_medium,
    optOutOfAutoUTM,
    email,
  } = queryString ?? {};

  const params = new URLSearchParams();
  if (offeringId) {
    params.append("offeringId", offeringId);
  }
  if (lang) {
    params.append("lang", lang);
  }
  if (utm_source) {
    params.append("utm_source", utm_source);
  }
  if (utm_content) {
    params.append("utm_content", utm_content);
  }
  if (utm_term) {
    params.append("utm_term", utm_term);
  }
  if (utm_medium) {
    params.append("utm_medium", utm_medium);
  }
  if (utm_campaign) {
    params.append("utm_campaign", utm_campaign);
  }
  if (optOutOfAutoUTM) {
    params.append("optOutOfAutoUTM", optOutOfAutoUTM.toString());
  }
  if (email) {
    params.append("email", email);
  }

  const url = `${baseUrl}${useRcPaywall ? "rc_paywall" : "paywall"}/${encodeURIComponent(userId)}?${params.toString()}`;
  await page.goto(url);
}

export async function performPurchase(
  page: Page,
  card: Locator,
  userId: string,
) {
  const email = getEmailFromUserId(userId);
  await startPurchaseFlow(card);
  await enterEmail(page, email);
  await enterCreditCardDetails(page, "4242 4242 4242 4242");
  await clickPayButton(page);
  await confirmPaymentComplete(page);
}

export async function startPurchaseFlow(card: Locator) {
  const cardButton = card.getByRole("button");
  await cardButton.click();
}

export const getEmailFromUserId = (userId: string) =>
  `${userId}@revenuecat.com`;

export async function setupTest(
  browser: Browser,
  userId: string,
  queryString?: {
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
  },
) {
  const page = await browser.newPage();
  await navigateToUrl(page, userId, queryString);

  return page;
}

export async function getAllElementsByLocator(
  page: Page,
  locator: string,
  containsText?: string,
) {
  await page.waitForSelector(locator);
  let locatorResult = page.locator(locator);
  if (containsText !== undefined) {
    locatorResult = locatorResult.filter({ hasText: containsText });
  }
  return await locatorResult.all();
}

export const getPackageCards = (page: Page, text?: string) =>
  getAllElementsByLocator(page, CARD_SELECTOR, text);

export const getPaywallPackageCards = (page: Page, text?: string) =>
  getAllElementsByLocator(page, PACKAGE_SELECTOR, text);

export const getStripePaymentFrame = (page: Page) =>
  page.frameLocator("iframe[title='Secure payment input frame']");

export const getStripeEmailFrame = (page: Page) =>
  page.frameLocator("iframe[title='Secure email input frame']");

export const getStripe3DSFrame = (page: Page) =>
  page.frameLocator(
    "iframe[src*='https://js.stripe.com/v3/three-ds-2-challenge']",
  );

export async function enterEmail(page: Page, email: string): Promise<void> {
  const stripeFrame = getStripeEmailFrame(page);
  const emailInput = stripeFrame.getByPlaceholder("you@example.com");
  await emailInput.fill(email);
  await emailInput.blur();
}

export async function enterCreditCardDetails(
  page: Page,
  cardNumber: string,
): Promise<void> {
  // Checmout modal
  const checkoutTitle = page.getByText("Secure Checkout");
  await expect(checkoutTitle).toBeVisible();
  const stripeFrame = getStripePaymentFrame(page);
  const numberInput = stripeFrame.getByPlaceholder("1234 1234 1234");
  await numberInput.fill(cardNumber);
  const expirationYear = (new Date().getFullYear() % 100) + 3;
  await stripeFrame.getByPlaceholder("MM / YY").fill(`01 / ${expirationYear}`);
  await stripeFrame.getByLabel("Security Code").fill("123");
  await stripeFrame.getByLabel("Country").selectOption("US");
  await stripeFrame.getByPlaceholder("12345").fill("12345");
}

export async function clickPayButton(page: Page) {
  const button = await page.waitForSelector(
    "button[data-testid='PayButton']:not([disabled])",
  );
  await button.click();
}

export async function confirmPaymentComplete(page: Page) {
  const successText = page.getByText("Payment complete");
  await expect(successText).toBeVisible({ timeout: 10000 });
}
