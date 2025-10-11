import type { CustomerInfo } from "./customer-info";

/**
 * Represents the result of a log in operation.
 * @public
 */
export interface LogInResult {
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
