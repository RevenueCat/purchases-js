import type { BrandingInfoResponse } from "../networking/responses/branding-response";
import { eventsTrackerContextKey } from "../ui/constants";
import {
  type Package,
  PackageType,
  type Product,
  ProductType,
  type SubscriptionOption,
} from "../entities/offerings";
import { PeriodUnit } from "../helpers/duration-helper";
import { PurchaseFlowError } from "../helpers/purchase-operation-helper";
import {
  type CheckoutStartResponse,
  StripeElementsMode,
  StripeElementsSetupFutureUsage,
} from "../networking/responses/checkout-start-response";
import type { BrandingAppearance } from "../entities/branding";
import type { CheckoutCalculateTaxesResponse } from "src/networking/responses/checkout-calculate-taxes-response";

export const subscriptionOption: SubscriptionOption = {
  id: "option_id_1",
  priceId: "price_1",
  base: {
    periodDuration: "P1M",
    period: {
      unit: PeriodUnit.Month,
      number: 1,
    },
    price: {
      amount: 999,
      amountMicros: 999,
      currency: "USD",
      formattedPrice: "9.99$",
    },
    cycleCount: 0,
  },
  trial: null,
};

export const subscriptionOptionWithTrial: SubscriptionOption = {
  id: "option_id_1",
  priceId: "price_1",
  base: {
    periodDuration: "P1Y",
    period: {
      unit: PeriodUnit.Year,
      number: 1,
    },
    price: {
      amount: 999,
      amountMicros: 9990000,
      currency: "USD",
      formattedPrice: "9.99$",
    },
    cycleCount: 0,
  },
  trial: {
    periodDuration: "P1M",
    period: {
      number: 1,
      unit: PeriodUnit.Month,
    },
    cycleCount: 1,
    price: null,
  },
};

export const product: Product = {
  identifier: "some_product_123",
  displayName: "Fantastic Cat",
  description:
    "This is a long description of the product which is long. " +
    "It is long indeed so that it spans multiple lines.",
  title: "Fantastic Cat Pro",
  productType: ProductType.Subscription,
  currentPrice: {
    amount: 999,
    amountMicros: 999,
    currency: "USD",
    formattedPrice: "9.99$",
  },
  normalPeriodDuration: "P1M",
  presentedOfferingIdentifier: "some_offering_identifier",
  presentedOfferingContext: {
    offeringIdentifier: "offering_1",
    targetingContext: null,
    placementIdentifier: null,
  },
  defaultPurchaseOption: subscriptionOption,

  defaultNonSubscriptionOption: null,
  defaultSubscriptionOption: subscriptionOption,

  subscriptionOptions: {
    option_id_1: subscriptionOption,
  },
};

export const rcPackage: Package = {
  identifier: "testPackage",
  packageType: PackageType.Monthly,
  rcBillingProduct: product,
  webBillingProduct: product,
};

export const colorfulBrandingAppearance: BrandingAppearance = {
  shapes: "rounded",
  color_form_bg: "#313131", // dark grey
  color_error: "#E79462", // orange
  color_product_info_bg: "#ffffff", // white
  color_buttons_primary: "#AC7DE3", // purple
  color_accent: "#99BB37", // green
  color_page_bg: "#ffffff", // white
  font: "sans-serif",
  show_product_description: true,
};

export const brandingInfo: BrandingInfoResponse = {
  id: "branding_info_id",
  support_email: "support@somefantasticcat.com",
  app_name: "Some Fantastic Cat, Inc.",
  app_icon: "1005820_1715624566.png",
  app_icon_webp: "1005820_1715624566.webp",
  appearance: null,
  gateway_tax_collection_enabled: true,
};

export const purchaseFlowError = new PurchaseFlowError(1);

export const purchaseResponse = {
  next_action: "collect_payment_info",
  data: {
    client_secret: "test_client_secret",
    publishable_api_key: "test_publishable_api_key",
    stripe_account_id: "test_stripe_account_id",
  },
};

export const stripeElementsConfiguration = {
  mode: StripeElementsMode.Payment,
  payment_method_types: ["card"],
  setup_future_usage: StripeElementsSetupFutureUsage.OffSession,
  amount: 9.99,
  currency: "EUR",
};

export const checkoutStartResponse: CheckoutStartResponse = {
  operation_session_id: "operation-session-id",
  gateway_params: {
    stripe_account_id: "test_stripe_account_id",
    publishable_api_key: "test_publishable_api_key",
    elements_configuration: stripeElementsConfiguration,
  },
};

export const checkoutCalculateTaxesResponse: CheckoutCalculateTaxesResponse = {
  operation_session_id: "operation-session-id",
};

export const defaultContext = {
  [eventsTrackerContextKey]: {
    trackExternalEvent: () => {},
    trackSDKEvent: () => {},
    updateUser: () => Promise.resolve(),
    dispose: () => {},
  },
};
