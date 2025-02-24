import type {
  Appearance,
  StripeElementLocale,
  StripeElements,
  StripeError,
} from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import type { BrandingInfoResponse } from "../networking/responses/branding-response";
import type { CheckoutStartResponse } from "../networking/responses/checkout-start-response";
import { Theme } from "../ui/theme/theme";

export class StripeService {
  private static FORM_VALIDATED_CARD_ERROR_CODES = [
    "card_declined",
    "expired_card",
    "incorrect_cvc",
    "incorrect_number",
  ];

  static async initializeStripe(
    paymentInfoCollectionMetadata: CheckoutStartResponse,
    brandingInfo: BrandingInfoResponse | null,
    localeToUse: StripeElementLocale,
    stripeVariables: Appearance["variables"],
    viewport: "mobile" | "desktop",
  ) {
    const gatewayParams = paymentInfoCollectionMetadata.gateway_params;
    const stripePk = gatewayParams.publishable_api_key;
    const stripeAcctId = gatewayParams.stripe_account_id;
    const elementsConfiguration = gatewayParams.elements_configuration;

    if (!stripePk || !stripeAcctId || !elementsConfiguration) {
      throw new Error("Stripe configuration is missing");
    }

    const stripe = await loadStripe(stripePk, {
      stripeAccount: stripeAcctId,
    });

    if (!stripe) {
      throw new Error("Stripe client not found");
    }

    const theme = new Theme(brandingInfo?.appearance);
    const customShape = theme.shape;
    const customColors = theme.formColors;
    const textStyles = theme.textStyles;

    const elements = stripe.elements({
      loader: "always",
      locale: localeToUse,
      mode: elementsConfiguration.mode,
      paymentMethodTypes: elementsConfiguration.payment_method_types,
      setupFutureUsage: elementsConfiguration.setup_future_usage,
      amount: elementsConfiguration.amount,
      currency: elementsConfiguration.currency,
      appearance: {
        theme: "stripe",
        labels: "floating",
        variables: {
          borderRadius: customShape["input-border-radius"],
          fontLineHeight: "10px",
          focusBoxShadow: "none",
          colorDanger: customColors["error"],
          colorTextPlaceholder: customColors["grey-text-light"],
          colorText: customColors["grey-text-dark"],
          colorTextSecondary: customColors["grey-text-light"],
          ...stripeVariables,
        },
        rules: {
          ".Input": {
            boxShadow: "none",
            paddingTop: "6px",
            paddingBottom: "6px",
            border: `1px solid ${customColors["grey-ui-dark"]}`,
            backgroundColor: customColors["input-background"],
            color: customColors["grey-text-dark"],
          },
          ".Input:focus": {
            border: `1px solid ${customColors["focus"]}`,
            outline: "none",
          },
          ".Label": {
            fontWeight: textStyles.body1[viewport].fontWeight,
            lineHeight: "22px",
            color: customColors["grey-text-dark"],
          },
          ".Label--floating": {
            opacity: "1",
            paddingBottom: "0px",
          },
          ".Label--focused": {},
          ".Input--invalid": {
            boxShadow: "none",
          },
          ".TermsText": {
            fontSize: textStyles.caption[viewport].fontSize,
            lineHeight: textStyles.caption[viewport].lineHeight,
          },
          ".Tab": {
            boxShadow: "none",
            backgroundColor: "transparent",
            color: customColors["grey-text-light"],
            border: `1px solid ${customColors["grey-ui-dark"]}`,
          },
          ".Tab:hover, .Tab:focus, .Tab--selected, .Tab--selected:hover, .Tab--selected:focus":
            {
              boxShadow: "none",
              color: customColors["grey-text-dark"],
            },
          ".Tab:focus, .Tab--selected, .Tab--selected:hover, .Tab--selected:focus":
            {
              border: `1px solid ${customColors["focus"]}`,
            },
          ".TabIcon": {
            fill: customColors["grey-text-light"],
          },
          ".TabIcon--selected": {
            fill: customColors["grey-text-dark"],
          },
          ".Block": {
            boxShadow: "none",
            backgroundColor: "transparent",
            border: `1px solid ${customColors["grey-ui-dark"]}`,
          },
        },
      },
    });

    return { stripe, elements };
  }

  static isStripeHandledCardError(error: StripeError) {
    if (
      error.type === "card_error" &&
      error.code &&
      this.FORM_VALIDATED_CARD_ERROR_CODES.includes(error.code)
    ) {
      return true;
    }

    return false;
  }

  static createPaymentElement(
    elements: StripeElements,
    appName?: string | null,
  ) {
    return elements.create("payment", {
      business: appName ? { name: appName } : undefined,
      layout: {
        type: "tabs",
      },
    });
  }
}
