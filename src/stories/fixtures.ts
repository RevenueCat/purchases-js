import type { BrandingInfoResponse } from "../networking/responses/branding-response";
import { eventsTrackerContextKey } from "../ui/constants";
import type { Price, PricingPhase, DiscountPhase } from "../entities/offerings";
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
import type { WebBillingCheckoutStartResponse } from "../networking/responses/checkout-start-response";
import type { BrandingAppearance } from "../entities/branding";
import type { CheckoutCalculateTaxResponse } from "../networking/responses/checkout-calculate-tax-response";
import {
  StripeElementsMode,
  StripeElementsSetupFutureUsage,
} from "../networking/responses/stripe-elements";
import type { PriceBreakdown } from "../ui/ui-types";
import type { CheckoutCompleteResponse } from "../networking/responses/checkout-complete-response";
import { getPriceBreakdownTaxDisabled } from "./helpers/get-price-breakdown";
import { formatPrice } from "../helpers/price-labels";

const getPrice = (amount: number, currency = "USD"): Price => {
  const amountMicros = amount * 10000;
  const formattedPrice = formatPrice(amountMicros, currency);
  return { amount, amountMicros, currency, formattedPrice };
};

/**
 * Pricing phase
 */

const subscriptionOptionBasePrice: PricingPhase = {
  periodDuration: "P1M",
  period: {
    unit: PeriodUnit.Month,
    number: 1,
  },
  price: getPrice(990),
  cycleCount: 0,
  pricePerWeek: getPrice(228),
  pricePerMonth: getPrice(990),
  pricePerYear: getPrice(11879),
};

const trialPriceOneWeek: PricingPhase = {
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
};

const introPriceMonthly: PricingPhase = {
  periodDuration: "P1M",
  period: {
    number: 1,
    unit: PeriodUnit.Month,
  },
  cycleCount: 1,
  price: getPrice(349),
  pricePerWeek: getPrice(149),
  pricePerMonth: getPrice(349),
  pricePerYear: getPrice(5949),
};

const introPriceSingleWeek: PricingPhase = {
  ...introPriceMonthly,
  periodDuration: "P1W",
  period: {
    number: 1,
    unit: PeriodUnit.Week,
  },
  price: introPriceMonthly.pricePerWeek,
};

const introPriceMultipleWeeks: PricingPhase = {
  ...introPriceSingleWeek,
  period: {
    number: 2,
    unit: PeriodUnit.Week,
  },
};

const introPriceYearly: PricingPhase = {
  ...introPriceMonthly,
  periodDuration: "P1Y",
  period: {
    number: 1,
    unit: PeriodUnit.Year,
  },
  price: introPriceMonthly.pricePerYear,
};

// Intro price - Paid upfront (6 months for $19.99, one time)
const introPriceSixMonthsPaidUpfront: PricingPhase = {
  periodDuration: "P6M",
  period: {
    number: 6,
    unit: PeriodUnit.Month,
  },
  cycleCount: 1, // Paid upfront - one payment
  price: getPrice(1999),
  pricePerWeek: getPrice(73),
  pricePerMonth: getPrice(317),
  pricePerYear: getPrice(3853),
};

// The one_time timeWindow will always match the subscription's base price period duration
const discountOneTime: DiscountPhase = {
  periodDuration: "P1M",
  timeWindow: null,
  durationMode: "one_time",
  price: getPrice(895),
  name: "One-time Discount 20%",
  period: {
    number: 1,
    unit: PeriodUnit.Month,
  },
  cycleCount: 1,
};

const discountTimeWindow: DiscountPhase = {
  timeWindow: "P3M",
  periodDuration: "P3M",
  durationMode: "time_window",
  price: getPrice(799),
  name: "Holiday Sale 20%",
  // Calculated from the time window
  period: {
    number: 1,
    unit: PeriodUnit.Month,
  },
  cycleCount: 3,
};

const discountForever: DiscountPhase = {
  timeWindow: null,
  periodDuration: "P1M",
  durationMode: "forever",
  price: getPrice(688),
  name: "Forever Discount 30%",
  period: {
    number: 1,
    unit: PeriodUnit.Month,
  },
  cycleCount: 0,
};

/**
 * Non-subscription fixtures
 */

export const nonSubscriptionBasePricingPhase: PricingPhase = {
  periodDuration: null,
  period: null,
  cycleCount: 1,
  price: subscriptionOptionBasePrice.price!,
  pricePerWeek: null,
  pricePerMonth: null,
  pricePerYear: null,
};

