import {
  type Browser,
  expect,
  type Locator,
  type Page,
  type Response,
} from "@playwright/test";

const _LOCAL_URL = "http://localhost:3001/";

export function successfulEventTrackingResponseMatcher(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventMatcher: (event: any) => boolean,
) {
  return async (response: Response) => {
    if (
      response.url() !== "https://e.revenue.cat/v1/events" ||
      response.status() !== 200
    ) {
      return false;
    }

    const json = response.request().postDataJSON();
    const sdk_initialized_events = (json?.events || []).filter(eventMatcher);
    return sdk_initialized_events.length === 1;
  };
}

export async function startPurchaseFlow(card: Locator) {
  // Perform purchase
  const cardButton = card.getByRole("button");
  await cardButton.click();
}

export async function performPurchase(
  page: Page,
  card: Locator,
  userId: string,
) {
  await startPurchaseFlow(card);
  await enterEmailAndContinue(page, userId);
  await enterCreditCardDetailsAndContinue(page, "4242 4242 4242 4242");
  // Confirm success page has shown.
  const successText = page.getByText("Payment complete");
  await expect(successText).toBeVisible({ timeout: 10000 });
}

export const getUserId = (browserName: string) =>
  `rc_billing_demo_test_${Date.now()}_${browserName}`;

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

export async function enterEmailAndContinue(
  page: Page,
  userId: string,
): Promise<void> {
  const email = `${userId}@revenuecat.com`;

  await typeTextInPageSelector(page, email);
  await page.getByRole("button", { name: "Continue" }).click();
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
  // Checmout modal
  const checkoutTitle = page.getByText("Secure Checkout");
  await expect(checkoutTitle).toBeVisible();
  const stripeFrame = page.frameLocator(
    "iframe[title='Secure payment input frame']",
  );

  const numberInput = stripeFrame.getByPlaceholder("1234 1234 1234");
  await numberInput.fill(cardNumber);

  // Inserting the country first just to make sure that the change event is triggered by Stripe
  // This is a bug that we are trying to workaround, however we know that setting the country/postal code as last
  // might not trigger the update event.
  // Also changing it might not trigger it.
  const countryCode = cardInfo?.countryCode || "US";
  await stripeFrame.getByLabel("Country").selectOption(countryCode);
  const postalCodeInput = await stripeFrame.getByPlaceholder("12345");
  if (countryCode === "US" || cardInfo?.postalCode) {
    await postalCodeInput.fill(cardInfo?.postalCode || "12345");
  }

  const expirationYear = (new Date().getFullYear() % 100) + 3;
  await stripeFrame
    .getByPlaceholder("MM / YY")
    .fill(cardInfo?.expiration || `01 / ${expirationYear}`);
  await stripeFrame
    .getByLabel("Security Code")
    .fill(cardInfo?.securityCode || "123");
}

export async function enterCreditCardDetailsAndContinue(
  page: Page,
  cardNumber: string,
  cardInfo?: {
    expiration?: string;
    securityCode?: string;
    countryCode?: string;
    postalCode?: string;
  },
): Promise<void> {
  await enterCreditCardDetails(page, cardNumber, cardInfo);
  await page.getByTestId("PayButton").click();
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

  const url = `${baseUrl}${useRcPaywall ? "rc_paywall" : "paywall"}/${encodeURIComponent(userId)}?${params.toString()}`;
  await page.goto(url);
}

async function typeTextInPageSelector(page: Page, text: string): Promise<void> {
  // Fill email
  const emailTitle = page.getByText("What's your email?");
  await expect(emailTitle).toBeVisible();
  await page.getByPlaceholder("john@appleseed.com").click();
  await page.getByPlaceholder("john@appleseed.com").fill(text);
}

export const waitForCheckoutStartRequest = (page: Page) => {
  return page.waitForRequest(
    (request) =>
      request.url().includes("checkout/start") && request.method() === "POST",
  );
};
