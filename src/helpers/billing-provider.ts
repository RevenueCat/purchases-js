import type { Backend } from "../networking/backend";
import type { BillingWrapper } from "./billing-wrapper";

/** Context supplied when a platform package creates its billing implementation.
 *
 * @internal
 */
export interface BillingProviderContext {
  backend: Backend;
  apiKey: string;
  getAppUserId: () => string | undefined;
  getIsAnonymous: () => boolean;
}

/** Internal integration contract, bundled with each platform package.
 *
 * @internal
 */
export interface BillingProvider {
  validateApiKey(apiKey: string): void;
  createBillingWrapper(context: BillingProviderContext): BillingWrapper;
}

let billingProvider: BillingProvider | undefined;

/** Register before configuring Purchases. This state belongs to the package bundle.
 *
 * @internal
 */
export function registerBillingProvider(provider: BillingProvider): void {
  billingProvider = provider;
}

/** @internal */
export function getBillingProvider(): BillingProvider | undefined {
  return billingProvider;
}

/** @internal */
export function resetBillingProvider(): void {
  billingProvider = undefined;
}
