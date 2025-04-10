import { type Page, type Locator, expect } from "@playwright/test";
import { LOCAL_URL } from "./fixtures";

export const CARD_SELECTOR = "div.card";
export const PACKAGE_SELECTOR = "button.rc-pw-package";

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
    LOCAL_URL;

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
  await clickContinueButton(page);
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

export async function navigateToLandingUrl(
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
  apiKey?: string,
) {
  if (apiKey) {
    await page.addInitScript(`window.__RC_API_KEY__ = "${apiKey}";`);
  }

  await navigateToUrl(page, userId, queryString);

  return page;
}

async function getAllElementsByLocator(
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

export const getPaywallPurchaseButtons = (page: Page) =>
  getAllElementsByLocator(page, "button.rc-pw-purchase-button");

export const getStripePaymentFrame = (page: Page) =>
  page.frameLocator("iframe[title='Secure payment input frame']");

export const getStripeEmailFrame = (page: Page) =>
  page.frameLocator("iframe[title='Secure email input frame']");

export const getStripe3DSFrame = (page: Page) =>
  page.frameLocator(
    "iframe[src*='https://js.stripe.com/v3/three-ds-2-challenge']",
  );

export async function enterEmail(page: Page, email: string): Promise<void> {
  const emailInput = page.getByPlaceholder("john@appleseed.com");
  await emailInput.fill(email);
  await emailInput.blur();
}

export async function enterCreditCardDetails(
  page: Page,
  cardNumber: string,
  cardInfo?: {
    expiration?: string;
    securityCode?: string;
    countryCode?: string;
    postalCode?: string;
  },
): Promise<void> {
  const countryCode = cardInfo?.countryCode || "US";
  const postalCode =
    cardInfo?.postalCode || (countryCode === "US" ? "12345" : undefined);
  const expirationYear = (new Date().getFullYear() % 100) + 3;
  const expiration = cardInfo?.expiration || `01 / ${expirationYear}`;
  const securityCode = cardInfo?.securityCode || "123";

  const checkoutTitle = page.getByText("Secure Checkout");
  await expect(checkoutTitle).toBeVisible();
  const stripeFrame = getStripePaymentFrame(page);

  const numberInput = stripeFrame.getByPlaceholder("1234 1234 1234");
  await numberInput.fill(cardNumber);

  // Inserting the country first just to make sure that the change event is triggered by Stripe
  // This is a bug that we are trying to workaround, however we know that setting the country/postal code as last
  // might not trigger the update event.
  // Also changing it might not trigger it.

  await stripeFrame.getByLabel("Country").selectOption(countryCode);

  if (postalCode !== undefined) {
    await stripeFrame.getByPlaceholder("12345").fill(postalCode);
  }

  await stripeFrame.getByPlaceholder("MM / YY").fill(expiration);
  await stripeFrame.getByLabel("Security Code").fill(securityCode);
}

export async function clickPayButton(page: Page) {
  const button = await page.waitForSelector(
    "button[data-testid='PayButton']:not([disabled])",
  );
  await button.click();
}

export async function clickContinueButton(page: Page) {
  const button = page.getByText("Continue");
  await button.click();
}

export async function confirmPaymentComplete(page: Page) {
  const successText = page.getByText("Payment complete");
  await expect(successText).toBeVisible({ timeout: 10000 });
}
