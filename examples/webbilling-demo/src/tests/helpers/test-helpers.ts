import type { APIResponse } from "@playwright/test";
import { type Page, type Locator, expect } from "@playwright/test";
import type { StoreLoadTime } from "@revenuecat/purchases-js";
import { BASE_URL, NON_TAX_TEST_API_KEY } from "./fixtures";
import type { integrationTest } from "./integration-test";
import {
  ALLOW_PAYWALLS_TESTS,
  SKIP_PADDLE_TESTS,
  SKIP_STRIPE_TESTS,
} from "./integration-test";

export type RouteFulfillOptions = {
  body?: string | Buffer | undefined;
  contentType?: string | undefined;
  headers?: { [key: string]: string } | undefined;
  json?: Record<string, unknown>;
  path?: string | undefined;
  response?: APIResponse | undefined;
  status?: number | undefined;
};

// Infer from the demo paywall that the only button with an svg is the back button.
export const getBackButtons = (page: Page) =>
  page.locator("[data-testid='button-navigate_back']");

export const CARD_SELECTOR = ".packages div.card";
export const PACKAGE_SELECTOR = "button.rc-pw-package";
export const TAX_SKELETON_SELECTOR = "div[data-testid='tax-loading-skeleton']";

export const skipPaywallsTestIfDisabled = (test: typeof integrationTest) => {
  test.skip(
    !ALLOW_PAYWALLS_TESTS,
    "Paywalls tests are disabled. To enable, set VITE_ALLOW_PAYWALLS_TESTS=true in the environment variables.",
  );
};

export const skipStripeTestsIfDisabled = (test: typeof integrationTest) => {
  test.skip(
    SKIP_STRIPE_TESTS,
    "Stripe tests are disabled. To enable them, unset VITE_SKIP_STRIPE_TESTS or set it to false.",
  );
};

export const skipPaddleTestsIfDisabled = (test: typeof integrationTest) => {
  test.skip(
    SKIP_PADDLE_TESTS,
    "Paddle tests are disabled. To enable them, unset VITE_SKIP_PADDLE_TESTS or set it to false.",
  );
};

function getRandomHash(length: number = 6): string {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length)),
  ).join("");
}

export function getUserId(browserName: string) {
  const randomId = getRandomHash();
  const shortBrowserName = browserName.slice(0, 3);
  return `e2e_${randomId}_${shortBrowserName}`;
}

export async function performPurchase(
  page: Page,
  card: Locator,
  email: string,
) {
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
    $displayName?: string;
    nickname?: string;
    hideCheckoutBackButton?: boolean;
    hideBackButtons?: boolean;
    discountCode?: string;
    storeLoadTime?: StoreLoadTime;
    requireCheckoutConsent?: boolean;
  },
  apiKey?: string,
) {
  const key = apiKey ?? NON_TAX_TEST_API_KEY;
  if (key) {
    await page.addInitScript(`window.__RC_API_KEY__ = "${key}";`);
  }

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
    $displayName,
    nickname,
    hideCheckoutBackButton,
    discountCode,
    storeLoadTime,
    requireCheckoutConsent,
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
  if ($displayName) {
    params.append("$displayName", $displayName);
  }
  if (nickname) {
    params.append("nickname", nickname);
  }
  if (hideCheckoutBackButton !== undefined) {
    params.append("hideCheckoutBackButton", hideCheckoutBackButton.toString());
  }
  if (queryString?.hideBackButtons !== undefined) {
    params.append("hideBackButtons", queryString.hideBackButtons.toString());
  }
  if (discountCode) {
    params.append("discountCode", discountCode);
  }
  if (storeLoadTime) {
    params.append("storeLoadTime", storeLoadTime);
  }
  if (requireCheckoutConsent) {
    params.append("requireCheckoutConsent", "true");
  }

  const rcPaywallPath = offeringId ? "rc_paywall" : "rc_paywall_no_offering";

  const url = `${BASE_URL}${useRcPaywall ? rcPaywallPath : "paywall"}/${encodeURIComponent(userId)}?${params.toString()}`;
  await page.goto(url);

  return page;
}

async function getAllElementsByLocator(
  locator: Locator,
  containsText?: string,
) {
  // Wait for at least one element to be visible
  await expect(locator.first()).toBeVisible();

  if (containsText !== undefined) {
    locator = locator.filter({ hasText: containsText });
  }
  return await locator.all();
}

export const getPackageCards = (page: Page, text?: string) =>
  getAllElementsByLocator(page.locator(CARD_SELECTOR), text);

export const getPaywallPackageCards = (page: Page, text?: string) =>
  getAllElementsByLocator(page.locator(PACKAGE_SELECTOR), text);

export const getPaywallPurchaseButtons = (page: Page) =>
  getAllElementsByLocator(page.locator("button.rc-pw-purchase-button"));

export const getStripePaymentFrame = (page: Page) =>
  page.frameLocator(
    "#payment-element iframe[title='Secure payment input frame']",
  );

export const getStripeEmailFrame = (page: Page) =>
  page.frameLocator("iframe[title='Secure email input frame']");

