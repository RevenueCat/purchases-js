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
import {
  StripeElementsMode,
  StripeElementsSetupFutureUsage,
} from "../networking/responses/stripe-elements";
import type { PriceBreakdown } from "src/ui/ui-types";
import type { CheckoutCompleteResponse } from "../networking/responses/checkout-complete-response";

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
  pricePerWeek: {
    amount: 227.64,
    amountMicros: 2276418,
    currency: "USD",
    formattedPrice: "2.28$",
  },
  pricePerMonth: {
    amount: 990,
    amountMicros: 9900000,
    currency: "USD",
    formattedPrice: "9.90$",
  },
  pricePerYear: {
    amount: 11879.31,
    amountMicros: 118793101,
    currency: "USD",
    formattedPrice: "118.79$",
  },
};

export const subscriptionOption: SubscriptionOption = {
  id: "option_id_1",
  priceId: "price_1",
  base: subscriptionOptionBasePrice,
  trial: null,
  introPrice: null,
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
    pricePerWeek: null,
    pricePerMonth: null,
    pricePerYear: null,
  },
  introPrice: null,
};

// Intro price - Paid upfront (6 months for $19.99, one time)
export const subscriptionOptionWithIntroPricePaidUpfront: SubscriptionOption = {
  id: "option_id_intro_upfront",
  priceId: "price_intro_upfront",
  base: subscriptionOption.base,
  trial: null,
  introPrice: {
    periodDuration: "P6M",
    period: {
      number: 6,
      unit: PeriodUnit.Month,
    },
    cycleCount: 1, // Paid upfront - one payment
    price: {
      amount: 1999,
      amountMicros: 19990000,
      currency: "USD",
      formattedPrice: "$19.99",
    },
    pricePerWeek: {
      amount: 767,
      amountMicros: 7670000,
      currency: "USD",
      formattedPrice: "$7.67",
    },
    pricePerMonth: {
      amount: 333,
      amountMicros: 3330000,
      currency: "USD",
      formattedPrice: "$3.33",
    },
    pricePerYear: {
      amount: 3998,
      amountMicros: 39980000,
      currency: "USD",
      formattedPrice: "$39.98",
    },
  },
};

// Intro price - Recurring (3 months for $4.99 each)
export const subscriptionOptionWithIntroPriceRecurring: SubscriptionOption = {
  id: "option_id_intro_recurring",
  priceId: "price_intro_recurring",
  base: subscriptionOption.base,
  trial: null,
  introPrice: {
    periodDuration: "P1M",
    period: {
      number: 1,
      unit: PeriodUnit.Month,
    },
    cycleCount: 3, // Recurring - 3 payments
    price: {
      amount: 499,
      amountMicros: 4990000,
      currency: "USD",
      formattedPrice: "$4.99",
    },
    pricePerWeek: {
      amount: 115,
      amountMicros: 1150000,
      currency: "USD",
      formattedPrice: "$1.15",
    },
    pricePerMonth: {
      amount: 499,
      amountMicros: 4990000,
      currency: "USD",
      formattedPrice: "$4.99",
    },
    pricePerYear: {
      amount: 5988,
      amountMicros: 59880000,
      currency: "USD",
      formattedPrice: "$59.88",
    },
  },
};

// Trial + Intro price - Paid upfront
export const subscriptionOptionWithTrialAndIntroPricePaidUpfront: SubscriptionOption =
  {
    id: "option_id_trial_intro_upfront",
    priceId: "price_trial_intro_upfront",
    base: subscriptionOption.base,
    trial: {
      periodDuration: "P1W",
      period: {
        number: 1,
        unit: PeriodUnit.Week,
      },
      cycleCount: 1,
      price: null,
      pricePerWeek: null,
      pricePerMonth: null,
      pricePerYear: null,
    },
    introPrice: subscriptionOptionWithIntroPricePaidUpfront.introPrice,
  };

// Trial + Intro price - Recurring
export const subscriptionOptionWithTrialAndIntroPriceRecurring: SubscriptionOption =
  {
    id: "option_id_trial_intro_recurring",
    priceId: "price_trial_intro_recurring",
    base: subscriptionOption.base,
    trial: {
      periodDuration: "P1W",
      period: {
        number: 1,
        unit: PeriodUnit.Week,
      },
      cycleCount: 1,
      price: null,
      pricePerWeek: null,
      pricePerMonth: null,
      pricePerYear: null,
    },
    introPrice: subscriptionOptionWithIntroPriceRecurring.introPrice,
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
  price: {
    amount: 990,
    amountMicros: 9900000,
    currency: "USD",
    formattedPrice: "9.90$",
  },
  period: {
    number: 1,
    unit: PeriodUnit.Month,
  },
  freeTrialPhase: subscriptionOption.trial,
  introPricePhase: subscriptionOption.introPrice,
};

