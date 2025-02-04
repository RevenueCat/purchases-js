import { eventsTrackerContextKey } from "../ui/constants";
import {
  type Product,
  ProductType,
  type SubscriptionOption,
} from "../entities/offerings";
import { PeriodUnit } from "../helpers/duration-helper";
import { PurchaseFlowError } from "../helpers/purchase-operation-helper";

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
    periodDuration: "P1M",
    period: {
      unit: PeriodUnit.Month,
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
    periodDuration: "P2W",
    period: {
      number: 2,
      unit: PeriodUnit.Week,
    },
    cycleCount: 1,
    price: null,
  },
};

export const product: Product = {
  identifier: "some_product_123",
  displayName: "Some Product 123",
  description:
    "This is a long description of the product which is long. " +
    "It is long indeed so that it spans multiple lines.",

  title: "Some Product 123",
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

export const rcPackage = {
  identifier: "testPackage",
  rcBillingProduct: product,
};

export const brandingInfo = {
  support_email: "support@somefantasticcat.com",
  app_name: "Some Fantastic Cat, Inc.",
  app_icon: "1005820_1715624566.png",
  app_icon_webp: "1005820_1715624566.webp",
  appearance: {},
};

export const purchaseFlowError = new PurchaseFlowError(1);

export const colorfulBrandingAppearance = {
  shapes: "rectangle",
  color_form_bg: "#313131",
  color_error: "#E79462",
  color_product_info_bg: "#ffffff",
  color_buttons_primary: "#AC7DE3",
  color_accent: "#99BB37",
};

export const purchaseResponse = {
  next_action: "collect_payment_info",
  data: {
    client_secret: "test_client_secret",
    publishable_api_key: "test_publishable_api_key",
    stripe_account_id: "test_stripe_account_id",
  },
};

export const defaultContext = {
  [eventsTrackerContextKey]: {
    trackExternalEvent: () => {},
    trackSDKEvent: () => {},
    updateUser: () => Promise.resolve(),
    generateCheckoutSessionId: () => {},
    dispose: () => {},
  },
};
