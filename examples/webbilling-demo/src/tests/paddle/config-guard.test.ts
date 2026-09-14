import { expect } from "@playwright/test";
import { PADDLE_TEST_API_KEY } from "../helpers/fixtures";
import { integrationTest } from "../helpers/integration-test";
import { skipPaddleTestsIfDisabled } from "../helpers/test-helpers";

integrationTest.describe("Paddle E2E configuration", () => {
  skipPaddleTestsIfDisabled(integrationTest);

  // A missing key skips the whole Paddle suite while CI still reports green,
  // so fail loudly here instead and surface the dropped secret.
  integrationTest(
    "Paddle E2E key is set on CI so the suite cannot silently skip",
    () => {
      integrationTest.skip(
        !process.env.CI,
        "Only enforced on CI, where the secret must be configured.",
      );
      expect(
        PADDLE_TEST_API_KEY,
        "VITE_RC_PADDLE_E2E_API_KEY is not set; the Paddle E2E suite would skip. Configure the secret in CircleCI.",
      ).toBeTruthy();
    },
  );
});