export const consumableProduct: Product = {
  ...structuredClone(product),
  productType: ProductType.Consumable,
  defaultPurchaseOption: nonSubscriptionOption,
  subscriptionOptions: {},
  defaultNonSubscriptionOption: nonSubscriptionOption,
  defaultSubscriptionOption: null,
  // Convenience accessors for non-subscription
  price: nonSubscriptionOption.basePrice,
  period: null,
  freeTrialPhase: null,
  introPricePhase: null,
};

export const nonConsumableProduct: Product = {
  ...structuredClone(product),
  productType: ProductType.NonConsumable,
  defaultPurchaseOption: nonSubscriptionOption,
  subscriptionOptions: {},
  defaultNonSubscriptionOption: nonSubscriptionOption,
  defaultSubscriptionOption: null,
  // Convenience accessors for non-subscription
  price: nonSubscriptionOption.basePrice,
  period: null,
  freeTrialPhase: null,
  introPricePhase: null,
};

export const trialProduct: Product = {
  ...structuredClone(product),
  defaultPurchaseOption: subscriptionOptionWithTrial,
  defaultSubscriptionOption: subscriptionOptionWithTrial,
  subscriptionOptions: {
    option_id_1: subscriptionOptionWithTrial,
  },
  // Convenience accessors for trial product
  freeTrialPhase: subscriptionOptionWithTrial.trial,
  introPricePhase: subscriptionOptionWithTrial.introPrice,
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
  app_wordmark: null,
  app_wordmark_webp: null,
  appearance: null,
  gateway_tax_collection_enabled: false,
  brand_font_config: null,
};

export const purchaseFlowErrors = {
  errorSettingUpPurchase: new PurchaseFlowError(0),
  errorChargingPayment: new PurchaseFlowError(1),
  unknownError: new PurchaseFlowError(2),
  networkError: new PurchaseFlowError(3),
  missingEmailError: new PurchaseFlowError(4),
  alreadyPurchasedError: new PurchaseFlowError(5),
  stripeNotActive: new PurchaseFlowError(6),
  stripeInvalidTaxOriginAddress: new PurchaseFlowError(7),
  stripeMissingRequiredPermission: new PurchaseFlowError(8),
};

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
  management_url: "https://manage.revenuecat.com/test_test_test",
};

export const checkoutCalculateTaxResponse: CheckoutCalculateTaxResponse = {
  operation_session_id: "operation-session-id",
  currency: "USD",
  total_amount_in_micros: 9990000 + 400000,
  total_excluding_tax_in_micros: 9990000,
  tax_amount_in_micros: 400000,
  tax_inclusive: false,
  tax_breakdown: [
    {
      tax_amount_in_micros: 400000,
      display_name: "Sales Tax - New York (4%)",
    },
  ],
  gateway_params: {
    elements_configuration: {
      ...stripeElementsConfiguration,
      amount: 999 + 40,
    },
  },
};

export const checkoutCompleteResponse: CheckoutCompleteResponse = {
  operation_session_id: "operation-session-id",
  gateway_params: {},
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
    app_wordmark: null,
    app_wordmark_webp: null,
    appearance: {
      shapes: "rectangle",
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
    brand_font_config: null,
  },
  Igify: {
    id: "app7e12a2a4b3",
    support_email: "devservices@revenuecat.com",
    app_icon: "1005820_1739283698.png",
    app_icon_webp: "1005820_1739283698.webp",
    app_wordmark: null,
    app_wordmark_webp: null,
    app_name: "Igify Pro LTD",
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
    brand_font_config: null,
  },
  Dipsea: {
    id: "appd458f1e3a2",
    support_email: "devservices@revenuecat.com",
    app_icon: "1005820_1730470500.png",
    app_icon_webp: "1005820_1730470500.webp",
    app_wordmark: "Dipsea_Wordmark_White.png",
    app_wordmark_webp: "Dipsea_Wordmark_White.webp",
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
    brand_font_config: {
      font_url: "QueensCondensed-Light.ttf",
      mobile: { font_weight: 300, font_size: "28px" },
      desktop: { font_weight: 300, font_size: "36px" },
    },
  },
};

export const priceBreakdownTaxDisabled: PriceBreakdown = {
  currency: "USD",
  totalAmountInMicros: 9900000,
  totalExcludingTaxInMicros: 9900000,
  taxCalculationStatus: "unavailable",
  taxAmountInMicros: 0,
  taxBreakdown: null,
};

export const priceBreakdownTaxDisabledIntroPriceRecurring: PriceBreakdown = {
  currency: "USD",
  totalAmountInMicros: 3490000,
  totalExcludingTaxInMicros: 3490000,
  taxCalculationStatus: "unavailable",
  taxAmountInMicros: 0,
  taxBreakdown: null,
};

