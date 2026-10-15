import {
  Payrails,
  type PaymentFailedEvent,
  type Payrails as PayrailsClient,
} from "@payrails/web-sdk";
import type { PayrailsGatewayParams } from "../networking/responses/payrails-gateway-params";

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

    const client: PayrailsClient = await Payrails.init(gatewayParams);
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

    const dropin = client.dropin({});
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
