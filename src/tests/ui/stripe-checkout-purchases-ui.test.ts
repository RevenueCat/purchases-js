import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/svelte";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { ComponentProps } from "svelte";
import StripeCheckoutPurchasesUi from "../../ui/stripe-checkout-purchases-ui.svelte";
import {
  brandingInfo,
  rcPackage,
  subscriptionOption,
} from "../../stories/fixtures";
import { createEventsTrackerMock } from "../mocks/events-tracker-mock-provider";
import type { PurchaseOperationHelper } from "../../helpers/purchase-operation-helper";
import type { WebBillingCheckoutStartResponse } from "../../networking/responses/checkout-start-response";
import {
  StripeElementsMode,
  StripeElementsSetupFutureUsage,
} from "../../networking/responses/stripe-elements";

const eventsTrackerMock = createEventsTrackerMock();

const checkoutStartResponseWithoutStripeParams: WebBillingCheckoutStartResponse =
  {
    operation_session_id: "test-operation-session-id",
    stripe_billing_params: null,
    gateway_params: {
      stripe_account_id: "test-stripe-account-id",
      publishable_api_key: "test-publishable-key",
      elements_configuration: {
        mode: StripeElementsMode.Setup,
        payment_method_types: ["card"],
        setup_future_usage: StripeElementsSetupFutureUsage.OffSession,
      },
    },
    management_url: "https://test-management-url.revenuecat.com",
    paddle_billing_params: null,
    paypal_gateway_params: null,
  };

const createCheckoutStartResponseWithStripeParams = (
  environment: string,
): WebBillingCheckoutStartResponse => ({
  operation_session_id: "test-operation-session-id",
  stripe_billing_params: {
    client_secret: "cs_test_123",
    environment,
    publishable_api_key: "pk_test_123",
    stripe_account_id: "acct_test_123",
  },
  gateway_params: {
    stripe_account_id: "test-stripe-account-id",
    publishable_api_key: "test-publishable-key",
    elements_configuration: {
      mode: StripeElementsMode.Setup,
      payment_method_types: ["card"],
      setup_future_usage: StripeElementsSetupFutureUsage.OffSession,
    },
  },
  management_url: "https://test-management-url.revenuecat.com",
  paddle_billing_params: null,
  paypal_gateway_params: null,
});

const purchaseOperationHelperMock: PurchaseOperationHelper = {
  checkoutStart: async () =>
    Promise.resolve(checkoutStartResponseWithoutStripeParams),
  pollCurrentPurchaseForCompletion: async () =>
    Promise.resolve({
      redemptionInfo: null,
      operationSessionId: "test-operation-session-id",
    }),
} as unknown as PurchaseOperationHelper;

const baseProps: ComponentProps<StripeCheckoutPurchasesUi> = {
  brandingInfo,
  eventsTracker: eventsTrackerMock,
  selectedLocale: "en",
  defaultLocale: "en",
  customTranslations: {},
  isInElement: true,
  skipSuccessPage: false,
  onFinished: vi.fn(),
  onError: vi.fn(),
  rcPackage,
  appUserId: "test-app-user-id",
  purchaseOption: subscriptionOption,
  customerEmail: "test@example.com",
  metadata: { utm_term: "something" },
  purchaseOperationHelper: purchaseOperationHelperMock,
};

