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
