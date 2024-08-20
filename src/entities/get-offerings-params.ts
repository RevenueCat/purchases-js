/**
 * Parameters for the {@link Purchases.getOfferings}` method.
 * @public
 */
export interface GetOfferingsParams {
  /**
   * The currency code in ISO 4217 to fetch the offerings for.
   * If not specified, the default currency will be used.
   */
  readonly currency?: string;
}