const createNonSubscriptionOption = (
  fields: Partial<NonSubscriptionOption> = {},
): NonSubscriptionOption => {
  return {
    id: "nonsub_option_id_1",
    priceId: "nonsub_price_1",
    basePrice: subscriptionOptionBasePrice.price!,
    discount: null,
    ...fields,
  };
};

export const nonSubscriptionOption = createNonSubscriptionOption();

// Discount
export const nonSubscriptionOptionWithDiscount = createNonSubscriptionOption({
  id: "nonsub_option_id_discount",
  priceId: "nonsub_price_discount",
  discount: discountOneTime,
});

/**
 * Subscription fixtures
 */

const createSubscriptionOption = (
  fields: Partial<SubscriptionOption> = {},
): SubscriptionOption => {
  return {
    id: "option_id_1",
    priceId: "price_1",
    base: subscriptionOptionBasePrice,
    trial: null,
    discount: null,
    introPrice: null,
    ...fields,
  };
};

export const subscriptionOption = createSubscriptionOption();

// Trial
export const subscriptionOptionWithTrial = createSubscriptionOption({
  id: "option_id_trial",
  priceId: "price_trial",
  trial: trialPriceOneWeek,
});

// Intro price (Paid upfront)
export const subscriptionOptionWithIntroPricePaidUpfront =
  createSubscriptionOption({
    id: "option_id_intro_upfront",
    priceId: "price_intro_upfront",
    introPrice: introPriceSixMonthsPaidUpfront,
  });

// Intro price (Recurring)
export const subscriptionOptionWithIntroPriceRecurring =
  createSubscriptionOption({
    id: "option_id_intro_recurring",
    priceId: "price_intro_recurring",
    introPrice: { ...introPriceMonthly, cycleCount: 3 },
  });

// Trial + Intro price (Paid upfront)
export const subscriptionOptionWithTrialAndIntroPricePaidUpfront =
  createSubscriptionOption({
    id: "option_id_trial_intro_upfront",
    priceId: "price_trial_intro_upfront",
    introPrice: introPriceSixMonthsPaidUpfront,
    trial: trialPriceOneWeek,
  });

// Trial + Intro price (Recurring)
export const subscriptionOptionWithTrialAndIntroPriceRecurring =
  createSubscriptionOption({
    id: "option_id_trial_intro_recurring",
    priceId: "price_trial_intro_recurring",
    introPrice: { ...introPriceMonthly, cycleCount: 3 },
    trial: trialPriceOneWeek,
  });

// Intro price (Recurring) - Single week
export const subscriptionOptionWithSingleWeekIntroPriceRecurring =
  createSubscriptionOption({
    id: "option_id_single_week_recurring",
    priceId: "price_single_week_recurring",
    introPrice: introPriceSingleWeek,
  });

// Trial + Intro price (Recurring) - Single week
export const subscriptionOptionWithSingleWeekWithTrialAndIntroPriceRecurring =
  createSubscriptionOption({
    id: "option_id_single_week_with_trial_recurring",
    priceId: "price_single_week_recurring",
    introPrice: introPriceSingleWeek,
    trial: trialPriceOneWeek,
  });

// Intro price (Recurring) - Multiple weeks
export const subscriptionOptionWithMultipleWeeksIntroPriceRecurring =
  createSubscriptionOption({
    id: "option_id_multiple_weeks_recurring",
    priceId: "price_multiple_weeks_recurring",
    introPrice: introPriceMultipleWeeks,
  });

// Intro price (Recurring) - Single month
export const subscriptionOptionWithSingleMonthIntroPriceRecurring =
  createSubscriptionOption({
    id: "option_id_single_month_recurring",
    priceId: "price_single_month_recurring",
    introPrice: introPriceMonthly,
  });

// Intro price (Recurring) - Multiple months
export const subscriptionOptionWithMultipleMonthsIntroPriceRecurring =
  createSubscriptionOption({
    id: "option_id_multiple_months_recurring",
    priceId: "price_multiple_months_recurring",
    introPrice: {
      ...introPriceMonthly,
      period: {
        number: 2,
        unit: PeriodUnit.Month,
      },
    },
  });

// Intro price (Recurring) - Single year
export const subscriptionOptionWithSingleYearIntroPriceRecurring =
  createSubscriptionOption({
    id: "option_id_single_year_recurring",
    priceId: "price_single_year_recurring",
    introPrice: introPriceYearly,
  });

// Intro price (Recurring) - Multiple years
export const subscriptionOptionWithMultipleYearsIntroPriceRecurring =
  createSubscriptionOption({
    id: "option_id_multiple_years_recurring",
    priceId: "price_multiple_years_recurring",
    introPrice: {
      ...introPriceYearly,
      period: {
        number: 2,
        unit: PeriodUnit.Year,
      },
    },
  });

