import {
  PurchaseFlowError,
  PurchaseFlowErrorCode,
} from "./purchase-operation-helper";
import { PurchasesError } from "../entities/errors";

export const normalizeToPurchaseFlowError = (
  e: unknown,
  defaultMessage: string,
): PurchaseFlowError => {
  if (e instanceof PurchaseFlowError) {
    return e;
  } else if (e instanceof PurchasesError) {
    return PurchaseFlowError.fromPurchasesError(
      e,
      PurchaseFlowErrorCode.UnknownError,
    );
  } else {
    return new PurchaseFlowError(
      PurchaseFlowErrorCode.UnknownError,
      defaultMessage,
    );
  }
};
