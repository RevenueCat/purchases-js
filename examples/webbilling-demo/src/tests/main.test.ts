import type { Browser, Page, Response, Locator } from "@playwright/test";
import test, { expect } from "@playwright/test";

const _LOCAL_URL = "http://localhost:3001/";
const CARD_SELECTOR = "div.card";
const PACKAGE_SELECTOR = "button.rc-pw-package";
const RC_PAYWALL_TEST_OFFERING_ID = "rc_paywalls_e2e_test_2";
const RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES =
  "rc_paywalls_e2e_test_variables_2";

test.describe("Main", () => {
  test("Get offerings displays packages", async ({ browser, browserName }) => {
    const userId = getUserId(browserName);
    const page = await setupTest(browser, userId);
    const packageCards = await getPackageCards(page);

    const EXPECTED_VALUES = [
      /30[,.]00/,
      /19[,.]99/,
      /15[,.]00/,
      /99[,.]99/,
      /2[,.]99/,
    ];

    await Promise.all(
      packageCards.map(
        async (card, index) =>
          await expect(card).toHaveText(EXPECTED_VALUES[index]),
      ),
    );
  });

  test("Get offerings can filter by offering ID", async ({
    browser,
    browserName,
  }) => {
    const userId = getUserId(browserName);
    const offeringId = "default_download";
    const page = await setupTest(browser, userId, { offeringId });

    const EXPECTED_VALUES = [/30[,.]00/, /15[,.]00/, /19[,.]99/];
    const packageCards = await getPackageCards(page);
    expect(packageCards.length).toBe(3);
    await Promise.all(
      packageCards.map(
        async (card, index) =>
          await expect(card).toHaveText(EXPECTED_VALUES[index]),
      ),
    );
  });

  test("Can purchase a subscription product", async ({
    browser,
    browserName,
  }) => {
    const userId = `${getUserId(browserName)}_subscription`;
    const page = await setupTest(browser, userId);

    const packageCards = await getPackageCards(page);
    await performPurchase(page, packageCards[1], userId);
  });

  test("Can purchase skipping the email", async ({ browser, browserName }) => {
    const userId = `${getUserId(browserName)}_email_skip`;
    const page = await setupTest(browser, userId, {
      email: `${userId}@revenuecat.com`,
    });

    const packageCards = await getPackageCards(page, "E2E NonConsumable");
    expect(packageCards.length).toEqual(1);
    await startPurchaseFlow(packageCards[0]);
    await enterCreditCardDetails(page, "4242 4242 4242 4242");
    await clickPayButton(page);
    await confirmPaymentComplete(page);
  });

  test("Displays email format errors", async ({ browser, browserName }) => {
    const userId = `${getUserId(browserName)}_subscription`;
    const page = await setupTest(browser, userId);

    const packageCards = await getPackageCards(page);
    await startPurchaseFlow(packageCards[1]);
    await enterEmail(page, "invalid-email");

    const stripeFrame = getStripeEmailFrame(page);
    const errorText = stripeFrame.getByText("Your email address is invalid.");
    await expect(errorText).toBeVisible({ timeout: 10000 });
  });

  test("Displays email suggestion from stripe", async ({
    browser,
    browserName,
  }) => {
    const userId = `${getUserId(browserName)}_subscription`;
    const page = await setupTest(browser, userId);

    const packageCards = await getPackageCards(page);
    await startPurchaseFlow(packageCards[1]);
    await enterEmail(page, `${userId}@revenueci.comm`);
    await enterCreditCardDetails(page, "4242 4242 4242 4242");
    await clickPayButton(page);

    const stripeFrame = getStripeEmailFrame(page);
    const errorText = stripeFrame.getByText("Did you mean @revenueci.com?");
    await expect(errorText).toBeVisible({ timeout: 10000 });
  });

  test("Displays email deliverability errors", async ({
    browser,
    browserName,
  }) => {
    const userId = `${getUserId(browserName)}_subscription`;
    const page = await setupTest(browser, userId);
    const email = `${userId}@revenueci.comm`;

    const packageCards = await getPackageCards(page);
    await startPurchaseFlow(packageCards[1]);
    await enterEmail(page, email);
    await enterCreditCardDetails(page, "4242 4242 4242 4242");
    await clickPayButton(page);

    const errorText = page.getByText(
      "The email address ${email} couldn't be verified. Please provide a valid email address.",
    );
    await expect(errorText).toBeVisible({ timeout: 10000 });
  });

  test("Displays handled card form submission errors", async ({
    browser,
    browserName,
  }) => {
    const userId = `${getUserId(browserName)}_subscription`;
    const email = getEmailFromUserId(userId);
    const page = await setupTest(browser, userId);

    const packageCards = await getPackageCards(page);
    await startPurchaseFlow(packageCards[1]);
    await enterEmail(page, email);
    await enterCreditCardDetails(page, "4000 0000 0000 0002");
    await clickPayButton(page);

    const stripeFrame = getStripePaymentFrame(page);
    const errorText = stripeFrame.getByText("Your card was declined.");
    await expect(errorText).toBeVisible({ timeout: 10000 });
  });

  test("Displays unhandled card form submission errors", async ({
    browser,
    browserName,
  }) => {
    const userId = `${getUserId(browserName)}_subscription`;
    const email = getEmailFromUserId(userId);
    const page = await setupTest(browser, userId);

    const packageCards = await getPackageCards(page);
    await startPurchaseFlow(packageCards[1]);
    await enterEmail(page, email);
    await enterCreditCardDetails(page, "4000003800000446");
    await clickPayButton(page);

    const stripe3DSFrame = getStripe3DSFrame(page);

    const cancelButton = stripe3DSFrame.getByText("Cancel");
    await expect(cancelButton).toBeVisible({
      timeout: 10000,
    });

    await cancelButton.click();

    const errorText = page.getByText(
      "We are unable to authenticate your payment method. Please choose a different payment method and try again.",
    );
    await expect(errorText).toBeVisible({ timeout: 10000 });
  });

  test("Propagates UTM params to metadata when purchasing", async ({
    browser,
    browserName,
  }) => {
    const userId = `${getUserId(browserName)}_subscription`;
    const utm_params = {
      utm_source: "utm-source",
      utm_medium: "utm-medium",
      utm_campaign: "utm-campaign",
      utm_term: "utm-term",
      utm_content: "utm-content",
    };
    const page = await setupTest(browser, userId, { ...utm_params });

    const packageCards = await getPackageCards(page);
    const requestPromise = waitForCheckoutStartRequest(page, utm_params);
    await startPurchaseFlow(packageCards[1]);
    await requestPromise;
  });

  test("Does not propagate UTM params to metadata when purchasing if the developer opts out", async ({
    browser,
    browserName,
  }) => {
    const userId = `${getUserId(browserName)}_subscription`;
    const utm_params = {
      utm_source: "utm-source",
      utm_medium: "utm-medium",
      utm_campaign: "utm-campaign",
      utm_term: "utm-term",
      utm_content: "utm-content",
    };
    const page = await setupTest(browser, userId, {
      ...utm_params,
      optOutOfAutoUTM: true,
    });

    const packageCards = await getPackageCards(page);
    const requestPromise = waitForCheckoutStartRequest(page, {});
    await startPurchaseFlow(packageCards[1]);
    await requestPromise;
  });

  test("Can render an RC Paywall", async ({ browser, browserName }) => {
    const userId = `${getUserId(browserName)}_subscription`;
    const page = await setupTest(browser, userId, {
      offeringId: RC_PAYWALL_TEST_OFFERING_ID,
      useRcPaywall: true,
    });
    const title = page.getByText("E2E Tests for Purchases JS");
    await expect(title).toBeVisible();
  });

  test("Can render an RC Paywall using variables", async ({
    browser,
    browserName,
  }) => {
    const userId = `${getUserId(browserName)}_subscription`;
    const page = await setupTest(browser, userId, {
      offeringId: RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES,
      useRcPaywall: true,
    });
    const packageCards = await getPaywallPackageCards(page);

    // Get the purchase button as a Locator
    const purchaseButton = (
      await getAllElementsByLocator(page, "button.rc-pw-purchase-button")
    )[0];

    await expect(purchaseButton).toContainText(
      "PURCHASE FOR $1.25/1wk($5.00/mo)",
    );

    await packageCards[1].click();
    await expect(purchaseButton).toContainText("PURCHASE FOR $30.00");

    await packageCards[2].click();
    await expect(purchaseButton).toContainText(
      "PURCHASE FOR $19.99/1yr($1.67/mo)",
    );
  });

  test("Can purchase a subscription product for RC Paywall", async ({
    browser,
    browserName,
  }) => {
    const userId = `${getUserId(browserName)}_subscription`;
    const page = await setupTest(browser, userId, {
      offeringId: RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES,
      useRcPaywall: true,
    });
    const title = page.getByText("E2E Tests for Purchases JS");
    await expect(title).toBeVisible();

    const packageCards = await getPaywallPackageCards(page);
    await packageCards[0].click();

    // Get the purchase button as a Locator
    const purchaseButton = (
      await getAllElementsByLocator(page, "button.rc-pw-purchase-button")
    )[0];

    await expect(purchaseButton).toBeVisible();

    // Target the parent element of the purchase button since the function targets the button itself
    await performPurchase(page, purchaseButton.locator(".."), userId);
  });

  test("Can purchase a consumable product", async ({
    browser,
    browserName,
  }) => {
    const userId = `${getUserId(browserName)}_consumable`;
    const page = await setupTest(browser, userId);

    const packageCards = await getPackageCards(page, "E2E Consumable");
    expect(packageCards.length).toEqual(1);
    await performPurchase(page, packageCards[0], userId);
  });

  test("Can purchase a non consumable product", async ({
    browser,
    browserName,
  }) => {
    const userId = `${getUserId(browserName)}_non_consumable`;
    const page = await setupTest(browser, userId);

    const packageCards = await getPackageCards(page, "E2E NonConsumable");
    expect(packageCards.length).toEqual(1);
    await performPurchase(page, packageCards[0], userId);
  });

  test("Displays error when unknown backend error", async ({
    browser,
    browserName,
  }) => {
    const userId = `${getUserId(browserName)}_already_purchased`;
    const page = await setupTest(browser, userId);

    const packageCards = await getPackageCards(page);

    // Prepare error
    await page.route("*/**/checkout/start", async (route) => {
      await route.fulfill({
        body: '{ "code": 7110, "message": "Test error message"}',
        status: 400,
      });
    });

    // Start purchase flow
    await startPurchaseFlow(packageCards[1]);

    // Confirm error page has shown.
    const errorTitleText = page.getByText("Something went wrong");
    await expect(errorTitleText).toBeVisible();

    const errorMessageText = page.getByText(
      "Purchase not started due to an error. Error code: 7110",
    );
    await expect(errorMessageText).toBeVisible();
  });

  [
    ["es", "Pago seguro mediante RevenueCat"],
    ["it", "Pagamento sicuro tramite RevenueCat"],
    ["en", "Secure checkout by RevenueCat"],
    ["fr", "Paiement sécurisé par RevenueCat"],
    ["de", "Sicherer Checkout über RevenueCat"],
  ].forEach(([lang, title]) => {
    test(`Shows the purchase flow in ${lang}`, async ({
      browser,
      browserName,
    }) => {
      const userId = `${getUserId(browserName)}_${lang}_language`;
      const page = await setupTest(browser, userId, { lang });

      const packageCards = await getPackageCards(page);
      await startPurchaseFlow(packageCards[1]);

      await expect(page.getByText(title)).toBeVisible({ timeout: 10000 });
    });
  });

  [
    ["es", "Pago seguro mediante RevenueCat"],
    ["it", "Pagamento sicuro tramite RevenueCat"],
    ["en", "Secure checkout by RevenueCat"],
    ["fr", "Paiement sécurisé par RevenueCat"],
    ["de", "Sicherer Checkout über RevenueCat"],
  ].forEach(([lang, title]) => {
    test(`Shows the purchase flow in ${lang} when purchasing from paywalls`, async ({
      browser,
      browserName,
    }) => {
      const userId = `${getUserId(browserName)}_${lang}_language`;
      const page = await setupTest(browser, userId, {
        lang,
        offeringId: RC_PAYWALL_TEST_OFFERING_ID,
        useRcPaywall: true,
      });

      const packageCards = await getPaywallPackageCards(page);
      await packageCards[0].click();

      // Get the purchase button as a Locator
      const purchaseButton = (
        await getAllElementsByLocator(page, "button.rc-pw-purchase-button")
      )[0];

      await expect(purchaseButton).toBeVisible();
      await purchaseButton.click();

      await expect(page.getByText(title)).toBeVisible({ timeout: 10000 });
    });
  });

  test("Tracks events", async ({ browser, browserName }) => {
    const userId = `${getUserId(browserName)}_subscription`;
    const page = await browser.newPage();

    const waitForTrackEventPromise = page.waitForResponse(
      successfulEventTrackingResponseMatcher((event) => {
        try {
          expect(event?.id).toBeDefined();
          expect(event?.timestamp_ms).toBeDefined();
          expect(event?.type).toBe("web_billing");
          expect(event?.event_name).toBe("sdk_initialized");
          expect(event?.app_user_id).toBe(userId);

          const context = event?.context;
          expect(context).toBeInstanceOf(Object);

          expect(context.library_name).toEqual("purchases-js");
          expect(typeof context.library_version).toBe("string");
          expect(typeof context.locale).toBe("string");
          expect(typeof context.user_agent).toBe("string");
          expect(typeof context.time_zone).toBe("string");
          expect(typeof context.screen_width).toBe("number");
          expect(typeof context.screen_height).toBe("number");
          expect(context.utm_source).toBeNull();
          expect(context.utm_medium).toBeNull();
          expect(context.utm_campaign).toBeNull();
          expect(context.utm_content).toBeNull();
          expect(context.utm_term).toBeNull();
          expect(context.page_referrer).toBe("");
          expect(typeof context.page_url).toBe("string");
          expect(context.page_title).toBe("Health Check – Web Billing Demo");
          expect(context.source).toBe("sdk");

          const properties = event?.properties;
          expect(typeof properties.trace_id).toBe("string");

          return true;
        } catch (error) {
          console.error("Event validation failed:", error);
          return false;
        }
      }),
      { timeout: 3_000 },
    );
    await navigateToUrl(page, userId);
    await waitForTrackEventPromise;
  });
});