// Discount (One time)
export const subscriptionOptionWithDiscountOneTime = createSubscriptionOption({
  id: "option_id_discount_one_time",
  priceId: "price_discount_one_time",
  discount: discountOneTime,
});

// Discount (Time window)
export const subscriptionOptionWithDiscount = createSubscriptionOption({
  id: "option_id_discount_time_window",
  priceId: "price_discount_time_window",
  discount: discountTimeWindow,
});

// Discount (Time window) - 3 month window, weekly billing cycle
export const subscriptionOptionWithWeeklyBillingAndThreeMonthDiscount =
  createSubscriptionOption({
    id: "option_id_discount_time_window_weekly",
    priceId: "price_discount_time_window_weekly",
    base: {
      ...subscriptionOptionBasePrice,
      periodDuration: "P1W",
      period: {
        number: 1,
        unit: PeriodUnit.Week,
      },
    },
    discount: discountTimeWindow,
  });

// Discount (Forever)
export const subscriptionOptionWithDiscountForever = createSubscriptionOption({
  id: "option_id_discount_forever",
  priceId: "price_discount_forever",
  discount: discountForever,
});

/**
 * Product fixtures
 */

export const product: Product = {
  identifier: "some_product_123",
  displayName: "Fantastic Cat",
  description:
    "This is a long description of the product which is long. " +
    "It is long indeed so that it spans multiple lines.",
  title: "Fantastic Cat Pro",
  productType: ProductType.Subscription,
  currentPrice: getPrice(990),
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
  price: getPrice(990),
  period: {
    number: 1,
    unit: PeriodUnit.Month,
  },
  freeTrialPhase: subscriptionOption.trial,
  discountPhase: null,
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
  discountPhase: null,
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
  discountPhase: null,
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
  discountPhase: null,
  introPricePhase: subscriptionOptionWithTrial.introPrice,
};

export const rcPackage: Package = {
  identifier: "testPackage",
  packageType: PackageType.Monthly,
  rcBillingProduct: product,
  webBillingProduct: product,
};

/**
 * Branding fixtures
 */

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
  paddleMissingRequiredPermission: new PurchaseFlowError(9),
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

export const checkoutStartResponse: WebBillingCheckoutStartResponse = {
  operation_session_id: "rcbopsess_test_test_test",
  gateway_params: {
    publishable_api_key: publishableApiKey,
    stripe_account_id: accountId,
    elements_configuration: stripeElementsConfiguration,
  },
  management_url: "https://manage.revenuecat.com/test_test_test",
  paddle_billing_params: null,
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
    sandbox_configuration: {
      checkout_feedback_form_url: "https://revenuecat.com",
    },
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
    sandbox_configuration: {
      checkout_feedback_form_url: "https://revenuecat.com",
    },
  },
  IgifyPaddle: {
    id: "app7e12a2a4b3",
    support_email: "devservices@revenuecat.com",
    app_icon: "1005820_1739283698.png",
    app_icon_webp: "1005820_1739283698.webp",
    app_wordmark: null,
    app_wordmark_webp: null,
    app_name: "Igify Paddle",
    appearance: {
      color_accent: "#B9CEF8",
      color_buttons_primary: "#000000",
      color_error: "#B0171F",
      color_form_bg: "#FFFFFF",
      color_page_bg: "#B9CEF8",
      color_product_info_bg: "#EFF3FA",
      font: "default",
      shapes: "default",
      show_product_description: true,
    },
    gateway_tax_collection_enabled: false,
    brand_font_config: null,
    sandbox_configuration: {
      checkout_feedback_form_url: "https://revenuecat.com",
    },
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
    sandbox_configuration: {
      checkout_feedback_form_url: "https://revenuecat.com",
    },
  },
};

/**
 * Tax calculation price breakdowns
 */

export const priceBreakdownNotCollectingTax: PriceBreakdown = {
  ...getPriceBreakdownTaxDisabled(subscriptionOption),
  taxCalculationStatus: "calculated",
  taxBreakdown: [],
};

export const priceBreakdownTaxLoading: PriceBreakdown = {
  ...getPriceBreakdownTaxDisabled(subscriptionOption),
  taxCalculationStatus: "loading",
  taxBreakdown: [
    {
      tax_amount_in_micros: 693000,
      display_name: "Tax Rate - NY (7%)",
    },
  ],
};

export const priceBreakdownTaxPending: PriceBreakdown = {
  ...priceBreakdownTaxLoading,
  taxCalculationStatus: "pending",
};

export const priceBreakdownTaxExclusiveWithMultipleTaxItems: PriceBreakdown = {
  currency: "USD",
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
