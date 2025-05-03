import { describe, test, expect, vi, beforeEach } from "vitest";
import {
  StripeService,
  StripeServiceErrorCode,
} from "../../stripe/stripe-service";
import type {
  StripeError,
  StripeElements,
  Stripe,
  StripeElementLocale,
} from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import type { StripeElementsConfiguration } from "../../networking/responses/stripe-elements";
import type { BrandingInfoResponse } from "../../networking/responses/branding-response";

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
      expect(StripeService.getStripeLocale("zh_Hant")).toBe("zh");
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
          defaultCollapsed: true,
        },
        paymentMethodOrder: ["apple_pay", "google_pay"],
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
          defaultCollapsed: true,
        },
        paymentMethodOrder: ["apple_pay", "google_pay"],
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
});