describe("StripeCheckoutPurchasesUi", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("passes workflowPurchaseContext to checkoutStart when provided", async () => {
    const checkoutStartSpy = vi
      .spyOn(purchaseOperationHelperMock, "checkoutStart")
      .mockResolvedValue(checkoutStartResponseWithoutStripeParams);

    render(StripeCheckoutPurchasesUi, {
      props: {
        ...baseProps,
        workflowPurchaseContext: { stepId: "test-step-123" },
      },
    });

    await waitFor(() => {
      expect(checkoutStartSpy).toHaveBeenCalledWith(
        "test-app-user-id",
        rcPackage.webBillingProduct.identifier,
        subscriptionOption,
        rcPackage.webBillingProduct.presentedOfferingContext,
        "test@example.com",
        { utm_term: "something" },
        { stepId: "test-step-123" },
        undefined,
      );
    });
  });

  test("passes undefined workflowPurchaseContext to checkoutStart when not provided", async () => {
    const checkoutStartSpy = vi
      .spyOn(purchaseOperationHelperMock, "checkoutStart")
      .mockResolvedValue(checkoutStartResponseWithoutStripeParams);

    render(StripeCheckoutPurchasesUi, {
      props: {
        ...baseProps,
      },
    });

    await waitFor(() => {
      expect(checkoutStartSpy).toHaveBeenCalledWith(
        "test-app-user-id",
        rcPackage.webBillingProduct.identifier,
        subscriptionOption,
        rcPackage.webBillingProduct.presentedOfferingContext,
        "test@example.com",
        { utm_term: "something" },
        undefined,
        undefined,
      );
    });
  });

  test("passes undefined email to checkoutStart when provided email is invalid", async () => {
    const checkoutStartSpy = vi
      .spyOn(purchaseOperationHelperMock, "checkoutStart")
      .mockResolvedValue(checkoutStartResponseWithoutStripeParams);

    render(StripeCheckoutPurchasesUi, {
      props: {
        ...baseProps,
        customerEmail: "invalid-email",
      },
    });

    await waitFor(() => {
      expect(checkoutStartSpy).toHaveBeenCalledWith(
        "test-app-user-id",
        rcPackage.webBillingProduct.identifier,
        subscriptionOption,
        rcPackage.webBillingProduct.presentedOfferingContext,
        undefined,
        { utm_term: "something" },
        undefined,
        undefined,
      );
    });
  });

  test("shows error page when checkoutStart returns missing stripe checkout params", async () => {
    vi.spyOn(purchaseOperationHelperMock, "checkoutStart").mockResolvedValue(
      checkoutStartResponseWithoutStripeParams,
    );

    render(StripeCheckoutPurchasesUi, {
      props: {
        ...baseProps,
      },
    });

    const errorTitle = await screen.findByText("Something went wrong");
    expect(errorTitle).toBeInTheDocument();

    const errorMessage = await screen.findByText(
      /Purchase not started due to an error/i,
    );
    expect(errorMessage).toBeInTheDocument();
  });

  test("passes paywallId to checkoutStart when provided", async () => {
    const checkoutStartSpy = vi
      .spyOn(purchaseOperationHelperMock, "checkoutStart")
      .mockResolvedValue(checkoutStartResponseWithoutStripeParams);

    render(StripeCheckoutPurchasesUi, {
      props: {
        ...baseProps,
        paywallId: "paywall-abc-123",
      },
    });

    await waitFor(() => {
      expect(checkoutStartSpy).toHaveBeenCalledWith(
        "test-app-user-id",
        rcPackage.webBillingProduct.identifier,
        subscriptionOption,
        rcPackage.webBillingProduct.presentedOfferingContext,
        "test@example.com",
        { utm_term: "something" },
        undefined,
        "paywall-abc-123",
      );
    });
  });

  test("passes undefined paywallId to checkoutStart when not provided", async () => {
    const checkoutStartSpy = vi
      .spyOn(purchaseOperationHelperMock, "checkoutStart")
      .mockResolvedValue(checkoutStartResponseWithoutStripeParams);

    render(StripeCheckoutPurchasesUi, {
      props: {
        ...baseProps,
      },
    });

    await waitFor(() => {
      expect(checkoutStartSpy).toHaveBeenCalledWith(
        "test-app-user-id",
        rcPackage.webBillingProduct.identifier,
        subscriptionOption,
        rcPackage.webBillingProduct.presentedOfferingContext,
        "test@example.com",
        { utm_term: "something" },
        undefined,
        undefined,
      );
    });
  });

  test("shows sandbox banner when stripe billing environment is sandbox", async () => {
    vi.spyOn(purchaseOperationHelperMock, "checkoutStart").mockResolvedValue(
      createCheckoutStartResponseWithStripeParams("sandbox"),
    );

    render(StripeCheckoutPurchasesUi, {
      props: {
        ...baseProps,
      },
    });

    const sandboxBanner = await screen.findByText("SANDBOX");
    expect(sandboxBanner).toBeInTheDocument();
  });

  test("does not show sandbox banner when stripe billing environment is production", async () => {
    const checkoutStartSpy = vi
      .spyOn(purchaseOperationHelperMock, "checkoutStart")
      .mockResolvedValue(
        createCheckoutStartResponseWithStripeParams("production"),
      );

    render(StripeCheckoutPurchasesUi, {
      props: {
        ...baseProps,
      },
    });

    await waitFor(() => {
      expect(checkoutStartSpy).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByText("SANDBOX")).not.toBeInTheDocument();
  });
});
