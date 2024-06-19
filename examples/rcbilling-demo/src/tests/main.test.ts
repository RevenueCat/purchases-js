import { expect, test } from "vitest";
import puppeteer, { Browser, ElementHandle, Frame, Page } from "puppeteer";

const _LOCAL_URL = "http://localhost:3001/";
const _CARD_CLASS = ".card";

test("Get offerings displays packages", async () => {
  const userId = `rc_billing_demo_test_${Date.now()}`;
  const { browser, page } = await setupTest(userId);
  const packageCards = await getPackageCards(page);
  expect(packageCards.length).toEqual(3);
  await expectElementContainsText(packageCards[0], "$3.00");
  await expectElementContainsText(packageCards[1], "$9.99");
  await expectElementContainsText(packageCards[2], "$19.99");
  await browser.close();
});

test(
  "Can purchase a product",
  async () => {
    const userId = `rc_billing_demo_test_${Date.now()}`;
    const { browser, page } = await setupTest(userId);

    // Perform purchase
    const weeklyPackageCard = (await getPackageCards(page))[1];
    const button = await weeklyPackageCard.$("button");
    expect(button).not.toBeNull();
    await button?.click();
    await waitMilliseconds(2000);
    await enterEmailAndContinue(page, userId);
    await waitMilliseconds(8000);
    await enterCreditCardDetailsAndContinue(page);

    // Confirm success page has shown.
    await page.waitForSelector('div[data-type="success"]', { timeout: 15000 });

    await browser.close();
  },
  { timeout: 40000, retry: 2 },
);

async function setupTest(
  userId: string,
): Promise<{ browser: Browser; page: Page }> {
  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await browser.newPage();
  await navigateToUrl(page, userId);
  await page.setViewport({ width: 1366, height: 768 });
  await page.waitForSelector(_CARD_CLASS, { timeout: 5000 });
  return { browser, page };
}

async function getPackageCards(page: Page): Promise<ElementHandle[]> {
  return await page.$$(_CARD_CLASS);
}

async function enterEmailAndContinue(
  page: Page,
  userId: string,
): Promise<void> {
  const email = `${userId}@revenuecat.com`;
  await typeTextInPageSelector(page, 'input[name="email"]', email);
  const continueButton = await page.$(".intent-primary");
  expect(continueButton).not.toBeNull();
  await continueButton?.click();
}

async function enterCreditCardDetailsAndContinue(page: Page): Promise<void> {
  const formFrame = await findFrameWithSelector(page, 'input[name="number"]');
  await typeTextInFrameSelector(
    page,
    formFrame!,
    'input[name="number"]',
    "4242424242424242",
  );
  await typeTextInFrameSelector(
    page,
    formFrame!,
    'input[name="expiry"]',
    "0130",
  );
  await typeTextInFrameSelector(page, formFrame!, 'input[name="cvc"]', "424");
  await typeTextInFrameSelector(
    page,
    formFrame!,
    'input[name="postalCode"',
    "42424",
    false,
  );
  const payButton = await page.$(".intent-primary");
  expect(payButton).not.toBeNull();
  await payButton?.click();
}

async function findFrameWithSelector(
  page: Page,
  selector: string,
): Promise<Frame> {
  const frames = page.frames();
  let foundFrame: Frame | null = null;
  for (const frame of frames) {
    if ((await frame.$(selector)) != null) {
      foundFrame = frame;
    }
  }
  expect(foundFrame).not.toBeNull();
  return foundFrame!;
}

async function expectElementContainsText(element: ElementHandle, text: string) {
  expect(await element.$(`::-p-text(${text})`)).not.toBeNull();
}

async function navigateToUrl(page: Page, userId: string): Promise<void> {
  const baseUrl =
    (import.meta.env.VITE_RC_BILLING_DEMO_URL as string | undefined) ??
    _LOCAL_URL;
  await page.goto(`${baseUrl}paywall/${encodeURIComponent(userId)}`);
}

async function typeTextInPageSelector(
  page: Page,
  selector: string,
  text: string,
): Promise<void> {
  const inputText = await page.$(selector);
  expect(inputText).not.toBeNull();
  await inputText?.focus();
  await page.keyboard.type(text);
}

async function typeTextInFrameSelector(
  page: Page,
  frame: Frame,
  selector: string,
  text: string,
  failIfNotFound: boolean = true,
): Promise<void> {
  const inputText = await frame.$(selector);
  if (failIfNotFound) {
    expect(inputText).not.toBeNull();
  }
  if (inputText != null) {
    await inputText?.focus();
    await page.keyboard.type(text, { delay: 100 });
  }
}

async function waitMilliseconds(milliseconds: number) {
  await new Promise((r) => setTimeout(r, milliseconds));
}
