import type { Backend } from "../networking/backend";
import type { BillingWrapper } from "./billing-wrapper";

export interface BillingProviderContext {
  backend: Backend;
  apiKey: string;
  getAppUserId: () => string | undefined;
  getIsAnonymous: () => boolean;
}

export interface BillingProvider {
  validateApiKey(apiKey: string): void;
  createBillingWrapper(context: BillingProviderContext): BillingWrapper;
}

let billingProvider: BillingProvider | undefined;

/** Register before configuring Purchases. */
export function registerBillingProvider(provider: BillingProvider): void {
  billingProvider = provider;
}

export function getBillingProvider(): BillingProvider | undefined {
  return billingProvider;
}

export function resetBillingProvider(): void {
  billingProvider = undefined;
}
