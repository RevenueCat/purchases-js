import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  StripeService,
  StripeServiceErrorCode,
} from "../../stripe/stripe-service";
import type {
  Stripe,
  StripeElementLocale,
  StripeEmbeddedCheckout,
  StripeElements,
  StripeError,
} from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js/pure";
import type { StripeElementsConfiguration } from "../../networking/responses/stripe-elements";
import type { BrandingInfoResponse } from "../../networking/responses/branding-response";
import { Translator } from "../../ui/localization/translator";
import {
  consumableProduct,
  nonSubscriptionOption,
  nonSubscriptionOptionWithDiscount,
  product,
  subscriptionOption,
  subscriptionOptionWithDiscount,
  subscriptionOptionWithDiscountOneTime,
  subscriptionOptionWithIntroPriceRecurring,
  subscriptionOptionWithSingleMonthIntroPriceRecurring,
  subscriptionOptionWithTrialAndIntroPriceRecurring,
  trialProduct,
} from "../../stories/fixtures";
import type { PriceBreakdown } from "../../ui/ui-types";
import { resolveDiscountBreakdownForPurchaseOption } from "../../helpers/discount-breakdown-helper";
import type {
  Product,
  PurchaseOption,
  SubscriptionOption,
} from "../../entities/offerings";
import { PeriodUnit } from "../../helpers/duration-helper";

vi.mock("@stripe/stripe-js/pure", () => ({
  loadStripe: vi.fn(),
}));

