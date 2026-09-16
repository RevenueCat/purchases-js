import { Purchases as CorePurchases } from "../../src/main";
import { isAmazonApiKey } from "../../src/helpers/api-key-helper";
import { ErrorCode, PurchasesError } from "../../src/entities/errors";
import type { PurchasesConfig } from "../../src/entities/purchases-config";
import type { HttpConfig } from "../../src/entities/http-config";
import type { FlagsConfig } from "../../src/entities/flags-config";
import type { RestorePurchasesResult } from "../../src/entities/restore-purchases-result";
import type { SyncPurchasesResult } from "../../src/entities/sync-purchases-result";
import { defaultHttpConfig } from "../../src/entities/http-config";
import { defaultFlagsConfig } from "../../src/entities/flags-config";
import { registerPurchasesFactory } from "../../src/helpers/purchases-factory";
import { AmazonBillingWrapper } from "./amazon/amazon-billing-wrapper";

export class Purchases extends CorePurchases {
  /** @internal */
  constructor(config: PurchasesConfig) {
    super(
      config.apiKey,
      config.appUserId,
      config.httpConfig ?? defaultHttpConfig,
      config.flags ?? defaultFlagsConfig,
      config.subscriberToken,
      config.brandingAppearanceOverride,
      config.context,
      config.trace_id,
    );
  }

  // CorePurchases creates this subclass through the registered factory, but its
  // static methods are typed to return CorePurchases. Redeclare them here so
  // Vega callers retain access to the Vega-only APIs.
  static configure(config: PurchasesConfig): Purchases;
  static configure(
    apiKey: string,
    appUserId: string,
    httpConfig?: HttpConfig,
    flags?: FlagsConfig,
  ): Purchases;
  static configure(
    configOrApiKey: PurchasesConfig | string,
    appUserId?: string,
    httpConfig?: HttpConfig,
    flags?: FlagsConfig,
  ): Purchases {
    const purchases =
      typeof configOrApiKey === "string"
        ? super.configure(configOrApiKey, appUserId!, httpConfig, flags)
        : super.configure(configOrApiKey);
    return purchases as Purchases;
  }

  static getSharedInstance(): Purchases {
    return super.getSharedInstance() as Purchases;
  }

  /**
   * Restores purchases made with the current store account for the current user.
   * This method posts all purchases associated with the current Amazon Appstore account to RevenueCat and associates
   * them with the current `appUserId`. If a receipt is already used by an existing user, the current `appUserId`
   * may be aliased with that user's `appUserId` depending on your app's Restore Behavior. For more information,
   * refer to https://www.revenuecat.com/docs/projects/restore-behavior
   *
   * This method also sends expired subscriptions and consumed one-time purchases to RevenueCat.
   *
   * You shouldn't use this method if you have your own account system. In that case, restoration is provided by
   * your app passing the same `appUserId` that was used for the original purchase.
   *
   * @warning This operation can take a relatively long time when the user has many purchases.
   * @returns The {@link CustomerInfo} with restored purchases.
   * @throws {@link PurchasesError} if restoration fails.
   */
  public async restorePurchases(): Promise<RestorePurchasesResult> {
    return await this.unwrappedBillingWrapper().restorePurchases(
      this._appUserId,
    );
  }

  /**
   * Sends purchases made with the current store account to the RevenueCat backend.
   * Call this when using your own purchase implementation whenever a sync is needed, such as while migrating
   * existing users to RevenueCat. It resolves when all purchases have been synced successfully or when there are
   * no purchases to sync; otherwise it throws with the first error encountered.
   *
   * This method also sends expired subscriptions and consumed one-time purchases to RevenueCat.
   *
   * @warning This operation can take a relatively long time when the user has many purchases.
   * @returns The {@link CustomerInfo} after purchases have been synced.
   * @throws {@link PurchasesError} if syncing fails.
   */
  public async syncPurchases(): Promise<SyncPurchasesResult> {
    return await this.unwrappedBillingWrapper().syncPurchases(this._appUserId);
  }
}

registerPurchasesFactory({
  validateApiKey(apiKey) {
    if (!isAmazonApiKey(apiKey)) {
      throw new PurchasesError(
        ErrorCode.ConfigurationError,
        "Vega applications must be configured with an Amazon Appstore API key.",
      );
    }
  },
  createPurchases: (config) => new Purchases(config),
  createBillingWrapper: ({ backend, apiKey, getAppUserId, getIsAnonymous }) =>
    new AmazonBillingWrapper(backend, apiKey, getAppUserId, getIsAnonymous),
});

export * from "../../src/main";
export type { RestorePurchasesResult, SyncPurchasesResult };
