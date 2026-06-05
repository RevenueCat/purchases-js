import { expect } from "@playwright/test";
import { STRIPE_CHECKOUT_TEST_API_KEY } from "../helpers/fixtures";
import { integrationTest } from "../helpers/integration-test";
import { skipStripeTestsIfDisabled } from "../helpers/test-helpers";

integrationTest.describe("Stripe Checkout E2E configuration", () => {
  skipStripeTestsIfDisabled(integrationTest);

  // A missing key makes the whole Stripe Checkout suite (including the
  // cross-version matrix) skip while CI still reports green - hiding the gap.
  // Fail loudly on CI instead so a dropped secret cannot pass unnoticed.
  integrationTest(
    "Stripe Checkout E2E key is set on CI so the suite cannot silently skip",
    () => {
      integrationTest.skip(
        !process.env.CI,
        "Only enforced on CI, where the secret must be configured.",
      );
      expect(
        STRIPE_CHECKOUT_TEST_API_KEY,
        "E2E_RC_STRIPE_CHECKOUT_E2E_API_KEY is not set; the Stripe Checkout E2E suite would skip. Configure the secret in CircleCI.",
      ).toBeTruthy();
    },
  );
});