// The Address Element is mounted inside the `#address-element` container.
// Scope to that container so we don't match the payment/email iframes.
export const getStripeAddressFrame = (page: Page) =>
  page.frameLocator("#address-element iframe").first();

export interface BillingAddressDetails {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
}

type StripeAddressFrame = ReturnType<typeof getStripeAddressFrame>;

/**
 * Reveals the structured address fields (line 1/2, city, state, ZIP) when the
 * Address Element is collapsed behind Google autocomplete.
 *
 * When the Address Element runs alongside the Payment Element, Stripe enables
 * autocomplete and initially shows only a country dropdown and a single
 * "Address" search field. Focusing/typing in that field opens a dropdown that
 * always contains a static "Enter address manually" option — regardless of
 * whether Google returns any predictions (they don't load on localhost, where
 * Stripe's built-in Google Maps key is referrer-restricted). Clicking it
 * expands the structured fields.
 *
 * The dropdown renders in a separate, dynamically-named Stripe iframe (not
 * inside `#address-element`), so we scan every frame for the option and
 * dispatch the click directly (a plain `.click()` can be flaky here).
 */
async function revealStructuredAddressFields(
  page: Page,
  addressFrame: StripeAddressFrame,
): Promise<void> {
  // Already expanded (autocomplete unavailable for this country, or a previous
  // call already switched to manual entry): nothing to do.
  if ((await addressFrame.getByLabel("Address line 1").count()) > 0) {
    return;
  }

  const tryClickManualEntry = async (): Promise<boolean> => {
    for (const frame of page.frames()) {
      const manualEntry = frame.getByText("Enter address manually").first();
      if (
        (await manualEntry.count()) > 0 &&
        (await manualEntry.isVisible().catch(() => false))
      ) {
        await manualEntry.dispatchEvent("click");
        return true;
      }
    }
    return false;
  };

  // Focus and type a character into the search field to surface the dropdown.
  const searchField = addressFrame.getByLabel("Address", { exact: true });
  await searchField.click();
  if (!(await tryClickManualEntry())) {
    await searchField.pressSequentially("5th avenue", { delay: 100 });
  }

  await expect
    .poll(tryClickManualEntry, {
      timeout: 10_000,
      message:
        "Could not find the Stripe 'Enter address manually' option to reveal the structured address fields",
    })
    .toBe(true);

  // Wait for the structured fields to actually render before callers fill them.
  await expect(addressFrame.getByLabel("Address line 1")).toBeVisible();
}

/**
 * Fills the Stripe Address Element. The element runs alongside the Payment
 * Element, so Stripe enables Google autocomplete and collapses the form into a
 * single search field; we first switch to manual entry to reveal the structured
 * fields, then fill them directly. Only the provided fields are filled, so a
 * partial address can be populated (e.g. everything except the name).
 */
export async function enterBillingAddress(
  page: Page,
  details: BillingAddressDetails,
): Promise<void> {
  const addressFrame = getStripeAddressFrame(page);

  // Set the country first so dependent fields (e.g. the state dropdown) render.
  if (details.countryCode !== undefined) {
    await addressFrame
      .getByLabel("Country or region")
      .selectOption(details.countryCode);
  }

  // Expand the structured fields if they're hidden behind autocomplete.
  await revealStructuredAddressFields(page, addressFrame);

  if (details.name !== undefined) {
    await addressFrame.getByLabel("Name").fill(details.name);
  }
  if (details.line1 !== undefined) {
    await addressFrame.getByLabel("Address line 1").fill(details.line1);
  }
  if (details.line2 !== undefined) {
    await addressFrame.getByLabel("Address line 2").fill(details.line2);
  }
  if (details.city !== undefined) {
    await addressFrame.getByLabel("City").fill(details.city);
  }
  if (details.state !== undefined) {
    // The label depends on the country (e.g. "State" in the US, "Province" in
    // Canada).
    await addressFrame.getByLabel(/State|Province/).selectOption(details.state);
  }
  if (details.postalCode !== undefined) {
    // The label depends on the country (e.g. "ZIP" in the US, "Postal code" in
    // Canada).
    await addressFrame.getByLabel(/ZIP|Postal code/).fill(details.postalCode);
  }
}

export const getStripe3DSFrame = (page: Page) =>
  page.frameLocator(
    "iframe[src*='https://js.stripe.com/v3/three-ds-2-challenge']",
  );

async function waitForCheckoutFormReady(page: Page): Promise<void> {
  const formContainer = page.locator(".rc-checkout-form-container");
  await expect(formContainer).toBeVisible();
  await expect(formContainer).not.toHaveClass(/invisible/);
}

