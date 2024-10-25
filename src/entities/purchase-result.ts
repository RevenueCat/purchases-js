import { CustomerInfo } from "./customer-info";
import { RedemptionInfo } from "./redemption-info";

export interface PurchaseResult {
  readonly customerInfo: CustomerInfo;
  readonly redemptionInfo: RedemptionInfo | null;
}