function successfulEventTrackingResponseMatcher(
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

async function performPurchase(page: Page, card: Locator, userId: string) {
  const email = getEmailFromUserId(userId);
  await startPurchaseFlow(card);
  await enterEmail(page, email);
  await enterCreditCardDetails(page, "4242 4242 4242 4242");
  await clickPayButton(page);
  await confirmPaymentComplete(page);
}

async function startPurchaseFlow(card: Locator) {
  const cardButton = card.getByRole("button");
  await cardButton.click();
}

const getEmailFromUserId = (userId: string) => `${userId}@revenuecat.com`;

const getUserId = (browserName: string) =>
  `rc_billing_demo_test_${Date.now()}_${browserName}`;

async function setupTest(
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

const getPackageCards = (page: Page, text?: string) =>
  getAllElementsByLocator(page, CARD_SELECTOR, text);

const getPaywallPackageCards = (page: Page, text?: string) =>
  getAllElementsByLocator(page, PACKAGE_SELECTOR, text);

const getStripePaymentFrame = (page: Page) =>
  page.frameLocator("iframe[title='Secure payment input frame']");

const getStripeEmailFrame = (page: Page) =>
  page.frameLocator("iframe[title='Secure email input frame']");

const getStripe3DSFrame = (page: Page) =>
  page.frameLocator(
    "iframe[src*='https://js.stripe.com/v3/three-ds-2-challenge']",
  );

async function enterEmail(page: Page, email: string): Promise<void> {
  const stripeFrame = getStripeEmailFrame(page);
  const emailInput = stripeFrame.getByPlaceholder("you@example.com");
  await emailInput.fill(email);
  await emailInput.blur();
}

async function enterCreditCardDetails(
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

async function clickPayButton(page: Page) {
  await page.getByTestId("PayButton").click();
}

async function confirmPaymentComplete(page: Page) {
  const successText = page.getByText("Payment complete");
  await expect(successText).toBeVisible({ timeout: 10000 });
}

async function navigateToUrl(
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

const waitForCheckoutStartRequest = (
  page: Page,
  expectedMetadata: Record<string, string>,
) => {
  return page.waitForRequest((request) => {
    if (
      request.url().includes("checkout/start") &&
      request.method() === "POST"
    ) {
      expect(request.postDataJSON().metadata).toStrictEqual(expectedMetadata);
      return true;
    }
    return false;
  });
};
