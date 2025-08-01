import type { Product } from "../entities/offerings";
import type { Backend } from "../networking/backend";
import type { PurchaseResult } from "../entities/purchase-result";
import { generateUUID } from "./uuid-helper";
import type { StoreTransaction } from "../entities/store-transaction";
import { toCustomerInfo } from "../entities/customer-info";

export async function postTestStoreReceipt(
  product: Product,
  backend: Backend,
  appUserId: string,
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
    fetchToken,
    product.presentedOfferingContext,
    "purchase",
  );

  const customerInfo = toCustomerInfo(subscriberResponse);

  return {
    customerInfo,
    redemptionInfo: null,
    operationSessionId,
    storeTransaction,
  };
}
