/**
 * Specifies who is responsible for providing app user IDs.
 * @public
 */
export enum AppUserIDProvider {
  /**
   * RevenueCat will automatically generate and manage anonymous user identifiers.
   */
  RevenueCat = "revenueCat",

  /**
   * Your app will provide user identifiers at configure time.
   */
  MyApp = "myApp",
}

/**
 * Parameters for the `Purchases.configure` method.
 * @public
 */
export interface ConfigureAppUserIDParams {
  /**
   * The currency code in ISO 4217 to fetch the offerings for.
   * If not specified, the default currency will be used.
   */
  readonly appUserIDsAreProvidedBy?: AppUserIDProvider;
}

export const defaultConfigureAppUserIDParams = {
  appUserIDsAreProvidedBy: AppUserIDProvider.MyApp,
};
