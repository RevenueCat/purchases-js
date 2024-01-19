import { expect, test } from "vitest";
import puppeteer, { Browser, ElementHandle, Frame, Page } from "puppeteer";

const _LOCAL_URL = "http://0.0.0.0:3001/";
const _CARD_CLASS = ".card";

test("Get offerings displays packages", async () => {
  const { browser, page } = await setupTest();
  const packageCards = await getPackageCards(page);
  expect(packageCards.length).toEqual(3);
  await expectElementContainsText(packageCards[0], "3.00 USD");
  await expectElementContainsText(packageCards[1], "9.99 USD");
  await expectElementContainsText(packageCards[2], "19.99 USD");
  await browser.close();
});

test(
  "Can purchase a product",
  async () => {
    const { browser, page } = await setupTest();
    const userId = `rc_billing_demo_test_${Date.now()}`;
    await changeUserId(page, userId);

    // Perform purchase
    const weeklyPackageCard = (await getPackageCards(page))[1];
    await weeklyPackageCard.click();
    await enterEmailAndContinue(page, userId);
    await waitMilliseconds(8000);
    await enterCreditCardDetailsAndContinue(page);

    await waitMilliseconds(10000);

    // Confirm success page has shown.
    await page.waitForSelector(".rcb-modal-success", { timeout: 10000 });

    await browser.close();
  },
  { timeout: 40000, retry: 2 },
);

async function setupTest(): Promise<{ browser: Browser; page: Page }> {
  const browser = await puppeteer.launch({
    headless: "new",
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1920,
    height: 1080,
  });
  await navigateToUrl(page);
  await page.waitForSelector(_CARD_CLASS, { timeout: 5000 });
  return { browser, page };
}

async function getPackageCards(page: Page): Promise<ElementHandle[]> {
  return await page.$$(_CARD_CLASS);
}

async function changeUserId(page: Page, userId: string): Promise<void> {
  await page.evaluate((userId) => {
    localStorage.setItem("appUserId", userId);
  }, userId);
  await navigateToUrl(page);
  await waitMilliseconds(3000);
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
  await typeTextInOptionalFrameSelector(
    page,
    formFrame!,
    'input[name="postalCode"',
    "42424",
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

async function navigateToUrl(page: Page): Promise<void> {
  const url =
    (import.meta.env.VITE_RC_BILLING_DEMO_URL as string | undefined) ??
    _LOCAL_URL;
  await page.goto(url);
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
): Promise<void> {
  const inputText = await frame.$(selector);
  expect(inputText).not.toBeNull();
  await inputText?.focus();
  await page.keyboard.type(text, { delay: 100 });
}

async function typeTextInOptionalFrameSelector(
  page: Page,
  frame: Frame,
  selector: string,
  text: string,
): Promise<void> {
  const inputText = await frame.$(selector);
  if (inputText != null) {
    await inputText.focus();
    await page.keyboard.type(text, { delay: 100 });
  }
}

async function waitMilliseconds(milliseconds: number) {
  await new Promise((r) => setTimeout(r, milliseconds));
}
