import type { Package, PurchaseMetadata, PurchaseOption } from "./offerings";

import type { BrandingAppearance } from "./branding";
import type { CustomTranslations } from "../ui/localization/translator";

/**
 * Contextual information specific to workflow purchases.
 * @internal
 */
export interface WorkflowPurchaseContext {
  /**
   * The step ID from the workflow where the purchase is being initiated.
   */
  stepId?: string;
}

/**
 * Parameters used to customise the purchase flow when invoking the `.purchase` method.
 * @public
 */
export interface PurchaseParams {
  /**
   * The package you want to purchase. Obtained from {@link Purchases.getOfferings}.
   */
  rcPackage: Package;
  /**
   * The option to be used for this purchase. If not specified or null the default one will be used.
   */
  purchaseOption?: PurchaseOption | null;
  /**
   * The HTML element where the billing view should be added. If undefined, a new div will be created at the root of the page and appended to the body.
   */
  htmlTarget?: HTMLElement;
  /**
   * The email of the user. If undefined, RevenueCat will ask the customer for their email.
   */
  customerEmail?: string;

  /**
   * Workflow-specific context for this purchase.
   * @internal
   */
  workflowPurchaseContext?: WorkflowPurchaseContext;

  /**
   * The locale to use for the purchase flow. If not specified, English will be used
   */
  selectedLocale?: string;

  /**
   * The default locale to use if the selectedLocale is not available.
   * Defaults to english.
   */
  defaultLocale?: string;

  /**
   * The purchase metadata to be passed to the backend.
   * Any information provided here will be propagated to the payment gateway and
   * to the RC transaction as metadata.
   */
  metadata?: PurchaseMetadata;

  /**
   * If set to true, the SDK will skip the success page and automatically
   * continue the flow once the purchase completes successfully.
   * Defaults to `false`.
   */
  skipSuccessPage?: boolean;

  /**
   * Defines an optional override for the default branding appearance.
   *
   * This property is used internally at RevenueCat to handle dynamic themes such
   * as the ones coming from the Web Paywall Links. We suggest to use the Dashboard
   * configuration to set up the appearance since a configuration passed as parameter
   * using this method might break in future releases of `purchases-js`.
   *
   * @internal
   */
  brandingAppearanceOverride?: BrandingAppearance;

  /**
   * @internal
   * @experimental
   * Allows the user to override the default labels used in the purchase flow.
   *
   */
  labelsOverride?: CustomTranslations;

  /**
   * Link to the terms and conditions that should be shown in the checkout footer.
   *
   * @internal
   */
  termsAndConditionsUrl?: string;
}
