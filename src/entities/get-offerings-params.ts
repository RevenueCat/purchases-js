/**
 * Parameters for the {@link Purchases.getOfferings} method.
 * @public
 */
export enum OfferingKeyword {
  Current = "current",
}

export interface GetOfferingsParams {
  /**
   * The currency code in ISO 4217 to fetch the offerings for.
   * If not specified, the default currency will be used.
   */
  readonly currency?: string;

  /**
   * The identifier of the offering to fetch.
   * Can be a string identifier or one of the predefined keywords.
   */
  readonly offeringIdentifier?: string | OfferingKeyword;
}
