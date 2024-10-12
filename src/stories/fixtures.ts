import {
  Product,
  ProductType,
  SubscriptionOption,
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

export const product: Product = {
  identifier: "some_product_123",
  displayName: "Some Product 123",
  description: "a very nice product",

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

export const brandingInfo = {
  seller_company_support_email: "support@somefantasticcat.com",
  seller_company_name: "Some Fantastic Cat, Inc.",
  app_icon: "1005820_1715624566.png",
  app_icon_webp: "1005820_1715624566.webp",
  appearance: undefined,
};

export const purchaseResponse = {
  data: {
    client_secret: import.meta.env.VITE_STORYBOOK_SETUP_INTENT as string,
    publishable_api_key: import.meta.env
      .VITE_STORYBOOK_PUBLISHABLE_API_KEY as string,
    stripe_account_id: import.meta.env.VITE_STORYBOOK_ACCOUNT_ID as string,
  },
  next_action: "collect_payment_info",
  operation_session_id: "rcbopsess_test_test_test",
};

export const purchaseFlowError = new PurchaseFlowError(1);

export const colorfulBrandingAppearance = {
  shapes: "rounded",
  color_form_bg: "#404040",
  color_error: "#E79462",
  color_product_info_bg: "#ffffff",
  color_buttons_primary: "#AC7DE3",
  color_accent: "#99BB37",
  show_product_description: true,
};
