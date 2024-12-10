import type { PurchaseResponse } from "src/networking/responses/purchase-response";

const restrictedSecretKey = import.meta.env.VITE_STORYBOOK_RESTRICTED_SECRET;
const publishableApiKey = import.meta.env.VITE_STORYBOOK_PUBLISHABLE_API_KEY;
const accountId = import.meta.env.VITE_STORYBOOK_ACCOUNT_ID;

const checkSetupIntent = async (storedIntent?: string) => {
  if (storedIntent) {
    const setupIntent = JSON.parse(storedIntent);
    const response = await fetch(
      `https://api.stripe.com/v1/setup_intents/${setupIntent["id"]}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${restrictedSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    const data = await response.json();
    if (data["status"] !== "succeeded" && data["last_setup_error"] === null) {
      return true;
    }
  }
  return false;
};

const createSetupIntent = async () => {
  const storedIntent = localStorage.getItem("storybook_setup_intent");
  if (storedIntent && (await checkSetupIntent(storedIntent))) {
    return JSON.parse(storedIntent);
  }

  const response = await fetch("https://api.stripe.com/v1/setup_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${restrictedSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: [
      "payment_method_types[]=card",
      "metadata[environment]=storybook",
      "metadata[rc_billing_generated]=true",
    ].join("&"),
  });
  const data = await response.json();
  localStorage.setItem("storybook_setup_intent", JSON.stringify(data));
  return data;
};

const checkPaymentIntent = async (storedIntent?: string) => {
  if (storedIntent) {
    const paymentIntent = JSON.parse(storedIntent);
    const response = await fetch(
      `https://api.stripe.com/v1/payment_intents/${paymentIntent["id"]}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${restrictedSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    const data = await response.json();
    if (data["status"] !== "succeeded" && data["last_payment_error"] === null) {
      return true;
    }
  }
  return false;
};

const createPaymentIntent = async () => {
  const storedIntent = localStorage.getItem("storybook_payment_intent");
  if (storedIntent && (await checkPaymentIntent(storedIntent))) {
    return JSON.parse(storedIntent);
  }

  const response = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${restrictedSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: [
      "amount=1000",
      "currency=usd",
      "setup_future_usage=off_session",
      "payment_method_types[]=card",
      "metadata[environment]=storybook",
      "metadata[rc_billing_generated]=true",
    ].join("&"),
  });
  const data = await response.json();
  localStorage.setItem("storybook_payment_intent", JSON.stringify(data));
  return data;
};

export enum SetupMode {
  TrialSubscription,
  PaidProduct,
}

export const buildPurchaseResponse = async (
  setupMode: SetupMode = SetupMode.TrialSubscription,
): Promise<PurchaseResponse> => {
  if (!restrictedSecretKey || !publishableApiKey || !accountId) {
    throw new Error(
      "Missing storybook setup environment variables. Check README.md for more information.",
    );
  }

  let clientSecret = "";
  if (setupMode === SetupMode.TrialSubscription) {
    const setupIntent = await createSetupIntent();
    clientSecret = setupIntent["client_secret"];
  } else {
    const paymentIntent = await createPaymentIntent();
    clientSecret = paymentIntent["client_secret"];
  }

  const purchaseResponse: PurchaseResponse = {
    next_action: "collect_payment_info",
    operation_session_id: "rcbopsess_test_test_test",
    data: {
      client_secret: clientSecret,
      publishable_api_key: publishableApiKey,
      stripe_account_id: accountId,
    },
  };

  return purchaseResponse;
};