export const priceBreakdownTaxDisabledIntroPricePaidUpfront: PriceBreakdown = {
  currency: "USD",
  totalAmountInMicros: 19990000,
  totalExcludingTaxInMicros: 19990000,
  taxCalculationStatus: "unavailable",
  taxAmountInMicros: 0,
  taxBreakdown: null,
};

export const priceBreakdownNotCollectingTax: PriceBreakdown = {
  currency: "USD",
  totalAmountInMicros: 9900000,
  totalExcludingTaxInMicros: 9900000,
  taxCalculationStatus: "calculated",
  taxAmountInMicros: 0,
  taxBreakdown: [],
};

export const priceBreakdownTaxInclusive: PriceBreakdown = {
  ...priceBreakdownTaxDisabled,
  totalAmountInMicros: 1718000 + 8180000,
  totalExcludingTaxInMicros: 8180000,
  taxAmountInMicros: 1718000,
  taxCalculationStatus: "calculated",
  taxBreakdown: [
    {
      tax_amount_in_micros: 1718000,
      display_name: "VAT - Spain (21%)",
    },
  ],
};

export const priceBreakdownTaxInclusiveWithIntroPricePaidUpfront: PriceBreakdown =
  {
    ...priceBreakdownTaxInclusive,
    totalAmountInMicros: 19990000,
    totalExcludingTaxInMicros: 15792100,
    taxAmountInMicros: 4197900,
    taxCalculationStatus: "calculated",
    taxBreakdown: [
      {
        tax_amount_in_micros: 4197900,
        display_name: "VAT - Spain (21%)",
      },
    ],
  };

export const priceBreakdownTaxInclusiveWithIntroPriceRecurring: PriceBreakdown =
  {
    ...priceBreakdownTaxInclusive,
    totalAmountInMicros: 3490000,
    totalExcludingTaxInMicros: 2757100,
    taxAmountInMicros: 732900,
    taxCalculationStatus: "calculated",
    taxBreakdown: [
      {
        tax_amount_in_micros: 732900,
        display_name: "VAT - Spain (21%)",
      },
    ],
  };

export const priceBreakdownTaxExclusive: PriceBreakdown = {
  ...priceBreakdownTaxDisabled,
  totalAmountInMicros: 693000 + 9900000,
  totalExcludingTaxInMicros: 9900000,
  taxAmountInMicros: 693000,
  taxCalculationStatus: "calculated",
  taxBreakdown: [
    {
      tax_amount_in_micros: 693000,
      display_name: "Tax Rate - NY (7%)",
    },
  ],
};

export const priceBreakdownTaxExclusiveWithIntroPricePaidUpfront: PriceBreakdown =
  {
    ...priceBreakdownTaxExclusive,
    totalAmountInMicros: 19990000 + 1399300,
    totalExcludingTaxInMicros: 19990000,
    taxAmountInMicros: 1399300,
    taxCalculationStatus: "calculated",
    taxBreakdown: [
      {
        tax_amount_in_micros: 1399300,
        display_name: "Tax Rate - NY (7%)",
      },
    ],
  };

export const priceBreakdownTaxExclusiveWithIntroPriceRecurring: PriceBreakdown =
  {
    ...priceBreakdownTaxExclusive,
    totalAmountInMicros: 3490000 + 244300,
    totalExcludingTaxInMicros: 3490000,
    taxAmountInMicros: 244300,
    taxCalculationStatus: "calculated",
    taxBreakdown: [
      {
        tax_amount_in_micros: 244300,
        display_name: "Tax Rate - NY (7%)",
      },
    ],
  };

export const priceBreakdownTaxLoading: PriceBreakdown = {
  ...priceBreakdownTaxExclusive,
  totalAmountInMicros: 9900000,
  taxCalculationStatus: "loading",
};

export const priceBreakdownTaxPending: PriceBreakdown = {
  ...priceBreakdownTaxExclusive,
  totalAmountInMicros: 9900000,
  taxCalculationStatus: "pending",
};

export const priceBreakdownTaxExclusiveWithMultipleTaxItems: PriceBreakdown = {
  ...priceBreakdownTaxDisabled,
  totalAmountInMicros: 9900000 + 495000 + 987525,
  totalExcludingTaxInMicros: 9900000,
  taxAmountInMicros: 495000 + 987525,
  taxCalculationStatus: "calculated",
  taxBreakdown: [
    {
      tax_amount_in_micros: 495000,
      display_name: "GST - Canada (5%)",
    },
    {
      tax_amount_in_micros: 987525,
      display_name: "QST - Ontario (9.975%)",
    },
  ],
};
