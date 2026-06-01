import type { Product } from "../entities/offerings";
import type { Backend } from "../networking/backend";
import type { PurchaseResult } from "../entities/purchase-result";
import { generateUUID } from "./uuid-helper";
import type { StoreTransaction } from "../entities/store-transaction";
import { toCustomerInfo } from "../entities/customer-info";

export async function postSimulatedStoreReceipt(
  product: Product,
  backend: Backend,
  appUserId: string,
  paywallId?: string,
): Promise<PurchaseResult> {
  const purchaseDate = new Date();
  const fetchToken = `test_${purchaseDate.getTime()}_${generateUUID()}`;
  const operationSessionId = `test_store_operation_session_${generateUUID()}`;
  const storeTransactionId = fetchToken;

  const storeTransaction: StoreTransaction = {
    storeTransactionId,
    productIdentifier: product.identifier,
    purchaseDate: purchaseDate,
  };

  const subscriberResponse = await backend.postReceipt(
    appUserId,
    product.identifier,
    product.price.currency,
    fetchToken,
    product.presentedOfferingContext,
    "purchase",
    paywallId,
  );

  const customerInfo = toCustomerInfo(subscriberResponse);

  return {
    customerInfo,
    redemptionInfo: null,
    operationSessionId,
    storeTransaction,
  };
}