describe("StripeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getStripeLocale", () => {
    test("returns 'auto' for unsupported locales", () => {
      expect(StripeService.getStripeLocale("ca")).toBe("auto");
      expect(StripeService.getStripeLocale("hi")).toBe("auto");
      expect(StripeService.getStripeLocale("uk")).toBe("auto");
    });

    test("returns mapped locale for special cases", () => {
      expect(StripeService.getStripeLocale("zh_Hans")).toBe("zh");
      expect(StripeService.getStripeLocale("zh-Hans")).toBe("zh");
      expect(StripeService.getStripeLocale("zh_Hant")).toBe("zh-TW");
      expect(StripeService.getStripeLocale("zh-Hant")).toBe("zh-TW");
    });

    test("returns the same locale for supported locales", () => {
      expect(StripeService.getStripeLocale("en")).toBe("en");
      expect(StripeService.getStripeLocale("es")).toBe("es");
    });
  });

  describe("initializeStripe", () => {
    const mockStripe: Partial<Stripe> = {
      elements: vi.fn().mockReturnValue({
        _elements: [1],
        submit: vi.fn(),
      } as unknown as StripeElements),
    };

    const mockConfig = {
      stripeAccountId: "test_account",
      publishableApiKey: "test_key",
      elementsConfiguration: {
        mode: "payment",
        payment_method_types: ["card"],
        setup_future_usage: "off_session",
      } as StripeElementsConfiguration,
      brandingInfo: null as BrandingInfoResponse | null,
      localeToUse: "en" as StripeElementLocale,
      stripeVariables: {},
      viewport: "desktop" as const,
    };

    beforeEach(() => {
      vi.mocked(loadStripe).mockResolvedValue(mockStripe as Stripe);
    });

    test("throws error when required configuration is missing", async () => {
      await expect(
        StripeService.initializeStripe(
          "",
          "",
          null as unknown as StripeElementsConfiguration,
          mockConfig.brandingInfo,
          mockConfig.localeToUse,
          mockConfig.stripeVariables,
          mockConfig.viewport,
        ),
      ).rejects.toEqual({
        code: StripeServiceErrorCode.ErrorLoadingStripe,
        gatewayErrorCode: undefined,
        message: "Stripe configuration is missing",
      });
    });

    test("throws error when stripe client fails to load", async () => {
      vi.mocked(loadStripe).mockRejectedValue({
        type: "api_connection_error",
        code: "failed_to_load",
        message: "Failed to load",
      } as StripeError);

      await expect(
        StripeService.initializeStripe(
          mockConfig.stripeAccountId,
          mockConfig.publishableApiKey,
          mockConfig.elementsConfiguration,
          mockConfig.brandingInfo,
          mockConfig.localeToUse,
          mockConfig.stripeVariables,
          mockConfig.viewport,
        ),
      ).rejects.toEqual({
        code: StripeServiceErrorCode.ErrorLoadingStripe,
        gatewayErrorCode: "failed_to_load",
        message: "Failed to load",
      });
    });

    test("throws error when stripe client is not found", async () => {
      vi.mocked(loadStripe).mockResolvedValue(null);

      await expect(
        StripeService.initializeStripe(
          mockConfig.stripeAccountId,
          mockConfig.publishableApiKey,
          mockConfig.elementsConfiguration,
          mockConfig.brandingInfo,
          mockConfig.localeToUse,
          mockConfig.stripeVariables,
          mockConfig.viewport,
        ),
      ).rejects.toEqual({
        code: StripeServiceErrorCode.ErrorLoadingStripe,
        gatewayErrorCode: undefined,
        message: "Stripe client not found",
      });
    });

    test("throws error when stripe elements fails to initialize", async () => {
      const mockStripe: Partial<Stripe> = {
        elements: vi.fn().mockImplementation(() => {
          throw {
            type: "api_connection_error",
            code: "failed_to_load",
            message: "Failed to load",
          } as StripeError;
        }),
      };

      vi.mocked(loadStripe).mockResolvedValue(mockStripe as Stripe);

      await expect(
        StripeService.initializeStripe(
          mockConfig.stripeAccountId,
          mockConfig.publishableApiKey,
          mockConfig.elementsConfiguration,
          mockConfig.brandingInfo,
          mockConfig.localeToUse,
          mockConfig.stripeVariables,
          mockConfig.viewport,
        ),
      ).rejects.toEqual({
        code: StripeServiceErrorCode.ErrorLoadingStripe,
        gatewayErrorCode: "failed_to_load",
        message: "Failed to load",
      });
    });
  });

  describe("initializeStripeCheckout", () => {
    const stripeBillingParams = {
      client_secret: "cs_test_123",
      environment: "sandbox",
      publishable_api_key: "pk_test_123",
      stripe_account_id: "acct_123",
      branding_settings: null,
      appearance: null,
    };

    test("throws error when required configuration is missing", async () => {
      await expect(
        StripeService.initializeStripeCheckout("", "", undefined, undefined),
      ).rejects.toEqual({
        code: StripeServiceErrorCode.ErrorLoadingStripe,
        gatewayErrorCode: undefined,
        message: "Stripe configuration is missing",
      });
    });

    test("initializes embedded checkout via createEmbeddedCheckoutPage", async () => {
      const mockEmbeddedCheckout = {} as StripeEmbeddedCheckout;
      const createEmbeddedCheckoutPage = vi
        .fn()
        .mockResolvedValue(mockEmbeddedCheckout);
      const mockStripe: Partial<Stripe> = {
        createEmbeddedCheckoutPage,
      };
      const onComplete = vi.fn();

      vi.mocked(loadStripe).mockResolvedValue(mockStripe as Stripe);

      const result = await StripeService.initializeStripeCheckout(
        "acct_123",
        "pk_test_123",
        stripeBillingParams,
        onComplete,
      );

      expect(loadStripe).toHaveBeenCalledWith("pk_test_123", {
        stripeAccount: "acct_123",
      });
      expect(createEmbeddedCheckoutPage).toHaveBeenCalledWith({
        fetchClientSecret: expect.any(Function),
        onComplete,
      });

      const fetchClientSecret = createEmbeddedCheckoutPage.mock.calls[0]?.[0]
        ?.fetchClientSecret as () => Promise<string>;
      await expect(fetchClientSecret()).resolves.toBe("cs_test_123");

      expect(result).toEqual({
        stripe: mockStripe,
        embeddedCheckout: mockEmbeddedCheckout,
      });
    });

    test("throws mapped initialization error when embedded checkout initialization fails", async () => {
      const mockStripe: Partial<Stripe> = {
        createEmbeddedCheckoutPage: vi.fn().mockRejectedValue({
          type: "api_connection_error",
          code: "failed_to_load",
          message: "Failed to load",
        } as StripeError),
      };

      vi.mocked(loadStripe).mockResolvedValue(mockStripe as Stripe);

      await expect(
        StripeService.initializeStripeCheckout(
          "acct_123",
          "pk_test_123",
          stripeBillingParams,
        ),
      ).rejects.toEqual({
        code: StripeServiceErrorCode.ErrorLoadingStripe,
        gatewayErrorCode: "failed_to_load",
        message: "Failed to load",
      });
    });
  });

  describe("isStripeHandledFormError", () => {
    test("returns true for validation error", () => {
      const error = { type: "validation_error" } as StripeError;
      expect(StripeService.isStripeHandledFormError(error)).toBe(true);
    });

    test("returns true for handled card error codes", () => {
      const handledErrors = [
        { type: "card_error", code: "card_declined" },
        { type: "card_error", code: "expired_card" },
        { type: "card_error", code: "incorrect_cvc" },
        { type: "card_error", code: "incorrect_number" },
      ];

      handledErrors.forEach((error) => {
        expect(
          StripeService.isStripeHandledFormError(error as StripeError),
        ).toBe(true);
      });
    });

    test("returns false for unhandled error types", () => {
      const unhandledErrors = [
        { type: "api_error", code: "card_declined" },
        { type: "card_error", code: "unknown_error" },
      ];

      unhandledErrors.forEach((error) => {
        expect(
          StripeService.isStripeHandledFormError(error as StripeError),
        ).toBe(false);
      });
    });
  });

  describe("mapError", () => {
    test("maps error loading stripe correctly", () => {
      const error = {
        type: "api_connection_error",
        code: "failed_to_load",
        message: "Failed to load",
      } as StripeError;

      const result = StripeService.mapInitializationError(error);

      expect(result).toEqual({
        code: StripeServiceErrorCode.ErrorLoadingStripe,
        gatewayErrorCode: "failed_to_load",
        message: "Failed to load",
      });
    });

    test("maps handled card errors correctly", () => {
      const error = {
        type: "card_error",
        code: "card_declined",
        message: "Card was declined",
      } as StripeError;

      const result = StripeService.mapError(error);

      expect(result).toEqual({
        code: StripeServiceErrorCode.HandledFormError,
        gatewayErrorCode: "card_declined",
        message: "Card was declined",
      });
    });

    test("maps unhandled errors correctly", () => {
      const error = {
        type: "api_error",
        code: "unknown_error",
        message: "Something went wrong",
      } as StripeError;

      const result = StripeService.mapError(error);

      expect(result).toEqual({
        code: StripeServiceErrorCode.UnhandledFormError,
        gatewayErrorCode: "unknown_error",
        message: "Something went wrong",
      });
    });
  });

  describe("createPaymentElement", () => {
    test("creates payment element with correct configuration", () => {
      const mockElements: Partial<StripeElements> = {
        create: vi.fn(),
      };

      StripeService.createPaymentElement(
        mockElements as StripeElements,
        "Test App",
      );

      expect(mockElements.create).toHaveBeenCalledWith("payment", {
        business: { name: "Test App" },
        layout: {
          type: "tabs",
        },
        terms: {
          applePay: "never",
          auBecsDebit: "never",
          bancontact: "never",
          card: "never",
          cashapp: "never",
          googlePay: "never",
          ideal: "never",
          paypal: "never",
          sepaDebit: "never",
          sofort: "never",
          usBankAccount: "never",
        },
      });
    });

    test("creates payment element without business name when not provided", () => {
      const mockElements: Partial<StripeElements> = {
        create: vi.fn(),
      };

      StripeService.createPaymentElement(mockElements as StripeElements);

      expect(mockElements.create).toHaveBeenCalledWith("payment", {
        layout: {
          type: "tabs",
        },
        terms: expect.any(Object),
      });
    });
  });

  describe("createAddressElement", () => {
    test("creates a billing address element collecting the full name", () => {
      const mockElements: Partial<StripeElements> = {
        create: vi.fn(),
      };

      StripeService.createAddressElement(mockElements as StripeElements);

      expect(mockElements.create).toHaveBeenCalledWith("address", {
        mode: "billing",
        display: {
          name: "full",
        },
      });
    });

    test("seeds the address element with the provided default country", () => {
      const mockElements: Partial<StripeElements> = {
        create: vi.fn(),
      };

      StripeService.createAddressElement(mockElements as StripeElements, "CA");

      expect(mockElements.create).toHaveBeenCalledWith("address", {
        mode: "billing",
        display: {
          name: "full",
        },
        defaultValues: {
          address: {
            country: "CA",
          },
        },
      });
    });
  });

  describe("extractTaxCustomerDetails", () => {
    test("returns the full billing address from the confirmation token", async () => {
      const mockElements = {} as StripeElements;
      const mockStripe = {
        createConfirmationToken: vi.fn().mockResolvedValue({
          confirmationToken: {
            id: "ctoken_123",
            payment_method_preview: {
              billing_details: {
                address: {
                  country: "US",
                  postal_code: "10001",
                  state: "NY",
                  city: "New York",
                  line1: "123 Main St",
                  line2: "Apt 4",
                },
              },
            },
          },
        }),
      } as unknown as Stripe;

      const { customerDetails, confirmationTokenId } =
        await StripeService.extractTaxCustomerDetails(mockElements, mockStripe);

      expect(confirmationTokenId).toBe("ctoken_123");
      expect(customerDetails).toEqual({
        countryCode: "US",
        postalCode: "10001",
        state: "NY",
        city: "New York",
        addressLine1: "123 Main St",
        addressLine2: "Apt 4",
      });
    });

    test("returns undefined fields when the billing address is missing", async () => {
      const mockElements = {} as StripeElements;
      const mockStripe = {
        createConfirmationToken: vi.fn().mockResolvedValue({
          confirmationToken: {
            id: "ctoken_456",
            payment_method_preview: {},
          },
        }),
      } as unknown as Stripe;

      const { customerDetails } = await StripeService.extractTaxCustomerDetails(
        mockElements,
        mockStripe,
      );

      expect(customerDetails).toEqual({
        countryCode: undefined,
        postalCode: undefined,
        state: undefined,
        city: undefined,
        addressLine1: undefined,
        addressLine2: undefined,
      });
    });
  });

  describe("createLinkAuthenticationElement", () => {
    test("creates link authentication element with email", () => {
      const mockElements: Partial<StripeElements> = {
        create: vi.fn(),
      };

      StripeService.createLinkAuthenticationElement(
        mockElements as StripeElements,
        "test@example.com",
      );

      expect(mockElements.create).toHaveBeenCalledWith("linkAuthentication", {
        defaultValues: {
          email: "test@example.com",
        },
      });
    });

    test("creates link authentication element with empty email when not provided", () => {
      const mockElements: Partial<StripeElements> = {
        create: vi.fn(),
      };

      StripeService.createLinkAuthenticationElement(
        mockElements as StripeElements,
      );

      expect(mockElements.create).toHaveBeenCalledWith("linkAuthentication", {
        defaultValues: {
          email: "",
        },
      });
    });
  });

  describe("microsToMinimumAmountPrice", () => {
    test("converts correctly JPY and USD", () => {
      const priceMicros = 1_000_000;

      // 1 yen
      expect(StripeService.microsToMinimumAmountPrice(priceMicros, "JPY")).toBe(
        1,
      );

      // 1 dollar
      expect(StripeService.microsToMinimumAmountPrice(priceMicros, "USD")).toBe(
        100,
      );
    });
  });

  describe("buildStripeExpressCheckoutOptionsForSubscription", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 0, 1));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const translator = new Translator();
    const managementUrl =
      "https://somewhere.com/manage/subscriptions/1234567890";
    const baseLayout = {
      maxColumns: undefined,
      maxRows: undefined,
      overflow: undefined,
    };
    const baseBreakdown: PriceBreakdown = {
      currency: "USD",
      totalAmountInMicros: 9_900_000,
      totalExcludingTaxInMicros: 9_900_000,
      taxCalculationStatus: "calculated",
      taxAmountInMicros: 0,
      taxBreakdown: [],
    };

    const makeBreakdown = (totalAmountInMicros: number): PriceBreakdown => ({
      ...baseBreakdown,
      totalAmountInMicros,
      totalExcludingTaxInMicros: totalAmountInMicros,
    });

    // Asserts that line items always sum to elements.amount, which Stripe
    // enforces silently — mismatches cause the wallet to drop them.
    const expectLineItemsBalance = (
      lineItems: Array<{ amount: number }> | undefined,
      totalMinimumAmount: number,
    ) => {
      if (lineItems === undefined) return;
      const sum = lineItems.reduce((acc, item) => acc + item.amount, 0);
      expect(sum).toBe(totalMinimumAmount);
    };

    const resolveDiscount = (
      priceBreakdown: PriceBreakdown,
      productDetails: Product,
      purchaseOption: PurchaseOption,
    ) =>
      resolveDiscountBreakdownForPurchaseOption({
        priceBreakdown,
        productDetails,
        purchaseOption,
        translator,
      });

    test("subscription with trial: no line items, free trial in Apple Pay", () => {
      const subscriptionOptionForTrial =
        trialProduct.subscriptionOptions.option_id_1;
      const result =
        StripeService.buildStripeExpressCheckoutOptionsForSubscription(
          trialProduct,
          baseBreakdown,
          subscriptionOptionForTrial,
          translator,
          managementUrl,
          resolveDiscount(
            baseBreakdown,
            trialProduct,
            subscriptionOptionForTrial,
          ),
        );

      expect(result).toStrictEqual({
        layout: baseLayout,
        applePay: {
          recurringPaymentRequest: {
            paymentDescription: trialProduct.title,
            managementURL: managementUrl,
            trialBilling: {
              amount: 0,
              label: "Free Trial",
            },
            regularBilling: {
              amount: 990,
              label: trialProduct.title,
              recurringPaymentStartDate: new Date(2025, 0, 8),
              recurringPaymentIntervalUnit: "month",
              recurringPaymentIntervalCount: 1,
            },
          },
        },
      });
    });

    test("subscription with a paid-once weekly intro describes both billing phases", () => {
      const basePrice = {
        amount: 4_999,
        amountMicros: 49_990_000,
        currency: "USD",
        formattedPrice: "$49.99",
      };
      const introPrice = {
        amount: 499,
        amountMicros: 4_990_000,
        currency: "USD",
        formattedPrice: "$4.99",
      };
      const paidIntroOption: SubscriptionOption = {
        ...subscriptionOption,
        base: {
          ...subscriptionOption.base,
          price: basePrice,
        },
        introPrice: {
          periodDuration: "P1W",
          period: {
            number: 1,
            unit: PeriodUnit.Week,
          },
          cycleCount: 1,
          price: introPrice,
          pricePerWeek: introPrice,
          pricePerMonth: null,
          pricePerYear: null,
        },
      };
      const breakdown = makeBreakdown(4_990_000);

      const result =
        StripeService.buildStripeExpressCheckoutOptionsForSubscription(
          product,
          breakdown,
          paidIntroOption,
          translator,
          managementUrl,
          resolveDiscount(breakdown, product, paidIntroOption),
        );

      expect(result).toStrictEqual({
        layout: baseLayout,
        applePay: {
          recurringPaymentRequest: {
            paymentDescription: product.title,
            managementURL: managementUrl,
            trialBilling: {
              amount: 499,
              label: product.title,
              recurringPaymentEndDate: new Date(2025, 0, 1),
              recurringPaymentIntervalUnit: "day",
              recurringPaymentIntervalCount: 7,
            },
            regularBilling: {
              amount: 4_999,
              label: product.title,
              recurringPaymentStartDate: new Date(2025, 0, 8),
              recurringPaymentIntervalUnit: "month",
              recurringPaymentIntervalCount: 1,
            },
          },
        },
      });
    });

    test("subscription with a multi-cycle intro delays regular billing until every intro cycle ends", () => {
      const breakdown = makeBreakdown(3_490_000);

      const result =
        StripeService.buildStripeExpressCheckoutOptionsForSubscription(
          product,
          breakdown,
          subscriptionOptionWithIntroPriceRecurring,
          translator,
          managementUrl,
          resolveDiscount(
            breakdown,
            product,
            subscriptionOptionWithIntroPriceRecurring,
          ),
        );

      expect(result).toMatchObject({
        applePay: {
          recurringPaymentRequest: {
            trialBilling: {
              amount: 349,
              recurringPaymentEndDate: new Date(2025, 2, 1),
              recurringPaymentIntervalUnit: "month",
              recurringPaymentIntervalCount: 1,
            },
            regularBilling: {
              amount: 990,
              recurringPaymentStartDate: new Date(2025, 3, 1),
            },
          },
        },
      });
    });

    test("subscription with a monthly intro uses the last day of the month for the regular billing start", () => {
      vi.setSystemTime(new Date(2025, 0, 31));
      const breakdown = makeBreakdown(3_490_000);

      const result =
        StripeService.buildStripeExpressCheckoutOptionsForSubscription(
          product,
          breakdown,
          subscriptionOptionWithSingleMonthIntroPriceRecurring,
          translator,
          managementUrl,
          resolveDiscount(
            breakdown,
            product,
            subscriptionOptionWithSingleMonthIntroPriceRecurring,
          ),
        );

      expect(result).toMatchObject({
        applePay: {
          recurringPaymentRequest: {
            regularBilling: {
              recurringPaymentStartDate: new Date(2025, 1, 28),
            },
          },
        },
      });
    });

    test("subscription with an intro missing its period omits unknown billing dates", () => {
      const optionWithUnknownIntroPeriod: SubscriptionOption = {
        ...subscriptionOptionWithIntroPriceRecurring,
        introPrice: {
          ...subscriptionOptionWithIntroPriceRecurring.introPrice!,
          periodDuration: null,
          period: null,
        },
      };
      const breakdown = makeBreakdown(3_490_000);

      const result =
        StripeService.buildStripeExpressCheckoutOptionsForSubscription(
          product,
          breakdown,
          optionWithUnknownIntroPeriod,
          translator,
          managementUrl,
          resolveDiscount(breakdown, product, optionWithUnknownIntroPeriod),
        );
      const recurringRequest = result.applePay?.recurringPaymentRequest;
      if (!recurringRequest) {
        throw new Error("Expected an Apple Pay recurring payment request");
      }

      expect(recurringRequest.trialBilling).toStrictEqual({
        amount: 349,
        label: product.title,
      });
      expect(recurringRequest.regularBilling).toMatchObject({
        amount: 990,
        recurringPaymentStartDate: undefined,
      });
    });

    test("subscription with a missing base price falls back to the current amount", () => {
      const optionWithoutBasePrice: SubscriptionOption = {
        ...subscriptionOption,
        base: {
          ...subscriptionOption.base,
          price: null,
        },
      };
      const breakdown = makeBreakdown(1_230_000);

      const result =
        StripeService.buildStripeExpressCheckoutOptionsForSubscription(
          product,
          breakdown,
          optionWithoutBasePrice,
          translator,
          managementUrl,
          resolveDiscount(breakdown, product, optionWithoutBasePrice),
        );

      expect(result).toMatchObject({
        applePay: {
          recurringPaymentRequest: {
            regularBilling: { amount: 123 },
          },
        },
      });
    });

    test("subscription with a trial and intro starts the paid intro after the trial and base billing after both", () => {
      const result =
        StripeService.buildStripeExpressCheckoutOptionsForSubscription(
          product,
          baseBreakdown,
          subscriptionOptionWithTrialAndIntroPriceRecurring,
          translator,
          managementUrl,
          resolveDiscount(
            baseBreakdown,
            product,
            subscriptionOptionWithTrialAndIntroPriceRecurring,
          ),
        );

      expect(result).toMatchObject({
        applePay: {
          recurringPaymentRequest: {
            trialBilling: {
              amount: 349,
              label: product.title,
              recurringPaymentStartDate: new Date(2025, 0, 8),
              recurringPaymentEndDate: new Date(2025, 2, 8),
              recurringPaymentIntervalUnit: "month",
              recurringPaymentIntervalCount: 1,
            },
            regularBilling: {
              amount: 990,
              recurringPaymentStartDate: new Date(2025, 3, 8),
            },
          },
        },
      });
    });

    test("subscription without trial or discount: no line items", () => {
      const result =
        StripeService.buildStripeExpressCheckoutOptionsForSubscription(
          product,
          baseBreakdown,
          subscriptionOption,
          translator,
          managementUrl,
          resolveDiscount(baseBreakdown, product, subscriptionOption),
        );

      expect(result).toStrictEqual({
        layout: baseLayout,
        applePay: {
          recurringPaymentRequest: {
            paymentDescription: product.title,
            managementURL: managementUrl,
            regularBilling: {
              amount: 990,
              label: product.title,
              recurringPaymentStartDate: undefined,
              recurringPaymentIntervalUnit: "month",
              recurringPaymentIntervalCount: 1,
            },
          },
        },
      });
    });

    test("subscription with one_time discount: line items", () => {
      const breakdown = makeBreakdown(1_000_000);
      const result =
        StripeService.buildStripeExpressCheckoutOptionsForSubscription(
          product,
          breakdown,
          subscriptionOptionWithDiscountOneTime,
          translator,
          managementUrl,
          resolveDiscount(
            breakdown,
            product,
            subscriptionOptionWithDiscountOneTime,
          ),
        );

      expect(result.lineItems).toStrictEqual([
        { name: product.title, amount: 990 },
        { name: "One-time Discount to $1 (20% off)", amount: -890 },
      ]);
      expectLineItemsBalance(result.lineItems, 100);
      expect(result).toMatchObject({
        applePay: {
          recurringPaymentRequest: {
            regularBilling: { amount: 990 },
          },
        },
      });
    });

    test("subscription with time_window discount: line items", () => {
      const breakdown = makeBreakdown(7_990_000);
      const result =
        StripeService.buildStripeExpressCheckoutOptionsForSubscription(
          product,
          breakdown,
          subscriptionOptionWithDiscount,
          translator,
          managementUrl,
          resolveDiscount(breakdown, product, subscriptionOptionWithDiscount),
        );

      expect(result.lineItems).toStrictEqual([
        { name: product.title, amount: 990 },
        { name: "Holiday Sale $7.99 (20% off for 3 months)", amount: -191 },
      ]);
      expectLineItemsBalance(result.lineItems, 799);
      expect(result).toMatchObject({
        applePay: {
          recurringPaymentRequest: {
            regularBilling: { amount: 990 },
          },
        },
      });
    });

    test("subscription with applied promo code only: line items from appliedDiscounts", () => {
      const breakdown: PriceBreakdown = {
        ...makeBreakdown(8_900_000),
        originalAmountInMicros: 9_900_000,
        appliedDiscounts: [
          {
            identifier: "save10",
            displayName: "SAVE10",
            discountedAmountInMicros: 1_000_000,
            percentage: 10,
            discountCode: "SAVE10",
          },
        ],
      };
      const result =
        StripeService.buildStripeExpressCheckoutOptionsForSubscription(
          product,
          breakdown,
          subscriptionOption,
          translator,
          managementUrl,
          resolveDiscount(breakdown, product, subscriptionOption),
        );

      expect(result.lineItems).toStrictEqual([
        { name: product.title, amount: 990 },
        { name: "SAVE10 (10% off)", amount: -100 },
      ]);
      expectLineItemsBalance(result.lineItems, 890);
      expect(result).toMatchObject({
        applePay: {
          recurringPaymentRequest: {
            regularBilling: { amount: 990 },
          },
        },
      });
    });

    test("subscription with applied time_window promo: line items with duration suffix", () => {
      const breakdown: PriceBreakdown = {
        ...makeBreakdown(8_900_000),
        originalAmountInMicros: 9_900_000,
        appliedDiscounts: [
          {
            identifier: "holiday",
            displayName: "Holiday Sale",
            discountedAmountInMicros: 1_000_000,
            percentage: 10,
            discountCode: "HOLIDAY",
            durationMode: "time_window",
            timeWindow: "P3M",
          },
        ],
      };
      const result =
        StripeService.buildStripeExpressCheckoutOptionsForSubscription(
          product,
          breakdown,
          subscriptionOption,
          translator,
          managementUrl,
          resolveDiscount(breakdown, product, subscriptionOption),
        );

      expect(result.lineItems).toStrictEqual([
        { name: product.title, amount: 990 },
        { name: "Holiday Sale (10% off for 3 months)", amount: -100 },
      ]);
      expectLineItemsBalance(result.lineItems, 890);
    });
  });

  describe("buildStripeExpressCheckoutOptionsForNonSubscription", () => {
    const translator = new Translator();
    const baseLayout = {
      maxColumns: undefined,
      maxRows: undefined,
      overflow: undefined,
    };
    const baseBreakdown: PriceBreakdown = {
      currency: "USD",
      totalAmountInMicros: 9_900_000,
      totalExcludingTaxInMicros: 9_900_000,
      taxCalculationStatus: "calculated",
      taxAmountInMicros: 0,
      taxBreakdown: [],
    };

    const makeBreakdown = (totalAmountInMicros: number): PriceBreakdown => ({
      ...baseBreakdown,
      totalAmountInMicros,
      totalExcludingTaxInMicros: totalAmountInMicros,
    });

    const expectLineItemsBalance = (
      lineItems: Array<{ amount: number }> | undefined,
      totalMinimumAmount: number,
    ) => {
      if (lineItems === undefined) return;
      const sum = lineItems.reduce((acc, item) => acc + item.amount, 0);
      expect(sum).toBe(totalMinimumAmount);
    };

    const resolveDiscount = (
      priceBreakdown: PriceBreakdown,
      productDetails: Product,
      purchaseOption: PurchaseOption,
    ) =>
      resolveDiscountBreakdownForPurchaseOption({
        priceBreakdown,
        productDetails,
        purchaseOption,
        translator,
      });

    test("consumable without discount: no recurring request, no line items", () => {
      const result =
        StripeService.buildStripeExpressCheckoutOptionsForNonSubscription(
          consumableProduct,
          baseBreakdown,
          resolveDiscount(
            baseBreakdown,
            consumableProduct,
            nonSubscriptionOption,
          ),
        );

      expect(result).toStrictEqual({ layout: baseLayout });
      expect(result.applePay).toBeUndefined();
    });

    test("consumable with discount: line items, no recurring request", () => {
      const breakdown = makeBreakdown(1_000_000);
      const result =
        StripeService.buildStripeExpressCheckoutOptionsForNonSubscription(
          consumableProduct,
          breakdown,
          resolveDiscount(
            breakdown,
            consumableProduct,
            nonSubscriptionOptionWithDiscount,
          ),
        );

      expect(result.applePay).toBeUndefined();
      expect(result.lineItems).toStrictEqual([
        { name: consumableProduct.title, amount: 990 },
        { name: "One-time Discount to $1 (20% off)", amount: -890 },
      ]);
      expectLineItemsBalance(result.lineItems, 100);
    });

    test("consumable with applied promo code only: line items from appliedDiscounts", () => {
      const breakdown: PriceBreakdown = {
        ...makeBreakdown(8_900_000),
        originalAmountInMicros: 9_900_000,
        appliedDiscounts: [
          {
            identifier: "save10",
            displayName: "SAVE10",
            discountedAmountInMicros: 1_000_000,
            percentage: 10,
            discountCode: "SAVE10",
          },
        ],
      };
      const result =
        StripeService.buildStripeExpressCheckoutOptionsForNonSubscription(
          consumableProduct,
          breakdown,
          resolveDiscount(breakdown, consumableProduct, nonSubscriptionOption),
        );

      expect(result.applePay).toBeUndefined();
      expect(result.lineItems).toStrictEqual([
        { name: consumableProduct.title, amount: 990 },
        { name: "SAVE10 (10% off)", amount: -100 },
      ]);
      expectLineItemsBalance(result.lineItems, 890);
    });
  });
});
