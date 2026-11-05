import type {
  DropinOptions,
  PaymentFailedEvent,
  Payrails as PayrailsClient,
} from "@payrails/web-sdk";
import type * as PayrailsSdk from "@payrails/web-sdk";
import type { PayrailsGatewayParams } from "../networking/responses/payrails-gateway-params";
import { PAYRAILS_CHECKOUT_ENABLED } from "../helpers/constants";

let payrailsSdk: Promise<typeof PayrailsSdk> | null = null;

/**
 * The Payrails SDK attaches a window message listener as soon as it is
 * evaluated, which crashes in environments with a partial `window` such as
 * React Native. Importing it lazily keeps it out of the main bundle, and the
 * flag check lets builds without Payrails drop it entirely.
 */
export function loadPayrailsSdk(): Promise<typeof PayrailsSdk> {
  if (!PAYRAILS_CHECKOUT_ENABLED) {
    return Promise.reject(new Error("Payrails checkout is not enabled"));
  }
  payrailsSdk ??= import("@payrails/web-sdk").catch((error: unknown) => {
    payrailsSdk = null;
    throw error;
  });
  return payrailsSdk;
}

function createPayrailsDropinOptions(
  alwaysStoreInstrument: boolean,
): DropinOptions {
  return {
    paymentMethodsConfiguration: {
      cards: {
        showSingleExpiryDateField: true,
        alwaysStoreInstrument,
      },
      googlePay: {
        alwaysStoreInstrument,
      },
      applePay: {
        alwaysStoreInstrument,
      },
    },
  };
}

export const PAYRAILS_DROPIN_CONTAINER_ID = "rc-payrails-dropin";

export interface PayrailsDropinHandlers {
  onSuccess: () => void;
  onFailed: (event: PaymentFailedEvent) => void;
  onPending: () => void;
  onSessionExpired: () => void;
}

/**
 * Initializes the Payrails client from the backend init body and mounts the
 * drop-in into {@link PAYRAILS_DROPIN_CONTAINER_ID}.
 */
export class PayrailsService {
  private generation = 0;
  private dropin: { unmount: () => void } | null = null;
  private unsubscribe: Array<() => void> = [];

  async mountDropin(
    gatewayParams: PayrailsGatewayParams,
    handlers: PayrailsDropinHandlers,
  ): Promise<void> {
    const generation = ++this.generation;
    this.detach();

    const { Payrails } = await loadPayrailsSdk();
    if (generation !== this.generation) {
      return;
    }

    const client: PayrailsClient = await Payrails.init(
      gatewayParams.init_payload,
    );
    if (generation !== this.generation) {
      return;
    }

    this.unsubscribe = [
      client.on("success", () => {
        handlers.onSuccess();
      }),
      client.on("failed", (event) => {
        handlers.onFailed(event);
      }),
      client.on("pending", () => {
        handlers.onPending();
      }),
      client.on("sessionExpired", () => {
        handlers.onSessionExpired();
      }),
    ];

    const dropin = client.dropin(
      createPayrailsDropinOptions(gatewayParams.always_store_instrument),
    );
    dropin.mount(`#${PAYRAILS_DROPIN_CONTAINER_ID}`);
    this.dropin = dropin;
  }

  unmount(): void {
    this.generation += 1;
    this.detach();
  }

  private detach(): void {
    for (const unsubscribe of this.unsubscribe) {
      unsubscribe();
    }
    this.unsubscribe = [];
    this.dropin?.unmount();
    this.dropin = null;
  }
}
