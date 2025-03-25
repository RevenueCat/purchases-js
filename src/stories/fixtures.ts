import type { BrandingInfoResponse } from "../networking/responses/branding-response";
import { eventsTrackerContextKey } from "../ui/constants";
import {
  type NonSubscriptionOption,
  type Package,
  PackageType,
  type Product,
  ProductType,
  type SubscriptionOption,
} from "../entities/offerings";
import { PeriodUnit } from "../helpers/duration-helper";
import { PurchaseFlowError } from "../helpers/purchase-operation-helper";
import { type CheckoutStartResponse } from "../networking/responses/checkout-start-response";
import type { BrandingAppearance } from "../entities/branding";
import type { CheckoutCalculateTaxResponse } from "../networking/responses/checkout-calculate-tax-response";
import { StripeElementsSetupFutureUsage } from "../networking/responses/stripe-elements";
import { StripeElementsMode } from "../networking/responses/stripe-elements";
import type { PriceBreakdown } from "src/ui/ui-types";

const subscriptionOptionBasePrice = {
  periodDuration: "P1M",
  period: {
    unit: PeriodUnit.Month,
    number: 1,
  },
  price: {
    amount: 990,
    amountMicros: 9900000,
    currency: "USD",
    formattedPrice: "9.90$",
  },
  cycleCount: 0,
};

export const subscriptionOption: SubscriptionOption = {
  id: "option_id_1",
  priceId: "price_1",
  base: subscriptionOptionBasePrice,
  trial: null,
};

export const subscriptionOptionWithTrial: SubscriptionOption = {
  id: "option_id_1",
  priceId: "price_1",
  base: subscriptionOption.base,
  trial: {
    periodDuration: "P1W",
    period: {
      number: 1,
      unit: PeriodUnit.Week,
    },
    cycleCount: 1,
    price: null,
  },
};

