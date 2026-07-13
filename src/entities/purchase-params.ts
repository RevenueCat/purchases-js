import type { Package, PurchaseMetadata, PurchaseOption } from "./offerings";

import type { BrandingAppearance } from "./branding";
import type { CustomTranslations } from "../ui/localization/translator";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

/**
 * Typed Meta Conversions API fields within an attribution metadata basket.
 * All fields are optional — only include what the browser context provides.
 * @internal
 */
export type MetaCapiAttributionMetadata = {
  fbp?: string;
  fbc?: string;
  client_user_agent?: string;
  event_source_url?: string;
};

/**
 * An open basket of attribution signals forwarded to the backend.
 * Typed Meta CAPI fields are available for known signals; any additional
 * key/value pairs are accepted and passed through opaquely.
 * @internal
 */
export type AttributionMetadata = Record<string, JsonValue> &
  MetaCapiAttributionMetadata;

/**
 * Meta canonical event identifiers returned in a successful purchase response,
 * used for deduplication on the CAPI side.
 * @internal
 */
export type MetaCanonicalAttributionMetadata = {
  canonical_event_id: string;
  canonical_event_name: string;
  workflow_event_id?: string;
  workflow_event_name?: string | null;
};

/**
 * Attribution metadata returned from the backend after a successful purchase.
 * Keyed by provider name; typed Meta fields are available under `meta`.
 * @internal
 */
export type PurchaseResponseAttributionMetadata = Record<string, unknown> & {
  meta?: MetaCanonicalAttributionMetadata;
};

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
   * Attribution signals to forward to the backend for CAPI event matching.
   * @internal
   */
  attributionMetadata?: AttributionMetadata;

  /**
   * The paywall ID from which this purchase originated, if applicable.
   * @internal
   */
  paywallId?: string;

  /**
   * The paywall session ID from which this purchase originated, if applicable.
   * @internal
   */
  paywallSessionId?: string;

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
   * @experimental
   * If set to true, the Web Billing checkout will show a discount input code field.
   */
  showDiscountCodeField?: boolean;

  /**
   * @experimental
   * Initial discount code to apply in the RevenueCat Web Billing or Stripe
   * Billing checkout.
   * This is useful when the code originated outside of the checkout UI,
   * for example from a URL parameter.
   */
  discountCode?: string;

  /**
   * @experimental
   * Called when the applied discount code changes in the Web Billing checkout.
   * This can be used by host applications to keep external state, such as the URL,
   * in sync with the checkout.
   */
  onDiscountCodeChanged?: (discountCode: string | null) => void;

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
