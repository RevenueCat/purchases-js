import type { PurchasesConfig } from "../entities/purchases-config";
import type { Purchases } from "../main";
import type { Backend } from "../networking/backend";
import type { BillingWrapper } from "./billing-wrapper";

export interface BillingProviderContext {
  backend: Backend;
  apiKey: string;
  getAppUserId: () => string | undefined;
  getIsAnonymous: () => boolean;
}

export interface PurchasesFactory {
  validateApiKey(apiKey: string): void;
  createPurchases(config: PurchasesConfig): Purchases;
  createBillingWrapper(context: BillingProviderContext): BillingWrapper;
}

let purchasesFactory: PurchasesFactory | undefined;

/** @internal Register before configuring Purchases. */
export function registerPurchasesFactory(factory: PurchasesFactory): void {
  purchasesFactory = factory;
}

/** @internal */
export function getPurchasesFactory(): PurchasesFactory | undefined {
  return purchasesFactory;
}

/** @internal Test-only reset. */
export function resetPurchasesFactory(): void {
  purchasesFactory = undefined;
}
