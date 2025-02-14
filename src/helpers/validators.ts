import { Logger } from "./logger";
import { ErrorCode, PurchasesError } from "../entities/errors";

export function validateCurrency(currency?: string) {
  if (currency && !currency.match(/^[A-Z]{3}$/)) {
    const errorMessage = `Currency code ${currency} is not valid. Please provide a valid ISO 4217 currency code.`;
    Logger.errorLog(errorMessage);
    throw new PurchasesError(ErrorCode.ConfigurationError, errorMessage);
  }
}
