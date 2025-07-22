/**
 * Represents a transaction made in the store.
 * @public
 */
export interface StoreTransaction {
  /**
   * The unique identifier for the store transaction.
   */
  readonly storeTransactionId: string;

  /**
   * The identifier of the product purchased in the transaction.
   */
  readonly productIdentifier: string;

  /**
   * The date when the transaction was made.
   */
  readonly purchaseDate: Date;
}