export async function enterEmail(page: Page, email: string): Promise<void> {
  const stripeFrame = getStripeEmailFrame(page);
  const emailInput = stripeFrame.getByPlaceholder("you@example.com");
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

  await waitForCheckoutFormReady(page);
  await page.locator("button[data-testid='PayButton']").waitFor();
  const checkoutTitle = page.getByText("Secure Checkout");

  await expect(checkoutTitle).toBeVisible();
  const stripeFrame = getStripePaymentFrame(page);

  const numberInput = stripeFrame.getByPlaceholder("1234 1234 1234");
  await expect(numberInput).toBeVisible();
  await numberInput.fill(cardNumber);

  // When full billing address collection is enabled, the country/postal code
  // live in the separate Address Element instead of the Payment Element. The
  // `#address-element` container is only rendered in that case, so use its
  // presence to decide where to fill the country.
  const collectsFullAddress =
    (await page.locator("#address-element").count()) > 0;

  // Inserting the country first just to make sure that the change event is triggered by Stripe
  // This is a bug that we are trying to workaround, however we know that setting the country/postal code as last
  // might not trigger the update event.
  // Also changing it might not trigger it.
  if (collectsFullAddress) {
    await getStripeAddressFrame(page)
      .getByLabel("Country or region")
      .selectOption(countryCode);
  } else {
    await stripeFrame.getByLabel("Country").selectOption(countryCode);

    if (postalCode !== undefined) {
      await stripeFrame.getByPlaceholder("12345").fill(postalCode);
    }
  }

  await stripeFrame.getByPlaceholder("MM / YY").fill(expiration);
  await stripeFrame.getByLabel("Security Code").fill(securityCode);
}

export async function enterSecurityCode(page: Page, code: string) {
  const stripeFrame = getStripePaymentFrame(page);
  await stripeFrame.getByLabel("Security Code").fill(code);
}

export async function clickPayButton(
  page: Page,
  waitForAnimations: number = 3000,
) {
  // The postal code is not shown at the beginning, however when the country is selected
  // the postal code is shown after a short delay and takes the position of the purchase button.
  // this causes the following step to click on the zipcode again instead of the purchase button since
  // it gets moved between the moment in which the element is found and when it's clicked in the test.
  // The following wait makes sure that all animations are completed before proceeding with the test.
  await page.waitForTimeout(waitForAnimations);

  const button = page.locator(
    "button[data-testid='PayButton']:not([disabled])",
  );
  await button.waitFor();
  await button.click();
}

export async function acceptCheckoutConsent(page: Page) {
  const checkbox = page.getByTestId("checkout-consent-checkbox");
  await expect(checkbox).toBeVisible();
  await checkbox.check();
}

export async function expectCheckoutConsentRequired(page: Page) {
  await expect(page.getByTestId("checkout-consent")).toBeVisible();
  await expect(page.getByTestId("PayButton")).toBeDisabled();
}

export async function confirmTaxCalculation(page: Page) {
  await expect(page.locator(TAX_SKELETON_SELECTOR)).toBeVisible();
  await expect(page.locator(TAX_SKELETON_SELECTOR)).not.toBeVisible();
}

export async function confirmTaxCalculating(page: Page) {
  await expect(page.locator(TAX_SKELETON_SELECTOR)).toBeVisible();
}

// Not a reliable check since it's a negative one
export async function confirmTaxNotCalculating(page: Page) {
  await expect(page.locator(TAX_SKELETON_SELECTOR)).not.toBeVisible();
}

export async function confirmPaymentComplete(page: Page, timeout?: number) {
  const successText = page.getByText("Payment complete");
  await expect(successText).toBeVisible(
    timeout !== undefined ? { timeout } : undefined,
  );
}

export async function confirmPaymentError(
  page: Page,
  message: string | RegExp,
  timeout?: number,
) {
  const errorText = page.getByText(message);
  await expect(errorText).toBeVisible(
    timeout !== undefined ? { timeout } : undefined,
  );
}

export async function clickCancelStripe3DSButton(page: Page) {
  const stripe3DSFrame = getStripe3DSFrame(page);
  const button = stripe3DSFrame.getByText("Cancel");
  await expect(button).toBeVisible();
  await button.click();
}

export async function confirmStripeCardError(page: Page, message: string) {
  const stripeFrame = getStripePaymentFrame(page);
  const cardError = stripeFrame.getByText(message);
  await expect(cardError).toBeVisible();
}

export async function confirmStripeEmailError(
  page: Page,
  message: string | RegExp,
) {
  const stripeFrame = getStripeEmailFrame(page);
  const emailError = stripeFrame.getByText(message);
  await expect(emailError).toBeVisible();
}

export async function confirmStripeEmailFieldNotVisible(page: Page) {
  await waitForCheckoutFormReady(page);
  await expect(
    page.locator("#payment-element iframe[title='Secure payment input frame']"),
  ).toBeVisible();

  // Then check that the email field is not visible
  const stripeFrame = getStripeEmailFrame(page);
  const emailField = stripeFrame.getByPlaceholder("you@example.com");
  await expect(emailField).not.toBeVisible();
}

export async function confirmStripeEmailFieldVisible(page: Page) {
  const stripeFrame = getStripeEmailFrame(page);
  const emailField = stripeFrame.getByPlaceholder("you@example.com");
  await expect(emailField).toBeVisible();
}

export async function confirmPayButtonDisabled(page: Page) {
  const button = page.locator("button[data-testid='PayButton'][disabled]");
  await expect(button).toBeVisible();
}
