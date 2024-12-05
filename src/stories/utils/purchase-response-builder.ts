import { PurchaseResponse } from "src/networking/responses/purchase-response";
import { purchaseResponse } from "../fixtures";

const secret = import.meta.env.VITE_STORYBOOK_RESTRICTED_SECRET;

const checkSetupIntent = async (storedIntent?: string) => {
  if (storedIntent) {
    const setupIntent = JSON.parse(storedIntent);
    const response = await fetch(
      `https://api.stripe.com/v1/setup_intents/${setupIntent["id"]}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secret}`,
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
      Authorization: `Bearer ${secret}`,
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

export const buildPurchaseResponse = async (): Promise<PurchaseResponse> => {
  let result = purchaseResponse;
  if (!secret) {
    return result;
  }

  const setupIntent = await createSetupIntent();
  return {
    ...result,
    data: {
      ...result.data,
      client_secret: setupIntent["client_secret"],
    },
  };
};
