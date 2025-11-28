import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  StripeService,
  StripeServiceErrorCode,
} from "../../stripe/stripe-service";
import type {
  Stripe,
  StripeElementLocale,
  StripeElements,
  StripeError,
} from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import type { StripeElementsConfiguration } from "../../networking/responses/stripe-elements";
import type { BrandingInfoResponse } from "../../networking/responses/branding-response";
import { Translator } from "../../ui/localization/translator";
import { product, trialProduct } from "../../stories/fixtures";
import type { PriceBreakdown } from "../../ui/ui-types";

vi.mock("@stripe/stripe-js", () => ({
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
      vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const translator = new Translator();
    const managementUrl =
      "https://somewhere.com/manage/subscriptions/1234567890";
    const priceBreakdown: PriceBreakdown = {
      currency: "USD",
      totalAmountInMicros: 10000,
      totalExcludingTaxInMicros: 10000,
      taxCalculationStatus: "calculated",
      taxAmountInMicros: 0,
      taxBreakdown: [],
    };

    test("creates the ApplePay configuration correctly for a Trial Subscription Option", () => {
      const expressCheckoutOptionsStripeService =
        StripeService.buildStripeExpressCheckoutOptionsForSubscription(
          trialProduct,
          priceBreakdown,
          trialProduct.subscriptionOptions.option_id_1,
          translator,
          managementUrl,
        );

      expect(expressCheckoutOptionsStripeService).toStrictEqual({
        applePay: {
          recurringPaymentRequest: {
            paymentDescription: trialProduct.title,
            managementURL: managementUrl,
            regularBilling: {
              amount: 1,
              label: trialProduct.title,
              recurringPaymentStartDate: new Date("2025-01-08T00:00:00.000Z"),
              recurringPaymentIntervalUnit: "month",
              recurringPaymentIntervalCount: 1,
            },
            trialBilling: {
              amount: 0,
              label: "Free Trial",
            },
          },
        },
      });
    });

    test("creates the ApplePay configuration correctly for a Subscription Option without Trial", () => {
      const expressCheckoutOptionsStripeService =
        StripeService.buildStripeExpressCheckoutOptionsForSubscription(
          product,
          priceBreakdown,
          product.subscriptionOptions.option_id_1,
          translator,
          managementUrl,
        );

      expect(expressCheckoutOptionsStripeService).toStrictEqual({
        applePay: {
          recurringPaymentRequest: {
            paymentDescription: trialProduct.title,
            managementURL: managementUrl,
            regularBilling: {
              amount: 1,
              label: trialProduct.title,
              recurringPaymentStartDate: undefined,
              recurringPaymentIntervalUnit: "month",
              recurringPaymentIntervalCount: 1,
            },
            trialBilling: undefined,
          },
        },
      });
    });
  });
});