export const nonSubscriptionOption: NonSubscriptionOption = {
  id: "option_id_1",
  priceId: "price_1",
  basePrice: {
    amount: 1995,
    amountMicros: 19950000,
    currency: "USD",
    formattedPrice: "19.95$",
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
    amount: 990,
    amountMicros: 9900000,
    currency: "USD",
    formattedPrice: "9.90$",
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

export const consumableProduct: Product = {
  ...structuredClone(product),
  productType: ProductType.Consumable,
  defaultPurchaseOption: nonSubscriptionOption,
};

export const nonConsumableProduct: Product = {
  ...structuredClone(product),
  productType: ProductType.NonConsumable,
  defaultPurchaseOption: nonSubscriptionOption,
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
  gateway_tax_collection_enabled: false,
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
  amount: 999,
  currency: "usd",
};

const publishableApiKey = import.meta.env.VITE_STORYBOOK_PUBLISHABLE_API_KEY;
const accountId = import.meta.env.VITE_STORYBOOK_ACCOUNT_ID;

export const checkoutStartResponse: CheckoutStartResponse = {
  operation_session_id: "rcbopsess_test_test_test",
  gateway_params: {
    publishable_api_key: publishableApiKey,
    stripe_account_id: accountId,
    elements_configuration: stripeElementsConfiguration,
  },
};

export const checkoutCalculateTaxResponse: CheckoutCalculateTaxResponse = {
  operation_session_id: "operation-session-id",
  currency: "USD",
  tax_inclusive: false,
  total_amount_in_micros: 9900000 + 2450000,
  total_excluding_tax_in_micros: 9900000,
  tax_amount_in_micros: 2450000,
  pricing_phases: {
    base: {
      tax_breakdown: [],
    },
  },
  gateway_params: {
    elements_configuration: stripeElementsConfiguration,
  },
};

export const defaultContext = {
  [eventsTrackerContextKey]: {
    trackExternalEvent: () => {},
    trackSDKEvent: () => {},
    updateUser: () => Promise.resolve(),
    dispose: () => {},
  },
};

export const brandingInfos: Record<string, BrandingInfoResponse> = {
  None: brandingInfo,
  Fantastic: {
    id: "branding_info_id",
    support_email: "support@somefantasticcat.com",
    app_name: "Some Fantastic Cat, Inc.",
    app_icon: "1005820_1715624566.png",
    app_icon_webp: "1005820_1715624566.webp",
    appearance: {
      shapes: "rounded",
      color_form_bg: "#313131",
      color_error: "#E79462",
      color_product_info_bg: "#ffffff",
      color_buttons_primary: "#AC7DE3",
      color_accent: "#99BB37",
      color_page_bg: "#ffffff",
      font: "sans-serif",
      show_product_description: true,
    },
    gateway_tax_collection_enabled: false,
  },
  Igify: {
    id: "app7e12a2a4b3",
    support_email: "devservices@revenuecat.com",
    app_icon: "1005820_1739283698.png",
    app_icon_webp: "1005820_1739283698.webp",
    app_name: "Igify",
    appearance: {
      color_accent: "#969696",
      color_buttons_primary: "#000000",
      color_error: "#e61054",
      color_form_bg: "#FFFFFF",
      color_page_bg: "#114ab8",
      color_product_info_bg: "#114ab8",
      font: "default",
      shapes: "default",
      show_product_description: true,
    },
    gateway_tax_collection_enabled: false,
  },
  Dipsea: {
    id: "appd458f1e3a2",
    support_email: "devservices@revenuecat.com",
    app_icon: "1005820_1730470500.png",
    app_icon_webp: "1005820_1730470500.webp",
    app_name: "Dipsea",
    appearance: {
      color_accent: "#DF5539",
      color_buttons_primary: "#DF5539",
      color_error: "#F2545B",
      color_form_bg: "#372CBC",
      color_page_bg: "#26122F",
      color_product_info_bg: "#26122F",
      font: "default",
      shapes: "pill",
      show_product_description: false,
    },
    gateway_tax_collection_enabled: false,
  },
};

export const priceBreakdownTaxDisabled: PriceBreakdown = {
  currency: "USD",
  totalAmountInMicros: 9900000,
  totalExcludingTaxInMicros: 9900000,
  taxCollectionEnabled: false,
  status: "calculated",
  taxAmountInMicros: 0,
  pendingReason: null,
  taxBreakdown: null,
};

export const priceBreakdownTaxInclusive: PriceBreakdown = {
  ...priceBreakdownTaxDisabled,
  totalAmountInMicros: 1718000 + 8180000,
  totalExcludingTaxInMicros: 8180000,
  taxAmountInMicros: 1718000,
  taxCollectionEnabled: true,
  status: "calculated",
  taxBreakdown: [
    {
      tax_type: "VAT",
      tax_amount_in_micros: 1718000,
      tax_rate_in_micros: 210000,
      country: "ES",
      state: null,
      taxable_amount_in_micros: 8180000,
      display_name: "VAT - Spain (21%)",
    },
  ],
};

export const priceBreakdownTaxExclusive: PriceBreakdown = {
  ...priceBreakdownTaxDisabled,
  totalAmountInMicros: 693000 + 9900000,
  totalExcludingTaxInMicros: 9900000,
  taxAmountInMicros: 693000,
  taxCollectionEnabled: true,
  status: "calculated",
  taxBreakdown: [
    {
      tax_type: "tax_rate",
      tax_amount_in_micros: 693000,
      tax_rate_in_micros: 70000,
      country: "USA",
      state: "NY",
      taxable_amount_in_micros: 9900000,
      display_name: "Tax Rate - NY (7%)",
    },
  ],
};

export const priceBreakdownTaxLoading: PriceBreakdown = {
  ...priceBreakdownTaxExclusive,
  totalAmountInMicros: 9900000,
  status: "loading",
};

export const priceBreakdownTaxPending: PriceBreakdown = {
  ...priceBreakdownTaxExclusive,
  totalAmountInMicros: 9900000,
  status: "pending",
  pendingReason: null,
};

export const priceBreakdownTaxExclusiveWithMultipleTaxItems: PriceBreakdown = {
  ...priceBreakdownTaxDisabled,
  totalAmountInMicros: 9900000 + 495000 + 987525,
  totalExcludingTaxInMicros: 9900000,
  taxAmountInMicros: 495000 + 987525,
  taxCollectionEnabled: true,
  status: "calculated",
  taxBreakdown: [
    {
      tax_type: "GST",
      tax_amount_in_micros: 495000,
      tax_rate_in_micros: 50000,
      country: "CA",
      state: null,
      taxable_amount_in_micros: 9900000,
      display_name: "GST - Canada (5%)",
    },
    {
      tax_type: "QST",
      tax_amount_in_micros: 987525,
      tax_rate_in_micros: 99750,
      country: "CA",
      state: "ON",
      taxable_amount_in_micros: 9900000,
      display_name: "QST - Ontario (9.975%)",
    },
  ],
};
