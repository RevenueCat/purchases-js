import type {
  Package,
  PurchaseMetadata,
  PurchaseOption,
} from "../../entities/offerings";
import type { BrandingInfoResponse } from "../../networking/responses/branding-response";
import type { Purchases } from "../../main";
import type { IEventsTracker } from "../../behavioural-events/events-tracker";
import type {
  OperationSessionSuccessfulResult,
  PurchaseFlowError,
  PurchaseOperationHelper,
} from "../../helpers/purchase-operation-helper";
import type {
  CustomTranslations,
  Translator,
} from "../localization/translator";

export interface ExpressPurchaseButtonProps {
  customerEmail: string | undefined;
  appUserId: string;
  rcPackage: Package;
  purchaseOption: PurchaseOption;
  metadata: PurchaseMetadata | undefined;
  brandingInfo: BrandingInfoResponse | null;
  purchases: Purchases;
  eventsTracker: IEventsTracker;
  purchaseOperationHelper: PurchaseOperationHelper;
  customTranslations?: CustomTranslations;
  translator: Translator;
  onFinished: (operationResult: OperationSessionSuccessfulResult) => void;
  onError: (error: PurchaseFlowError) => void;
  onReady?: () => void;
}
