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
  app_icon: "",
  app_icon_webp: "",
  appearance: {},
};

export const purchaseFlowError = new PurchaseFlowError(1);
