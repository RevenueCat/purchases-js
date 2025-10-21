import type { CustomerInfo } from "./customer-info";

/**
 * Represents the result of an identify user operation.
 * @public
 */
export interface IdentifyResult {
  /**
   * The customer information after the logIn attempt.
   */
  readonly customerInfo: CustomerInfo;
  /**
   * true if a new user has been registered in the backend,
   * false if the user had already been registered.
   */
  readonly wasCreated: boolean;
}
