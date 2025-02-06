import {
  StripeElementsMode,
  StripeElementsSetupFutureUsage,
  type CheckoutStartResponse,
} from "../../networking/responses/checkout-start-response";

const publishableApiKey = import.meta.env.VITE_STORYBOOK_PUBLISHABLE_API_KEY;
const accountId = import.meta.env.VITE_STORYBOOK_ACCOUNT_ID;

export const buildCheckoutStartResponse = (): CheckoutStartResponse => {
  if (!publishableApiKey || !accountId) {
    throw new Error(
      "Missing storybook setup environment variables. Check README.md for more information.",
    );
  }

  if (!publishableApiKey.includes("test")) {
    throw new Error(
      "The publishable API key should be a test key. Check README.md for more information.",
    );
  }

  const checkoutStartResponse: CheckoutStartResponse = {
    operation_session_id: "rcbopsess_test_test_test",
    data: {
      publishable_api_key: publishableApiKey,
      stripe_account_id: accountId,
      elements_configuration: {
        mode: StripeElementsMode.Payment,
        payment_method_types: ["card"],
        setup_future_usage: StripeElementsSetupFutureUsage.OffSession,
        amount: 1000,
        currency: "usd",
      },
    },
  };

  return checkoutStartResponse;
};
