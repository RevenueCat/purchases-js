import { beforeEach, describe, expect, test, vi } from "vitest";
import { Payrails } from "@payrails/web-sdk";
import type { PaymentFailedEvent } from "@payrails/web-sdk";
import { PayrailsService } from "../../payrails/payrails-service";
import { isPayrailsCheckoutStartResponse } from "../../networking/responses/checkout-start-response";
import type { PayrailsGatewayParams } from "../../networking/responses/payrails-gateway-params";

vi.mock("@payrails/web-sdk", () => ({
  Payrails: {
    init: vi.fn(),
  },
}));

const gatewayParams: PayrailsGatewayParams = {
  version: "1.0.0",
  data: "encoded-client-init",
};

describe("isPayrailsCheckoutStartResponse", () => {
  test("accepts a checkout start body whose payrails params can initialize the SDK", () => {
    expect(
      isPayrailsCheckoutStartResponse({
        checkout_mode: "purchase",
        management_url: "https://example.com/portal",
        operation_session_id: "rcbopsess_payrails",
        payrails_gateway_params: gatewayParams,
      }),
    ).toBe(true);
  });

  test("rejects stripe web billing responses", () => {
    expect(
      isPayrailsCheckoutStartResponse({
        checkout_mode: "purchase",
        gateway_params: { publishable_api_key: "pk_test" },
        payrails_gateway_params: null,
      }),
    ).toBe(false);
  });
});

describe("PayrailsService", () => {
  const dropin = {
    mount: vi.fn(),
    unmount: vi.fn(),
  };
  const unsubscribe = vi.fn();
  const handlers = new Map<string, (event?: unknown) => void>();

  beforeEach(() => {
    handlers.clear();
    dropin.mount.mockReset();
    dropin.unmount.mockReset();
    unsubscribe.mockReset();
    vi.mocked(Payrails.init).mockReset();
    vi.mocked(Payrails.init).mockResolvedValue({
      on: (name: string, handler: (event?: unknown) => void) => {
        handlers.set(name, handler);
        return unsubscribe;
      },
      dropin: () => dropin,
    } as unknown as Awaited<ReturnType<typeof Payrails.init>>);
  });

  test("passes payrails_gateway_params through to Payrails.init and mounts the drop-in", async () => {
    const service = new PayrailsService();
    const onSuccess = vi.fn();
    const onFailed = vi.fn();
    const onPending = vi.fn();
    const onSessionExpired = vi.fn();

    await service.mountDropin(gatewayParams, {
      onSuccess,
      onFailed,
      onPending,
      onSessionExpired,
    });

    expect(Payrails.init).toHaveBeenCalledWith(gatewayParams);
    expect(dropin.mount).toHaveBeenCalledWith("#rc-payrails-dropin");

    handlers.get("success")?.();
    expect(onSuccess).toHaveBeenCalledOnce();

    const failedEvent = {
      data: { code: "DECLINED", message: "Card declined" },
    } as PaymentFailedEvent;
    handlers.get("failed")?.(failedEvent);
    expect(onFailed).toHaveBeenCalledWith(failedEvent);

    handlers.get("pending")?.();
    expect(onPending).toHaveBeenCalledOnce();

    handlers.get("sessionExpired")?.();
    expect(onSessionExpired).toHaveBeenCalledOnce();
  });

  test("does not mount when the client is torn down before init resolves", async () => {
    let resolveInit: (
      client: Awaited<ReturnType<typeof Payrails.init>>,
    ) => void = () => {};
    vi.mocked(Payrails.init).mockReturnValue(
      new Promise((resolve) => {
        resolveInit = resolve;
      }),
    );

    const service = new PayrailsService();
    const mounting = service.mountDropin(gatewayParams, {
      onSuccess: vi.fn(),
      onFailed: vi.fn(),
      onPending: vi.fn(),
      onSessionExpired: vi.fn(),
    });
    service.unmount();
    resolveInit({
      on: () => unsubscribe,
      dropin: () => dropin,
    } as unknown as Awaited<ReturnType<typeof Payrails.init>>);
    await mounting;

    expect(dropin.mount).not.toHaveBeenCalled();
  });

  test("unmounts the drop-in and unsubscribes its events", async () => {
    const service = new PayrailsService();
    await service.mountDropin(gatewayParams, {
      onSuccess: vi.fn(),
      onFailed: vi.fn(),
      onPending: vi.fn(),
      onSessionExpired: vi.fn(),
    });

    service.unmount();

    expect(dropin.unmount).toHaveBeenCalledOnce();
    expect(unsubscribe).toHaveBeenCalledTimes(4);
  });
});
