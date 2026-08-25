import { CompleteWorkflowNavigateArgs } from '@revenuecat/purchases-ui-js';
import { CustomVariables } from '@revenuecat/purchases-ui-js';
import { CustomVariableValue } from '@revenuecat/purchases-ui-js';
import { PackageInfo } from '@revenuecat/purchases-ui-js';
import { PaywallData } from '@revenuecat/purchases-ui-js';
import { UIConfig } from '@revenuecat/purchases-ui-js';
import { WalletButtonRender } from '@revenuecat/purchases-ui-js';
import { WalletButtonTheme } from '@revenuecat/purchases-ui-js';

/* Excluded from this release type: AttributionMetadata */

declare enum BackendErrorCode {
    BackendInvalidPlatform = 7000,
    BackendInvalidEmail = 7012,
    BackendStoreProblem = 7101,
    BackendCannotTransferPurchase = 7102,
    BackendInvalidReceiptToken = 7103,
    BackendInvalidAppStoreSharedSecret = 7104,
    BackendInvalidPaymentModeOrIntroPriceNotProvided = 7105,
    BackendProductIdForGoogleReceiptNotProvided = 7106,
    BackendInvalidPlayStoreCredentials = 7107,
    BackendInternalServerError = 7110,
    BackendEmptyAppUserId = 7220,
    BackendInvalidAuthToken = 7224,
    BackendInvalidAPIKey = 7225,
    BackendBadRequest = 7226,
    BackendPlayStoreQuotaExceeded = 7229,
    BackendPlayStoreInvalidPackageName = 7230,
    BackendPlayStoreGenericError = 7231,
    BackendUserIneligibleForPromoOffer = 7232,
    BackendInvalidAppleSubscriptionKey = 7234,
    BackendSubscriberNotFound = 7259,
    BackendInvalidSubscriberAttributes = 7263,
    BackendInvalidSubscriberAttributesBody = 7264,
    BackendProductIDsMalformed = 7662,
    BackendAlreadySubscribedError = 7772,
    BackendPaymentGatewayGenericError = 7773,
    BackendOfferNotFound = 7814,
    BackendNoMXRecordsFound = 7834,
    BackendInvalidOperationSession = 7877,
    BackendPurchaseCannotBeCompleted = 7878,
    BackendEmailIsRequired = 7879,
    BackendGatewaySetupErrorStripeTaxNotActive = 7898,
    BackendGatewaySetupErrorInvalidTaxOriginAddress = 7899,
    BackendGatewaySetupErrorMissingRequiredPermission = 7900,
    BackendGatewaySetupErrorSandboxModeOnly = 7901,
    BackendInvalidPaddleAPIKey = 7967
}

/**
 * @public
 * `BrandingAppearance` defines the appearance settings
 *  of an app's branding configuration.
 */
export declare interface BrandingAppearance {
    color_buttons_primary: string;
    color_buttons_primary_text?: string | null;
    color_accent: string;
    color_error: string;
    color_product_info_bg: string;
    color_form_bg: string;
    color_page_bg: string;
    font: string;
    shapes: "default" | "rectangle" | "rounded" | "pill";
    show_product_description: boolean;
}

declare interface BuildVariablesPerPackageOptions {
    selectedLocale?: string;
    fallbackLocale?: string;
    customTranslations?: CustomTranslations;
    translator?: Translator;
}

/**
 * Type containing all information regarding the customer.
 * @public
 */
export declare interface CustomerInfo {
    /**
     * Entitlements attached to this customer info.
     */
    readonly entitlements: EntitlementInfos;
    /**
     * Map of productIds to expiration dates.
     */
    readonly allExpirationDatesByProduct: {
        [productIdentifier: string]: Date | null;
    };
    /**
     * Map of productIds to purchase dates.
     */
    readonly allPurchaseDatesByProduct: {
        [productIdentifier: string]: Date | null;
    };
    /**
     * Set of active subscription product identifiers.
     */
    readonly activeSubscriptions: Set<string>;
    /**
     * URL to manage the active subscription of the user.
     * If this user has an active Web Billing subscription, a link to the management page.
     * If this user has an active iOS subscription, this will point to the App Store.
     * If the user has an active Play Store subscription it will point there.
     * If there are no active subscriptions it will be null.
     */
    readonly managementURL: string | null;
    /**
     * Date when this info was requested.
     */
    readonly requestDate: Date;
    /**
     * The date this user was first seen in RevenueCat.
     */
    readonly firstSeenDate: Date;
    /**
     * The purchase date for the version of the application when the user bought the app.
     * Use this for grandfathering users when migrating to subscriptions. This can be null.
     */
    readonly originalPurchaseDate: Date | null;
    /**
     * The original App User Id recorded for this user.
     */
    readonly originalAppUserId: string;
    /**
     * The list of non-subscription transactions made by the user.
     */
    readonly nonSubscriptionTransactions: NonSubscriptionTransaction[];
    /**
     * Dictionary of all subscription product identifiers and their subscription info.
     */
    readonly subscriptionsByProductIdentifier: {
        [productId: string]: SubscriptionInfo;
    };
}

/**
 * Custom translations to be used in the purchase flow.
 * This class allows you to override the default translations used in the purchase flow.
 * The main level keys are the locale codes and the values are objects with the same keys as the default translations.
 * @public
 * @example
 * This example will override the default translation for the email step title in the English locale.
 * ```typescript
 * const customTranslations = {
 *  en: {
 *    "email_entry_page.email_step_title": "Billing email",
 *   }
 * }
 * ```
 */
declare type CustomTranslations = {
    [langKey: string]: {
        [translationKey in LocalizationKeys]?: string;
    };
};

export { CustomVariables }

export { CustomVariableValue }

/* Excluded from this release type: DiscountPhase */

declare type EmptyString = "";

/**
 * This object gives you access to all the information about the status
 * of a user's entitlements.
 * @public
 */
export declare interface EntitlementInfo {
    /**
     * The entitlement identifier configured in the RevenueCat dashboard.
     */
    readonly identifier: string;
    /**
     * True if the user has access to the entitlement.
     */
    readonly isActive: boolean;
    /**
     * True if the underlying subscription is set to renew at the end of the
     * billing period (expirationDate). Will always be True if entitlement is
     * for lifetime access.
     */
    readonly willRenew: boolean;
    /**
     * The store where this entitlement was unlocked from.
     */
    readonly store: Store;
    /**
     * The latest purchase or renewal date for the entitlement.
     */
    readonly latestPurchaseDate: Date;
    /**
     * The first date this entitlement was purchased.
     */
    readonly originalPurchaseDate: Date;
    /**
     * The expiration date for the entitlement, can be `null` for lifetime
     * access. If the {@link EntitlementInfo.periodType} is `trial`, this is the trial
     * expiration date.
     */
    readonly expirationDate: Date | null;
    /**
     * The product identifier that unlocked this entitlement.
     */
    readonly productIdentifier: string;
    /**
     * The base plan identifier that unlocked this entitlement (For Google Play subs only).
     */
    readonly productPlanIdentifier: string | null;
    /**
     * The date an unsubscribe was detected. Can be `null`.
     * Note: Entitlement may still be active even if user has unsubscribed.
     * Check the {@link EntitlementInfo.isActive} property.
     */
    readonly unsubscribeDetectedAt: Date | null;
    /**
     * The date a billing issue was detected. Can be `null` if there is
     * no billing issue or an issue has been resolved. Note: Entitlement may
     * still be active even if there is a billing issue.
     * Check the `isActive` property.
     */
    readonly billingIssueDetectedAt: Date | null;
    /**
     * False if this entitlement is unlocked via a production purchase.
     */
    readonly isSandbox: boolean;
    /**
     * The last period type this entitlement was in.
     */
    readonly periodType: PeriodType;
    /**
     * Use this property to determine whether a purchase was made by the
     * current user or shared to them by a family member. This can be useful
     * for onboarding users who have had an entitlement shared with them,
     * but might not be entirely aware of the benefits they now have.
     */
    readonly ownershipType: OwnershipType | null;
}

/**
 * Contains all the entitlements associated to the user.
 * @public
 */
export declare interface EntitlementInfos {
    /**
     * Map of all {@link EntitlementInfo} objects (active and inactive) keyed by
     * entitlement identifier.
     */
    readonly all: {
        [entitlementId: string]: EntitlementInfo;
    };
    /**
     * Dictionary of active {@link EntitlementInfo} keyed by entitlement identifier.
     */
    readonly active: {
        [entitlementId: string]: EntitlementInfo;
    };
}

/**
 * Error codes for the Purchases SDK.
 * @public
 */
export declare enum ErrorCode {
    UnknownError = 0,
    UserCancelledError = 1,
    StoreProblemError = 2,
    PurchaseNotAllowedError = 3,
    PurchaseInvalidError = 4,
    ProductNotAvailableForPurchaseError = 5,
    ProductAlreadyPurchasedError = 6,
    ReceiptAlreadyInUseError = 7,
    InvalidReceiptError = 8,
    MissingReceiptFileError = 9,
    NetworkError = 10,
    InvalidCredentialsError = 11,
    UnexpectedBackendResponseError = 12,
    InvalidAppUserIdError = 14,
    OperationAlreadyInProgressError = 15,
    UnknownBackendError = 16,
    InvalidAppleSubscriptionKeyError = 17,
    IneligibleError = 18,
    InsufficientPermissionsError = 19,
    PaymentPendingError = 20,
    InvalidSubscriberAttributesError = 21,
    LogOutWithAnonymousUserError = 22,
    ConfigurationError = 23,
    UnsupportedError = 24,
    EmptySubscriberAttributesError = 25,
    CustomerInfoError = 28,
    SignatureVerificationError = 36,
    InvalidEmailError = 38,
    TestStoreSimulatedPurchaseError = 42
}

declare interface EventProperties {
    [key: string]: EventPropertyValue;
}

declare type EventPropertySingleValue = string | number | boolean;

declare type EventPropertyValue = null | EventPropertySingleValue | Array<EventPropertyValue>;

/**
 * Callback to be called when the express purchase button is ready to be updated.
 * @experimental
 * @public
 */
export declare interface ExpressPurchaseButtonUpdater {
    /**
     * Updates the purchase option of the express purchase button.
     */
    updatePurchase: (pkg: Package, purchaseOption?: PurchaseOption) => void;
}

/**
 * Flags used to enable or disable certain features in the sdk.
 * @public
 */
export declare interface FlagsConfig {
    /**
     * If set to true, the SDK will automatically collect UTM parameters and store them as at the time of purchase.
     * @defaultValue true
     */
    autoCollectUTMAsMetadata?: boolean;
    /**
     * If set to true, the SDK will automatically collect analytics events.
     * @defaultValue true
     */
    collectAnalyticsEvents?: boolean;
    /**
     * If set to true, the checkout back button will be hidden.
     * @defaultValue false
     */
    hideBackButton?: boolean;
    /**
     * If set to true, the SDK injects the branding app icon as an
     * `apple-touch-icon` link tag so it appears in the Apple Pay sheet.
     * Best effort is made to not overwrite an existing `apple-touch-icon` on the page.
     * @defaultValue false
     */
    applePayBrandingLogoEnabled?: boolean;
    /* Excluded from this release type: rcSource */
    /* Excluded from this release type: forceEnableWalletMethods */
    /**
     * Determines when the store module (e.g. Stripe) is loaded.
     * - `"configuration"`: Preloaded when the SDK is configured (default).
     * - `"purchase_start"`: Loaded on demand when a purchase is started.
     * @defaultValue "configuration"
     * @deprecated we always load stripe only when needed
     */
    storeLoadTime?: StoreLoadTime;
}

/**
 * Parameters for the {@link Purchases.getOfferings} method.
 * @public
 */
export declare interface GetOfferingsParams {
    /**
     * The currency code in ISO 4217 to fetch the offerings for.
     * If not specified, the default currency will be used.
     */
    readonly currency?: string;
    /**
     * The identifier of the offering to fetch.
     * Can be a string identifier or one of the predefined keywords.
     */
    readonly offeringIdentifier?: string | OfferingKeyword;
    /* Excluded from this release type: discountCode */
}

/**
 * Parameters used to customise the http requests executed by purchases-js.
 * @public
 */
export declare interface HttpConfig {
    /**
     * Additional headers to include in all HTTP requests.
     */
    additionalHeaders?: Record<string, string>;
    /**
     * Set this property to your proxy URL *only* if you've received a proxy
     * key value from your RevenueCat contact. This value should never end with
     * a trailing slash.
     */
    proxyURL?: string;
    /* Excluded from this release type: eventsURL */
}

/**
 * Represents the result of an identify user operation.
 * @public
 */
export declare interface IdentifyResult {
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

declare type JsonPrimitive = string | number | boolean | null;

declare type JsonValue = JsonPrimitive | JsonValue[] | {
    [key: string]: JsonValue;
};

declare class LocaleTranslations {
    readonly labels: Record<string, string>;
    readonly localeKey: string;
    constructor(labels: Record<string, string> | undefined, localeKey: string);
    private replaceVariables;
    translate(labelId: LocalizationKeys | EmptyString, variables?: TranslationVariables): string | undefined;
    translatePeriod(amount: number, period: PeriodUnit, options?: TranslatePeriodOptions): string | undefined;
    translatePeriodUnit(period: PeriodUnit, options?: TranslatePeriodOptions): string | undefined;
    translatePeriodFrequency(amount: number, period: PeriodUnit, options?: TranslateFrequencyOptions): string | undefined;
    translateDate(date: Date, options?: Intl.DateTimeFormatOptions): string | undefined;
}

declare enum LocalizationKeys {
    PeriodsWeek = "periods.week",
    PeriodsMonth = "periods.month",
    PeriodsYear = "periods.year",
    PeriodsDay = "periods.day",
    PeriodsWeekShort = "periods.weekShort",
    PeriodsMonthShort = "periods.monthShort",
    PeriodsYearShort = "periods.yearShort",
    PeriodsDayShort = "periods.dayShort",
    PeriodsLifetime = "periods.lifetime",
    PeriodsWeekPlural = "periods.weekPlural",
    PeriodsMonthPlural = "periods.monthPlural",
    PeriodsYearPlural = "periods.yearPlural",
    PeriodsDayPlural = "periods.dayPlural",
    PeriodsWeekFrequency = "periods.weekFrequency",
    PeriodsMonthFrequency = "periods.monthFrequency",
    PeriodsYearFrequency = "periods.yearFrequency",
    PeriodsDayFrequency = "periods.dayFrequency",
    PeriodsPerWeekFrequency = "periods.perWeekFrequency",
    PeriodsPerMonthFrequency = "periods.perMonthFrequency",
    PeriodsPerYearFrequency = "periods.perYearFrequency",
    PeriodsPerDayFrequency = "periods.perDayFrequency",
    PeriodsUnknownFrequency = "periods.unknownFrequency",
    PeriodsWeekFrequencyPlural = "periods.weekFrequencyPlural",
    PeriodsMonthFrequencyPlural = "periods.monthFrequencyPlural",
    PeriodsYearFrequencyPlural = "periods.yearFrequencyPlural",
    PeriodsDayFrequencyPlural = "periods.dayFrequencyPlural",
    ProductInfoProductTitle = "product_info.product_title",
    ProductInfoProductDescription = "product_info.product_description",
    ProductInfoProductPrice = "product_info.product_price",
    ProductInfoFreeTrialDuration = "product_info.free_trial_duration",
    ProductInfoPriceAfterFreeTrial = "product_info.price_after_free_trial",
    ProductInfoIntroPricePhaseAfterTrial = "product_info.intro_price_phase_after_trial",
    ProductInfoIntroPricePhasePaidOnce = "product_info.intro_price_phase_paid_once",
    ProductInfoIntroPricePhase = "product_info.intro_price_phase",
    ProductInfoPriceAfterIntroPrice = "product_info.price_after_intro_price",
    ProductInfoAfterTrial = "product_info.after_trial",
    ProductInfoAfter = "product_info.after",
    ProductInfoPriceTotalDueToday = "product_info.total_due_today",
    ProductInfoSubscribeTo = "product_info.subscribe_to",
    ProductInfoRenewalFrequency = "product_info.renewal_frequency",
    ProductInfoContinuesUntilCancelled = "product_info.continues_until_cancelled",
    ProductInfoCancelAnytime = "product_info.cancel_anytime",
    PaymentEntryPagePaymentStepTitle = "payment_entry_page.payment_step_title",
    PaymentEntryPageTrialSubscriptionTermsInfo = "payment_entry_page.trial_subscription_terms_info",
    PaymentEntryPageSubscriptionTermsInfo = "payment_entry_page.subscription_terms_info",
    PaymentEntryPageOtpTermsInfo = "payment_entry_page.otp_terms_info",
    PaymentEntryPageTermsLinkLabel = "payment_entry_page.terms_link_label",
    PaymentEntryPageCheckoutConsentAgreement = "payment_entry_page.checkout_consent_agreement",
    PaymentEntryPageCheckoutConsentTermsOfService = "payment_entry_page.checkout_consent_terms_of_service",
    PaymentEntryPageSubscriptionInfo = "payment_entry_page.subscription_info",
    PaymentEntryPageButtonPay = "payment_entry_page.button_pay",
    PaymentEntryPageButtonStartTrial = "payment_entry_page.button_start_trial",
    PaymentEntryPageButtonWithPrice = "payment_entry_page.button_with_price",
    PaymentEntryPageButtonPaymentMethod = "payment_entry_page.button_payment_method",
    PaymentEntryPageExpressCheckoutDivider = "payment_entry_page.express_checkout_divider",
    SuccessPagePurchaseSuccessful = "success_page.purchase_successful",
    SuccessPageButtonClose = "success_page.button_close",
    LoadingPageProcessingPayment = "loading_page.processing_payment",
    LoadingPageKeepPageOpen = "loading_page.keep_page_open",
    ErrorPageCloseButtonTitle = "error_page.close_button_title",
    ErrorPageIfErrorPersists = "error_page.if_error_persists",
    ErrorPageTroubleAccessing = "error_page.trouble_accessing",
    ErrorPageErrorTitleAlreadySubscribed = "error_page.error_title_already_subscribed",
    ErrorPageErrorTitleAlreadyPurchased = "error_page.error_title_already_purchased",
    ErrorPageErrorTitleOtherErrors = "error_page.error_title_other_errors",
    ErrorPageErrorTitleStripeTaxNotActive = "error_page.error_title_stripe_tax_not_active",
    ErrorPageErrorTitleStripeInvalidTaxOriginAddress = "error_page.error_title_stripe_invalid_tax_origin_address",
    ErrorPageErrorTitleStripeMissingRequiredPermission = "error_page.error_title_stripe_missing_required_permission",
    ErrorPageErrorMessageAlreadySubscribed = "error_page.error_message_already_subscribed",
    ErrorPageErrorMessageAlreadyPurchased = "error_page.error_message_already_purchased",
    ErrorPageErrorMessageMissingEmailError = "error_page.error_message_missing_email_error",
    ErrorPageErrorMessageInvalidEmailError = "error_page.error_message_invalid_email_error",
    ErrorPageErrorMessageNetworkError = "error_page.error_message_network_error",
    ErrorPageErrorMessageErrorChargingPayment = "error_page.error_message_error_charging_payment",
    ErrorPageErrorMessageErrorSettingUpPurchase = "error_page.error_message_error_setting_up_purchase",
    ErrorPageErrorMessageUnknownError = "error_page.error_message_unknown_error",
    ErrorPageErrorMessageInvalidTaxLocation = "error_page.error_message_invalid_tax_location",
    ErrorPageErrorMessageStripeTaxNotActive = "error_page.error_message_stripe_tax_not_active",
    ErrorPageErrorMessageStripeInvalidTaxOriginAddress = "error_page.error_message_stripe_invalid_tax_origin_address",
    ErrorPageErrorMessageStripeMissingRequiredPermission = "error_page.error_message_stripe_missing_required_permission",
    ErrorPageErrorMessageOnlyInSandbox = "error_page.error_only_in_sandbox",
    ErrorButtonTryAgain = "error_page.button_try_again",
    ErrorButtonClose = "error_page.button_close",
    PaywallVariablesPricePerPeriod = "paywall_variables.price_per_period",
    PaywallVariablesSubRelativeDiscount = "paywall_variables.sub_relative_discount",
    PaywallVariablesTotalPriceAndPerMonth = "paywall_variables.total_price_and_per_month",
    PricingDropdownShowDetails = "pricing_dropdown.show_details",
    PricingDropdownHideDetails = "pricing_dropdown.hide_details",
    PricingDropdownAddPromoCode = "pricing_dropdown.add_promo_code",
    DiscountInputLabel = "discount_input.label",
    PricingTotalExcludingTax = "pricing_table.total_excluding_tax",
    PricingTableTrialEnds = "pricing_table.trial_ends",
    PricingTableTotalDueToday = "pricing_table.total_due_today",
    PricingTableSubtotal = "pricing_table.subtotal",
    PricingTableDiscount = "pricing_table.discount",
    PricingTableTax = "pricing_table.tax",
    PricingTableEnterBillingAddressToCalculate = "pricing_table.enter_billing_address_to_calculate",
    PricingTableEnterStateOrPostalCodeToCalculate = "pricing_table.enter_state_or_postal_code_to_calculate",
    PricingTableEnterPostalCodeToCalculate = "pricing_table.enter_postal_code_to_calculate",
    NavbarHeaderDetails = "navbar_header.details",
    NavbarBackButton = "navbar_header.back_button",
    PriceUpdateTitle = "price_update.title",
    PriceUpdateBaseMessage = "price_update.base_message",
    PriceUpdateTrialMessage = "price_update.trial_message",
    ApplePayFreeTrial = "apple_pay.free_trial",
    UpgradeProductInfoChangeSubscriptionTitle = "upgrade_product_info.change_subscription_title",
    UpgradeProductInfoUpgradeSubscriptionTitle = "upgrade_product_info.upgrade_subscription_title",
    UpgradeProductInfoTaxEstimated = "upgrade_product_info.tax_estimated",
    UpgradeProductInfoEstimatedAtNextRenewal = "upgrade_product_info.estimated_at_next_renewal",
    UpgradeProductInfoCalculatedLater = "upgrade_product_info.calculated_later",
    PlanCardCurrent = "plan_card.current",
    PlanCardNew = "plan_card.new",
    RefundForUnusedTimeTitle = "refund_for_unused_time.title",
    RefundForUnusedTimeMessage = "refund_for_unused_time.message",
    CreditForUnusedTimeTitle = "credit_for_unused_time.title",
    CreditForUnusedTimeMessage = "credit_for_unused_time.message",
    UpgradeConfirmPageTitle = "upgrade_confirm_page.title",
    UpgradeConfirmPageSubtitleImmediate = "upgrade_confirm_page.subtitle_immediate",
    UpgradeConfirmPageSubtitleDeferred = "upgrade_confirm_page.subtitle_deferred",
    UpgradeConfirmPageConfirming = "upgrade_confirm_page.confirming",
    UpgradeConfirmPageConfirmSchedule = "upgrade_confirm_page.confirm_schedule",
    UpgradeConfirmPageConfirmUpgrade = "upgrade_confirm_page.confirm_upgrade",
    UpgradeConfirmPageConfirmUpgradeWithPrice = "upgrade_confirm_page.confirm_upgrade_with_price",
    UpgradeConfirmPageOnFile = "upgrade_confirm_page.on_file",
    UpgradeConfirmPageEmail = "upgrade_confirm_page.email",
    UpgradeConfirmPagePaymentMethod = "upgrade_confirm_page.payment_method",
    UpgradeConfirmPageBillingAddress = "upgrade_confirm_page.billing_address"
}

/**
 * Custom log handler function type. Allows you to handle SDK log messages
 * with your own logging system.
 * @param logLevel - The log level of the message
 * @param message - The log message
 * @public
 */
export declare type LogHandler = (logLevel: LogLevel, message: string) => void;

/**
 * Possible levels to log in the console.
 * @public
 */
export declare enum LogLevel {
    /**
     * No logs will be shown in the console.
     */
    Silent = 0,
    /**
     * Only errors will be shown in the console.
     */
    Error = 1,
    /**
     * Only warnings and errors will be shown in the console.
     */
    Warn = 2,
    /**
     * Only info, warnings, and errors will be shown in the console.
     */
    Info = 3,
    /**
     * Debug, info, warnings, and errors will be shown in the console.
     */
    Debug = 4,
    /**
     * All logs will be shown in the console.
     */
    Verbose = 5
}

/* Excluded from this release type: MetaCanonicalAttributionMetadata */

/* Excluded from this release type: MetaCapiAttributionMetadata */

/**
 * Represents a possible option to purchase a non-subscription product.
 * @public
 */
export declare interface NonSubscriptionOption extends PurchaseOption {
    /**
     * The base price for the product.
     */
    readonly basePrice: Price;
    /* Excluded from this release type: discount */
}

/**
 * Information that represents a non-subscription purchase made by a user.
 * @public
 */
export declare interface NonSubscriptionTransaction {
    /**
     * The unique identifier for the transaction created by RevenueCat.
     */
    readonly transactionIdentifier: string;
    /**
     * The product identifier.
     */
    readonly productIdentifier: string;
    /**
     * The date that the store charged the user’s account.
     */
    readonly purchaseDate: Date;
    /**
     * The unique identifier for the transaction created by the Store.
     */
    readonly storeTransactionId: string | null;
    /**
     * The {@link Store} where the transaction was made.
     */
    readonly store: Store;
}

/**
 * An offering is a collection of {@link Package} available for the user to purchase.
 * For more info see https://docs.revenuecat.com/docs/entitlements
 * @public
 */
export declare interface Offering {
    /**
     * Unique identifier defined in RevenueCat dashboard.
     */
    readonly identifier: string;
    /**
     * Offering description defined in RevenueCat dashboard.
     */
    readonly serverDescription: string;
    /**
     * Offering metadata defined in RevenueCat dashboard.
     */
    readonly metadata: {
        [key: string]: unknown;
    } | null;
    /**
     * The default web checkout URL for this offering, if available.
     */
    readonly webCheckoutURL?: string | null;
    /**
     * A map of all the packages available for purchase keyed by package ID.
     */
    readonly packagesById: {
        [key: string]: Package;
    };
    /**
     * A list of all the packages available for purchase.
     */
    readonly availablePackages: Package[];
    /**
     * Lifetime package type configured in the RevenueCat dashboard, if available.
     */
    readonly lifetime: Package | null;
    /**
     * Annual package type configured in the RevenueCat dashboard, if available.
     */
    readonly annual: Package | null;
    /**
     * Six month package type configured in the RevenueCat dashboard, if available.
     */
    readonly sixMonth: Package | null;
    /**
     * Three month package type configured in the RevenueCat dashboard, if available.
     */
    readonly threeMonth: Package | null;
    /**
     * Two month package type configured in the RevenueCat dashboard, if available.
     */
    readonly twoMonth: Package | null;
    /**
     * Monthly package type configured in the RevenueCat dashboard, if available.
     */
    readonly monthly: Package | null;
    /**
     * Weekly package type configured in the RevenueCat dashboard, if available.
     */
    readonly weekly: Package | null;
    /**
     * Whether this offering has an attached paywall configured in the RevenueCat dashboard.
     */
    readonly hasPaywall: boolean;
    /* Excluded from this release type: paywallComponents */
    /* Excluded from this release type: uiConfig */
}

/**
 * Keywords for identifying specific offerings in the {@link Purchases.getOfferings} method.
 * @public
 */
export declare enum OfferingKeyword {
    /**
     * The current offering.
     */
    Current = "current"
}

/**
 * This class contains all the offerings configured in RevenueCat dashboard.
 * For more info see https://docs.revenuecat.com/docs/entitlements
 * @public
 */
export declare interface Offerings {
    /**
     * Dictionary containing all {@link Offering} objects, keyed by their identifier.
     */
    readonly all: {
        [offeringId: string]: Offering;
    };
    /**
     * Current offering configured in the RevenueCat dashboard.
     * It can be `null` if no current offering is configured or if a specific offering
     * was requested that is not the current one.
     */
    readonly current: Offering | null;
}

/**
 * The types used to describe whether a transaction was purchased by the user,
 * or is available to them through Family Sharing.
 * @public
 */
export declare type OwnershipType = "PURCHASED" | "FAMILY_SHARED" | "UNKNOWN";

/**
 * Contains information about the product available for the user to purchase.
 * For more info see https://docs.revenuecat.com/docs/entitlements
 * @public
 */
export declare interface Package {
    /**
     * Unique identifier for this package. Can be one a predefined package type or a custom one.
     */
    readonly identifier: string;
    /**
     * The {@link Product} assigned to this package.
     * @deprecated - Use {@link Package.webBillingProduct} instead.
     */
    readonly rcBillingProduct: Product;
    /**
     * The {@link Product} assigned to this package.
     */
    readonly webBillingProduct: Product;
    /**
     * The web checkout URL for this package, if available.
     */
    readonly webCheckoutURL?: string | null;
    /**
     * The type of package.
     */
    readonly packageType: PackageType;
}

/**
 * Enumeration of all possible Package types.
 * @public
 */
export declare enum PackageType {
    /**
     * A package that was defined with an unrecognized RC identifier.
     */
    Unknown = "unknown",
    /**
     * A package that was defined with a custom identifier.
     */
    Custom = "custom",
    /**
     * A package configured with the predefined lifetime identifier.
     */
    Lifetime = "$rc_lifetime",
    /**
     * A package configured with the predefined annual identifier.
     */
    Annual = "$rc_annual",
    /**
     * A package configured with the predefined six month identifier.
     */
    SixMonth = "$rc_six_month",
    /**
     * A package configured with the predefined three month identifier.
     */
    ThreeMonth = "$rc_three_month",
    /**
     * A package configured with the predefined two month identifier.
     */
    TwoMonth = "$rc_two_month",
    /**
     * A package configured with the predefined monthly identifier.
     */
    Monthly = "$rc_monthly",
    /**
     * A package configured with the predefined weekly identifier.
     */
    Weekly = "$rc_weekly"
}

/**
 * Listener for paywall purchase lifecycle events.
 * @public
 */
export declare type PaywallListener = PurchaseListener;

/**
 * Represents the result of a purchase operation initiated from a paywall.
 * @public
 */
export declare interface PaywallPurchaseResult extends PurchaseResult {
    /**
     * The package selected by the customer while interacting with the paywall.
     */
    selectedPackage: Package;
}

/**
 * Represents a period of time.
 * @public
 */
export declare interface Period {
    /**
     * The number of units in the period.
     */
    number: number;
    /**
     * The unit of time.
     */
    unit: PeriodUnit;
}

/**
 * Supported period types for an entitlement.
 * - "normal" If the entitlement is not under an introductory or trial period.
 * - "intro" If the entitlement is under an introductory period.
 * - "trial" If the entitlement is under a trial period.
 * - "prepaid" If the entitlement is a prepaid entitlement. Only for Google Play subscriptions.
 * @public
 */
export declare type PeriodType = "normal" | "intro" | "trial" | "prepaid";

/**
 * Represents a unit of time.
 * @public
 */
export declare enum PeriodUnit {
    Year = "year",
    Month = "month",
    Week = "week",
    Day = "day"
}

/**
 * PlatformInfo is an interface that represents the information about the platform.
 * Used by RevenueCat Hybrid SDKs to provide information about the platform.
 * @public
 * @experimental
 */
export declare interface PlatformInfo {
    /**
     * The flavor of the SDK.
     */
    readonly flavor: string;
    /**
     * The version of the hybrid SDK.
     */
    readonly version: string;
}

/**
 * Contains data about the context in which an offering was presented.
 * @public
 */
export declare interface PresentedOfferingContext {
    /**
     * The identifier of the offering used to obtain this object.
     */
    readonly offeringIdentifier: string;
    /**
     * The targeting context used to obtain this object.
     */
    readonly targetingContext: TargetingContext | null;
    /**
     * If obtained this information from a placement,
     * the identifier of the placement.
     */
    readonly placementIdentifier: string | null;
}

/**
 * Parameters for the {@link Purchases.presentExpressPurchaseButton} method.
 *
 * @example
 * ```ts
 * const offerings = await purchases.getOfferings();
 * const pkg = offerings.current?.availablePackages[0];
 * const htmlTarget = document.getElementById("express-purchase-button");
 * const fallbackButton = document.getElementById("checkout-button");
 *
 * if (pkg && htmlTarget) {
 *   let expressButtonUpdater: ExpressPurchaseButtonUpdater | undefined;
 *
 *   void purchases.presentExpressPurchaseButton({
 *     rcPackage: pkg,
 *     htmlTarget,
 *     onButtonReady: (updater, walletsAvailable) => {
 *       expressButtonUpdater = updater;
 *       htmlTarget.hidden = !walletsAvailable;
 *
 *       if (fallbackButton) {
 *         fallbackButton.hidden = walletsAvailable;
 *       }
 *     },
 *   });
 *
 *   // If the customer selects a different package later, update the button
 *   // instead of rendering a new one.
 *   function onSelectedPackageChanged(nextPackage: Package) {
 *     expressButtonUpdater?.updatePurchase(nextPackage);
 *   }
 * }
 * ```
 *
 * @experimental
 * @public
 */
export declare interface PresentExpressPurchaseButtonParams {
    /**
     * The package you want to purchase. Obtained from {@link Purchases.getOfferings}.
     */
    rcPackage: Package;
    /**
     * The HTML element where the express purchase button should be rendered.
     */
    htmlTarget: HTMLElement;
    /**
     * The option to be used for this purchase. If not specified or null the default one will be used.
     */
    purchaseOption?: PurchaseOption | null;
    /**
     * The email of the user. If undefined, RevenueCat will ask the customer for their email.
     */
    customerEmail?: string;
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
    /* Excluded from this release type: labelsOverride */
    /**
     * Callback to be called when the express purchase button is ready to be clicked.
     */
    onButtonReady?: (updater: ExpressPurchaseButtonUpdater, walletsAvailable: boolean) => void;
    /**
     * Optional listener for purchase lifecycle events.
     */
    listener?: PurchaseListener;
    /**
     * Theme for the Stripe wallet button appearance.
     * Matches Apple Pay button styles: 'black', 'white', or 'white-outline'
     * Defaults to "black".
     */
    walletButtonTheme?: WalletButtonTheme;
}

/**
 * Parameters for the {@link Purchases.presentPaywall} method.
 * @public
 */
export declare interface PresentPaywallParams {
    /**
     * The identifier of the offering to fetch the paywall for.
     * Can be a string identifier or one of the predefined keywords.
     */
    readonly offering?: Offering;
    /**
     * The target element where the paywall will be rendered.
     * The paywall will create a full-screen overlay if null.
     */
    readonly htmlTarget?: HTMLElement;
    /**
     * The target element where the checkout flow will be rendered.
     * The checkout flow will create a full-screen overlay if null.
     */
    readonly purchaseHtmlTarget?: HTMLElement;
    /**
     * The email of the customer starting the purchase.
     * If passed the checkout flow will not ask for it to the customer.
     */
    readonly customerEmail?: string;
    /**
     * The purchase metadata to be passed to the backend when a purchase is started
     * from the paywall.
     * Any information provided here will be propagated to the payment gateway and
     * to the RC transaction as metadata.
     */
    readonly metadata?: PurchaseMetadata;
    /**
     * Overrides the branding appearance for the purchase started from this
     * paywall. Only the provided values are overridden. These values take
     * precedence over the override passed to `Purchases.configure()`.
     *
     * For Stripe Checkout, this customizes the supported mobile wallet experience.
     * The Stripe-hosted fallback opened through "Pay another way" remains light and
     * cannot currently be customized.
     */
    readonly brandingAppearanceOverride?: Partial<BrandingAppearance>;
    /**
     * @experimental
     * If set to true, the Web Billing checkout shown from the paywall
     * will display a discount input code field.
     */
    readonly showDiscountCodeField?: boolean;
    /**
     * @experimental
     * Initial discount code to apply to the checkout when one already exists
     * outside of the paywall UI, for example in the hosting page's URL.
     */
    readonly discountCode?: string;
    /**
     * @experimental
     * Called when the applied discount code changes in the checkout shown from
     * the paywall. This can be used to sync host state such as URL parameters.
     */
    readonly onDiscountCodeChanged?: (discountCode: string | null) => void;
    /**
     * Callback to be called when the paywall tries to navigate to an external URL.
     *
     * Markdown text links keep their native browser navigation. Use this callback
     * for side effects or to customize how button-driven URL actions are handled.
     */
    readonly onNavigateToUrl?: (url: string) => void;
    /* Excluded from this release type: onCompleteWorkflowNavigate */
    /**
     * Callback to be called when the paywall tries to navigate back.
     *
     * Example:
     * ```ts
     * onBack: (closePaywall) => {
     *   // You may want to keep the paywall open while showing a confirmation
     *   // modal or logging analytics, then close it if the user confirms.
     *   // If you want the back action to dismiss the paywall immediately,
     *   // call closePaywall() right away.
     *   closePaywall();
     * }
     * ```
     */
    readonly onBack?: (closePaywall: () => void) => void;
    /**
     * Callback to be called when the paywall tries to visit the customer center.
     */
    readonly onVisitCustomerCenter?: () => void;
    /**
     * Callback called when an error that won't close the paywall occurs.
     * For example, a retryable error during the purchase process.
     * @deprecated Use `listener.onPurchaseError` instead.
     */
    readonly onPurchaseError?: (error: Error) => void;
    /**
     * Optional listener for paywall purchase lifecycle events.
     */
    readonly listener?: PaywallListener;
    /**
     * The locale to use for the paywall and the checkout flow.
     */
    readonly selectedLocale?: string;
    /**
     * Whether to hide back buttons in the paywall. Defaults to false.
     */
    readonly hideBackButtons?: boolean;
    /**
     * Custom variables to pass to the paywall at runtime, overriding defaults set
     * in the RevenueCat dashboard.
     *
     * Variables must be defined in the dashboard first. Reference them in paywall
     * text using the `custom.` prefix (e.g. `{{ custom.player_name }}`).
     *
     * @example
     * ```ts
     * presentPaywall({
     *   customVariables: {
     *     player_name: CustomVariableValue.string('Ada'),
     *     level: CustomVariableValue.number(42),
     *     is_premium: CustomVariableValue.boolean(true),
     *   },
     * });
     * ```
     */
    readonly customVariables?: CustomVariables;
    /* Excluded from this release type: productChangeInfo */
}

/**
 * Price information for a product.
 * @public
 */
export declare interface Price {
    /**
     * Price in cents of the currency.
     * @deprecated - Use {@link Price.amountMicros} instead.
     */
    readonly amount: number;
    /**
     * Price in micro-units of the currency. For example, $9.99 is represented as 9990000.
     */
    readonly amountMicros: number;
    /**
     * Returns ISO 4217 currency code for price.
     * For example, if price is specified in British pounds sterling,
     * currency is "GBP".
     * If currency code cannot be determined, currency symbol is returned.
     */
    readonly currency: string;
    /**
     * Formatted price string including price and currency.
     */
    readonly formattedPrice: string;
}

/**
 * Represents the price and duration information for a phase of the purchase option.
 * @public
 */
export declare interface PricingPhase {
    /**
     * The duration of the phase in ISO 8601 format.
     */
    readonly periodDuration: string | null;
    /**
     * The duration of the phase as a {@link Period}.
     */
    readonly period: Period | null;
    /**
     * The price for the purchase option.
     * Null in case of trials.
     */
    readonly price: Price | null;
    /**
     * The number of cycles this option's price repeats.
     * I.e. 2 subscription cycles, 0 if not applicable.
     */
    readonly cycleCount: number;
    /**
     * The approximated price converted to weekly rate, based on the period information.
     * Null in case of trials.
     */
    readonly pricePerWeek: Price | null;
    /**
     * The approximated price converted to monthly rate, based on the period information.
     * Null in case of trials.
     */
    readonly pricePerMonth: Price | null;
    /**
     * The approximated price converted to yearly rate, based on the period information.
     * Null in case of trials.
     */
    readonly pricePerYear: Price | null;
}

/**
 * Represents product's listing details.
 * @public
 */
export declare interface Product {
    /**
     * The product ID.
     */
    readonly identifier: string;
    /**
     * Name of the product.
     * @deprecated - Use {@link Product.title} instead.
     */
    readonly displayName: string;
    /**
     * The title of the product as configured in the RevenueCat dashboard.
     */
    readonly title: string;
    /**
     * The description of the product as configured in the RevenueCat dashboard.
     */
    readonly description: string | null;
    /**
     * Price of the product. This will match the default option's base phase price
     * in subscriptions or the price in non-subscriptions.
     * @deprecated Use {@link Product.price}.
     */
    readonly currentPrice: Price;
    /**
     * The type of product.
     */
    readonly productType: ProductType;
    /**
     * The period duration for a subscription product. This will match the default
     * option's base phase period duration. Null for non-subscriptions.
     */
    readonly normalPeriodDuration: string | null;
    /**
     * The offering ID used to obtain this product.
     * @deprecated - Use {@link Product.presentedOfferingContext} instead.
     */
    readonly presentedOfferingIdentifier: string;
    /**
     * The context from which this product was obtained.
     */
    readonly presentedOfferingContext: PresentedOfferingContext;
    /**
     * The default purchase option for this product.
     */
    readonly defaultPurchaseOption: PurchaseOption;
    /**
     * The default subscription option for this product.
     * Null if no subscription options are available like in the case of consumables and non-consumables.
     */
    readonly defaultSubscriptionOption: SubscriptionOption | null;
    /**
     * A dictionary with all the possible subscription options available for this
     * product. Each key contains the key to be used when executing a purchase.
     * Will be empty for non-subscriptions
     *
     * If retrieved through getOfferings the offers are only the ones the customer is
     * entitled to.
     */
    readonly subscriptionOptions: {
        [optionId: string]: SubscriptionOption;
    };
    /**
     * The default non-subscription option for this product.
     * Null in the case of subscriptions.
     */
    readonly defaultNonSubscriptionOption: NonSubscriptionOption | null;
    /**
     * Base price (after any offers) for subscriptions, price for non-subscriptions.
     */
    readonly price: Price;
    /**
     * Base subscription duration.
     * Null for non-subscriptions.
     * Convenience accessor for the default subscription option's base phase period.
     */
    readonly period: Period | null;
    /**
     * Free trial phase information for subscriptions.
     * Null for non-subscriptions or when no free trial is available.
     * Convenience accessor for defaultSubscriptionOption?.trial.
     */
    readonly freeTrialPhase: PricingPhase | null;
    /**
     * Introductory price phase information for subscriptions.
     * Null for non-subscriptions or when no introductory price is available.
     * Convenience accessor for defaultSubscriptionOption?.introPrice.
     */
    readonly introPricePhase: PricingPhase | null;
    /* Excluded from this release type: discountPhase */
}

/* Excluded from this release type: ProductChangeInfo */

/* Excluded from this release type: ProductChangeResult */

/**
 * Possible product types
 * @public
 */
export declare enum ProductType {
    /**
     * A product that is an auto-renewing subscription.
     */
    Subscription = "subscription",
    /**
     * A product that does not renew and can be consumed to be purchased again.
     */
    Consumable = "consumable",
    /**
     * A product that does not renew and can only be purchased once.
     */
    NonConsumable = "non_consumable"
}

declare class PurchaseFlowError extends Error {
    readonly errorCode: PurchaseFlowErrorCode;
    readonly underlyingErrorMessage?: string | null | undefined;
    readonly purchasesErrorCode?: ErrorCode | undefined;
    readonly extra?: PurchasesErrorExtra | undefined;
    readonly displayPurchaseFlowErrorCode?: boolean | undefined;
    constructor(errorCode: PurchaseFlowErrorCode, message?: string, underlyingErrorMessage?: string | null | undefined, purchasesErrorCode?: ErrorCode | undefined, extra?: PurchasesErrorExtra | undefined, displayPurchaseFlowErrorCode?: boolean | undefined);
    getErrorCode(): number;
    static fromPurchasesError(e: PurchasesError, defaultFlowErrorCode: PurchaseFlowErrorCode, displayPurchaseFlowErrorCode?: boolean): PurchaseFlowError;
    static fromBackendErrorCode(backendErrorCode: BackendErrorCode | undefined): PurchaseFlowErrorCode | null;
}

declare enum PurchaseFlowErrorCode {
    ErrorSettingUpPurchase = 0,
    ErrorChargingPayment = 1,
    UnknownError = 2,
    NetworkError = 3,
    MissingEmailError = 4,
    AlreadyPurchasedError = 5,
    StripeTaxNotActive = 6,
    StripeInvalidTaxOriginAddress = 7,
    StripeMissingRequiredPermission = 8,
    InvalidPaddleAPIKeyError = 9
}

/**
 * Listener for purchase lifecycle events.
 * @public
 */
export declare interface PurchaseListener {
    /**
     * Called when a purchase flow is about to start for the given package.
     */
    onPurchaseStarted?: (rcPackage: Package) => void;
    /**
     * Callback called when an error that won't close the paywall occurs.
     * For example, a retryable error during the purchase process.
     */
    onPurchaseError?: (error: Error) => void;
    /**
     * Called when the user cancels the purchase flow.
     */
    onPurchaseCancelled?: () => void;
}

/**
 * Metadata that can be passed to the backend when making a purchase.
 * They will propagate to the payment gateway (i.e. Stripe) and to RevenueCat.
 * @public
 */
export declare type PurchaseMetadata = Record<string, string | null>;

/**
 * Represents a possible option to purchase a product.
 * @public
 */
export declare interface PurchaseOption {
    /**
     * The unique id for a purchase option
     */
    readonly id: string;
    /**
     * The public price id for this subscription option.
     */
    readonly priceId: string;
}

/**
 * Parameters used to customise the purchase flow when invoking the `.purchase` method.
 * @public
 */
export declare interface PurchaseParams {
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
    /* Excluded from this release type: workflowPurchaseContext */
    /* Excluded from this release type: attributionMetadata */
    /* Excluded from this release type: paywallId */
    /* Excluded from this release type: paywallSessionId */
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
     * Initial discount code to display as applied in the Web Billing checkout.
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
     * Overrides the Dashboard branding appearance for this purchase.
     * Only the provided values are overridden; all other values keep their
     * Dashboard configuration.
     *
     * For Stripe Checkout, this customizes the supported mobile wallet experience.
     * The Stripe-hosted fallback opened through "Pay another way" remains light and
     * cannot currently be customized.
     */
    brandingAppearanceOverride?: Partial<BrandingAppearance>;
    /* Excluded from this release type: labelsOverride */
    /**
     * Link to the terms and conditions that should be shown in the checkout footer.
     */
    termsAndConditionsUrl?: string;
    /* Excluded from this release type: productChangeInfo */
}

/* Excluded from this release type: PurchaseResponseAttributionMetadata */

/**
 * Represents the result of a purchase operation.
 * @public
 */
export declare interface PurchaseResult {
    /**
     * The customer information after the purchase.
     */
    readonly customerInfo: CustomerInfo;
    /**
     * The redemption information after the purchase if available.
     */
    readonly redemptionInfo: RedemptionInfo | null;
    /**
     * The operation session id of the purchase.
     *
     * For Amazon Store purchases, this will contain the Amazon Store's receipt ID from the purchase.
     */
    readonly operationSessionId: string;
    /**
     * The store transaction associated with the purchase.
     */
    readonly storeTransaction: StoreTransaction;
    /* Excluded from this release type: attributionMetadata */
    /* Excluded from this release type: productChange */
}

/**
 * Entry point for Purchases SDK. It should be instantiated as soon as your
 * app is started. Only one instance of Purchases should be instantiated
 * at a time!
 * @public
 */
export declare class Purchases {
    /* Excluded from this release type: _API_KEY */
    /* Excluded from this release type: _appUserId */
    /* Excluded from this release type: _brandingInfo */
    /* Excluded from this release type: _loadingResourcesPromise */
    /* Excluded from this release type: _flags */
    /* Excluded from this release type: _subscriberToken */
    /* Excluded from this release type: _brandingAppearanceOverride */
    /* Excluded from this release type: _context */
    /* Excluded from this release type: backend */
    /* Excluded from this release type: purchaseOperationHelper */
    /* Excluded from this release type: eventsTracker */
    /* Excluded from this release type: _platformInfo */
    /* Excluded from this release type: inMemoryCache */
    /* Excluded from this release type: amazonBillingWrapper */
    /* Excluded from this release type: instance */
    /**
     * Set the log level. Logs of the given level and below will be printed
     * in the console.
     * Default is `LogLevel.Silent` so no logs will be printed in the console.
     * @param logLevel - LogLevel to set.
     */
    static setLogLevel(logLevel: LogLevel): void;
    /**
     * Set a custom log handler to handle SDK log messages with your own logging system.
     * If set to null, the SDK will use the default console logging.
     * @param handler - LogHandler function or null to use default console logging.
     */
    static setLogHandler(handler: LogHandler | null): void;
    /**
     * Meant to be used by RevenueCat hybrids SDKS only.
     * @experimental
     * */
    static setPlatformInfo(platformInfo: PlatformInfo): void;
    /* Excluded from this release type: buildVariablesPerPackage */
    /* Excluded from this release type: buildInfoPerPackage */
    /* Excluded from this release type: getPlatformInfo */
    /**
     * Get the singleton instance of Purchases. It's preferred to use the instance
     * obtained from the `configure` method when possible.
     * @throws {@link UninitializedPurchasesError} if the instance has not been initialized yet.
         */
     static getSharedInstance(): Purchases;
     /**
      * Returns whether the Purchases SDK is configured or not.
      */
     static isConfigured(): boolean;
     /**
      * Configures the Purchases SDK. This should be called as soon as your app
      * has a unique user id for your user. You should only call this once, and
      * keep the returned instance around for use throughout your application.
      * @param config - Configuration object containing apiKey, appUserId, and optional configurations.
      * @throws {@link PurchasesError} if the API key or user id are invalid.
          */
      static configure(config: PurchasesConfig): Purchases;
      /**
       * Legacy method to configure the Purchases SDK. This method is deprecated and will be removed in a future version.
       * @deprecated - please use the `configure` method with a {@link PurchasesConfig} object instead.
       * @param apiKey - RevenueCat API Key. Can be obtained from the RevenueCat dashboard.
       * @param appUserId - Your unique id for identifying the user.
       * @param httpConfig - Advanced http configuration to customise the SDK usage {@link HttpConfig}.
       * @param flags - Advanced functionality configuration {@link FlagsConfig}.
       * @throws {@link PurchasesError} if the API key or user id are invalid.
           */
       static configure(apiKey: string, appUserId: string, httpConfig?: HttpConfig, flags?: FlagsConfig): Purchases;
       private static configureInternal;
       private static validateConfig;
       /**
        * Loads and caches some optional data in the Purchases SDK.
        * Currently only fetching branding information.
        * You can call this method after configuring the SDK to speed
        * up the first call to {@link Purchases.purchase}.
        */
       preload(): Promise<void>;
       /* Excluded from this release type: fetchAndCacheBrandingInfo */
       /* Excluded from this release type: syncApplePayWebsiteIcon */
       /* Excluded from this release type: hasLoadedResources */
       /* Excluded from this release type: __constructor */
       /**
        * Renders an RC Paywall and allows the user to purchase from it using Web Billing.
        * @param paywallParams - The parameters object to customise the paywall render. Check {@link PresentPaywallParams}
        * @returns Promise<PurchaseResult>
        */
       presentPaywall(paywallParams: PresentPaywallParams): Promise<PaywallPurchaseResult>;
       /**
        * Fetch the configured offerings for this user. You can configure these
        * in the RevenueCat dashboard.
        * @param params - The parameters object to customise the offerings fetch. Check {@link GetOfferingsParams}
        */
       getOfferings(params?: GetOfferingsParams): Promise<Offerings>;
       /**
        * Retrieves a specific offering by a placement identifier.
        * For more info see https://www.revenuecat.com/docs/tools/targeting
        * @param placementIdentifier - The placement identifier to retrieve the offering for.
        * @param params - The parameters object to customise the offerings fetch. Check {@link GetOfferingsParams}
        */
       getCurrentOfferingForPlacement(placementIdentifier: string, params?: GetOfferingsParams): Promise<Offering | null>;
       private findOfferingById;
       private getAllOfferings;
       private fetchProductsForOfferings;
       /**
        * Convenience method to check whether a user is entitled to a specific
        * entitlement. This will use {@link Purchases.getCustomerInfo} under the hood.
        * @param entitlementIdentifier - The entitlement identifier you want to check.
        * @returns Whether the user is entitled to the specified entitlement
        * @throws {@link PurchasesError} if there is an error while fetching the customer info.
            * @see {@link Purchases.getCustomerInfo}
            */
        isEntitledTo(entitlementIdentifier: string): Promise<boolean>;
        /**
         * Method to perform a purchase for a given package. You can obtain the
         * package from {@link Purchases.getOfferings}. This method will present the purchase
         * form on your site, using the given HTML element as the mount point, if
         * provided, or as a modal if not.
         * @deprecated - please use .purchase
         * @param rcPackage - The package you want to purchase. Obtained from {@link Purchases.getOfferings}.
         * @param customerEmail - The email of the user. If undefined, RevenueCat will ask the customer for their email.
         * @param htmlTarget - The HTML element where the billing view should be added. If undefined, a new div will be created at the root of the page and appended to the body.
         * @returns a Promise for the customer info after the purchase is completed successfully.
         * @throws {@link PurchasesError} if there is an error while performing the purchase. If the {@link PurchasesError.errorCode} is {@link ErrorCode.UserCancelledError}, the user cancelled the purchase.
             */
         purchasePackage(rcPackage: Package, customerEmail?: string, htmlTarget?: HTMLElement): Promise<PurchaseResult>;
         /**
          * Restores purchases made with the current store account for the current user.
          * This method posts all purchases associated with the current Amazon Appstore account to RevenueCat and associates
          * them with the current `appUserId`. If a receipt is already used by an existing user, the current `appUserId`
          * may be aliased with that user's `appUserId` depending on your app's Restore Behavior. For more information,
          * refer to https://www.revenuecat.com/docs/projects/restore-behavior
          *
          * This method also sends expired subscriptions and consumed one-time purchases to RevenueCat.
          *
          * You shouldn't use this method if you have your own account system. In that case, restoration is provided by
          * your app passing the same `appUserId` that was used for the original purchase.
          *
          * Currently only supported on the Amazon Store when configured with an Amazon API key.
          *
          * @warning This operation can take a relatively long time when the user has many purchases.
          * @returns The {@link CustomerInfo} with restored purchases.
          * @throws {@link PurchasesError} if the SDK is not configured with an Amazon Appstore API key or restoration fails.
              */
          restorePurchases(): Promise<RestorePurchasesResult>;
          /**
           * Sends purchases made with the current store account to the RevenueCat backend.
           * Call this when using your own purchase implementation whenever a sync is needed, such as while migrating
           * existing users to RevenueCat. It resolves when all purchases have been synced successfully or when there are
           * no purchases to sync; otherwise it throws with the first error encountered.
           *
           * This method also sends expired subscriptions and consumed one-time purchases to RevenueCat.
           *
           * Currently only supported on the Amazon Store when configured with an Amazon API key.
           *
           * @warning This operation can take a relatively long time when the user has many purchases.
           * @returns The {@link CustomerInfo} after purchases have been synced.
           * @throws {@link PurchasesError} if the SDK is not configured with an Amazon Appstore API key or syncing fails.
               */
           syncPurchases(): Promise<SyncPurchasesResult>;
           /**
            * Renders an Express Purchase button for the supported wallets (Apple Pay/Google Pay).
            * When clicked it uses the wallet UI to execute the purchase instead of
            * the checkout flow that would be shown with `.purchase`.
            * @param params - The parameters object to customise the purchase flow. Check {@link PresentExpressPurchaseButtonParams}
            * @returns Promise<PurchaseResult>
            */
           presentExpressPurchaseButton(params: PresentExpressPurchaseButtonParams): Promise<PurchaseResult>;
           /* Excluded from this release type: getWalletButtonRender */
           /**
            * Method to perform a purchase for a given package. You can obtain the
            * package from {@link Purchases.getOfferings}. This method will present the purchase
            * form on your site, using the given HTML element as the mount point, if
            * provided, or as a modal if not.
            *
            * When {@link PurchaseParams.productChangeInfo} is set with a subscriber token,
            * checkout starts in product-change mode: if the backend can change the
            * existing subscription, an upgrade-confirm page is shown; otherwise the
            * same checkout session continues as a normal purchase.
            *
            * @param params - The parameters object to customise the purchase flow. Check {@link PurchaseParams}
            * @returns a Promise for the customer and redemption info after the purchase is completed successfully.
            * @throws {@link PurchasesError} if there is an error while performing the purchase. If the {@link PurchasesError.errorCode} is {@link ErrorCode.UserCancelledError}, the user cancelled the purchase.
                */
            purchase(params: PurchaseParams): Promise<PurchaseResult>;
            private performStripePurchase;
            private performWebBillingPurchase;
            private performPaddlePurchase;
            /**
             * Uses htmlTarget if provided. Otherwise, looks for an element with id "rcb-ui-root".
             * If no element is found, creates a new div with className "rcb-ui-root".
             */
            private resolveHTMLTarget;
            private createCheckoutOnCloseHandler;
            private shouldHideCheckoutBackButton;
            private createCheckoutOnFinishedHandler;
            private createCheckoutOnErrorHandler;
            /* Excluded from this release type: _isConfiguredWithSimulatedStore */
            /* Excluded from this release type: _shouldForceEnableWalletMethods */
            /* Excluded from this release type: _postSimulatedStoreReceipt */
            /**
             * Gets latest available {@link CustomerInfo}.
             * @returns The latest {@link CustomerInfo}.
             * @throws {@link PurchasesError} if there is an error while fetching the customer info.
                 */
             getCustomerInfo(): Promise<CustomerInfo>;
             /**
              * Gets the current app user id.
              */
             getAppUserId(): string;
             /**
              * Sets attributes for the current user. Attributes are useful for storing additional, structured information on a customer that can be used elsewhere in the system.
              * For example, you could store your customer's email address or additional system identifiers through the applicable reserved attributes, or store arbitrary facts like onboarding survey responses, feature usage, or other dimensions as custom attributes.
              *
              * Note: Unlike our mobile SDKs, the web SDK does not cache or retry sending attributes if the request fails. If the request fails, the attributes will not be saved and you will need to retry the operation.
              *
              * @param attributes - A dictionary of attributes to set for the current user.
              * @throws {@link PurchasesError} if there is an error while setting the attributes or if the customer doesn't exist.
                  */
              setAttributes(attributes: {
                  [key: string | ReservedCustomerAttribute]: string | null;
              }): Promise<void>;
              /**
               * Change the current app user id. Returns the customer info for the new
               * user id.
               * @param newAppUserId - The user id to change to.
               */
              changeUser(newAppUserId: string): Promise<CustomerInfo>;
              /**
               * Identifies the current user ID with the provided appUserId, as long as the
               * previous user ID is an anonymous user ID. This will create an alias
               * between the two user ids in RevenueCat and replace the current user ID used.
               * If the old user ID is not anonymous, this method will change the current
               * user ID to the given appUserId without creating an alias.
               * @returns The customer info for the new user ID.
               * @throws {@link PurchasesError} if there is an error while performing the aliasing or fetching the customer info.
                   * @param appUserId - The new user ID to identify the current user as.
                   * @experimental
                   */
               identifyUser(appUserId: string): Promise<IdentifyResult>;
               /**
                * Resolves {@link PurchaseParams.productChangeInfo} into the product-change
                * context passed to the checkout UI, or undefined when the purchase should
                * proceed as a normal purchase (no info, no token, or non-Web Billing key).
                */
               private resolveProductChange;
               /**
                * Rejects anything shaped like a RevenueCat API key so a secret or public
                * key is never sent (or exposed) where a subscriber token belongs.
                */
               private validateSubscriberToken;
               private replaceUserId;
               /* Excluded from this release type: logMissingProductIds */
               /**
                * @returns Whether the SDK is using a sandbox API Key.
                */
               isSandbox(): boolean;
               /**
                * @returns Whether the current user is anonymous.
                */
               isAnonymous(): boolean;
               /**
                * Fetches the virtual currencies for the current subscriber.
                *
                * @returns {Promise<VirtualCurrencies>} A VirtualCurrencies object containing the subscriber's virtual currencies.
                */
               getVirtualCurrencies(): Promise<VirtualCurrencies>;
               /**
                * The currently cached {@link VirtualCurrencies} if one is available.
                * This value will remain null until virtual currencies have been fetched at
                * least once with {@link Purchases.getVirtualCurrencies} or an equivalent function.
                *
                * @returns {VirtualCurrencies | null} A {@link VirtualCurrencies} object containing the subscriber's virtual currencies,
                * or null if no cached data is available.
                */
               getCachedVirtualCurrencies(): VirtualCurrencies | null;
               /**
                * Invalidates the cache for virtual currencies.
                *
                * This is useful for cases where a virtual currency's balance might have been updated
                * in a different part of your system, like if you decreased a user's balance from the user spending a virtual currency,
                * or if you increased the balance from your backend using the server APIs.
                */
               invalidateVirtualCurrenciesCache(): void;
               /**
                * Closes the Purchases instance. You should never have to do this normally.
                */
               close(): void;
               /* Excluded from this release type: _getCustomerInfoForUserId */
               /* Excluded from this release type: _getVirtualCurrenciesForUserId */
               /**
                * Generates an anonymous app user ID that follows RevenueCat's format.
                * This can be used when you don't have a user identifier system in place.
                * The generated ID will be in the format: $RCAnonymousID:\<UUID without dashes\>
                * Example: $RCAnonymousID:123e4567e89b12d3a456426614174000
                * @returns A new anonymous app user ID string
                * @public
                */
               static generateRevenueCatAnonymousAppUserId(): string;
               /* Excluded from this release type: _trackEvent */
               /* Excluded from this release type: _flushAllEvents */
               private unwrappedAmazonBillingWrapper;
              }

              /**
               * Configuration object for initializing the Purchases SDK.
               *
               * @example
               * ```typescript
               * // Object-based configuration (recommended)
               * const purchases = Purchases.configure({
               *   apiKey: "your_api_key",
               *   appUserId: "user_123",
               *   httpConfig: { additionalHeaders: { "Custom-Header": "value" } },
               *   flags: { autoCollectUTMAsMetadata: true }
               * });
               *
               * // Legacy separate arguments (deprecated)
               * const purchases = Purchases.configure(
               *   "your_api_key",
               *   "user_123",
               *   { additionalHeaders: { "Custom-Header": "value" } },
               *   { autoCollectUTMAsMetadata: true }
               * );
               * ```
               *
               * @public
               */
              export declare interface PurchasesConfig {
                  /**
                   * RevenueCat API Key. Can be obtained from the RevenueCat dashboard.
                   */
                  apiKey: string;
                  /**
                   * Your unique id for identifying the user.
                   */
                  appUserId: string;
                  /**
                   * Advanced http configuration to customise the SDK usage {@link HttpConfig}.
                   */
                  httpConfig?: HttpConfig;
                  /**
                   * Advanced functionality configuration {@link FlagsConfig}.
                   */
                  flags?: FlagsConfig;
                  /**
                   * Overrides the Dashboard branding appearance for purchases created by this
                   * instance, including purchases started through {@link Purchases.presentPaywall}.
                   * Only the provided values are overridden. A value passed directly to
                   * {@link PurchaseParams.brandingAppearanceOverride} takes precedence for that
                   * purchase.
                   *
                   * For Stripe Checkout, this customizes the supported mobile wallet experience.
                   * The Stripe-hosted fallback opened through "Pay another way" remains light and
                   * cannot currently be customized.
                   */
                  brandingAppearanceOverride?: Partial<BrandingAppearance>;
                  /* Excluded from this release type: subscriberToken */
                  /* Excluded from this release type: context */
                  /* Excluded from this release type: trace_id */
              }

              /* Excluded from this release type: PurchasesContext */

              /**
               * Error class for Purchases SDK. You should handle these errors and react
               * accordingly in your app.
               * @public
               */
              export declare class PurchasesError extends Error {
                  /**
                   * Error code for the error. This is useful to appropriately react to
                   * different error situations.
                   */
                  readonly errorCode: ErrorCode;
                  /**
                   * Underlying error message. This provides more details on the error and
                   * can be useful for debugging and logging.
                   */
                  readonly underlyingErrorMessage?: string | null | undefined;
                  /**
                   * Contains extra information that is available in certain types of errors.
                   */
                  readonly extra?: PurchasesErrorExtra | undefined;
                  /* Excluded from this release type: getForBackendError */
                  /* Excluded from this release type: getForPurchasesFlowError */
                  constructor(
                  /**
                   * Error code for the error. This is useful to appropriately react to
                   * different error situations.
                   */
                  errorCode: ErrorCode, 
                  /**
                   * Message for the error. This is useful for debugging and logging.
                   */
                  message?: string, 
                  /**
                   * Underlying error message. This provides more details on the error and
                   * can be useful for debugging and logging.
                   */
                  underlyingErrorMessage?: string | null | undefined, 
                  /**
                   * Contains extra information that is available in certain types of errors.
                   */
                  extra?: PurchasesErrorExtra | undefined);
                  toString: () => string;
              }

              /**
               * Extra information that is available in certain types of errors.
               * @public
               */
              export declare interface PurchasesErrorExtra {
                  /**
                   * If this is a request error, the HTTP status code of the response.
                   */
                  readonly statusCode?: number;
                  /**
                   * If this is a RevenueCat backend error, the error code from the servers.
                   */
                  readonly backendErrorCode?: number;
              }

              /**
               * This object gives you access to the purchase redemption data when
               * the purchase can be redeemed to a mobile user, like in the case of anonymous users.
               * @public
               */
              export declare interface RedemptionInfo {
                  /**
                   * The redeem url.
                   */
                  readonly redeemUrl: string | null;
                  /**
                   * The HTTPS URL that redirects to the redeem URL.
                   * Use this URL when a browser-compatible URL is required, such as for QR codes.
                   */
                  readonly redeemUrlRedirect?: string | null;
              }

              /**
               * Enumeration of reserved customer attributes.
               * @public
               */
              export declare enum ReservedCustomerAttribute {
                  /**
                   * The display name that should be used to reference the customer.
                   */
                  DisplayName = "$displayName",
                  /**
                   * The email address of the customer.
                   */
                  Email = "$email",
                  /**
                   * The phone number of the customer.
                   */
                  PhoneNumber = "$phoneNumber",
                  /**
                   * iOS advertising identifier UUID for the customer.
                   */
                  IDFA = "$idfa",
                  /**
                   * iOS vendor identifier UUID for the customer.
                   */
                  IDFV = "$idfv",
                  /**
                   * The advertising ID that is provided by Google Play services for the customer.
                   */
                  GPSAdId = "$gpsAdId",
                  /**
                   * The Android ID of the customer.
                   */
                  AndroidId = "$androidId",
                  /**
                   * The Amazon Advertising ID of the customer.
                   */
                  AmazonAdId = "$amazonAdId",
                  /**
                   * The IP address of the customer.
                   */
                  IP = "$ip",
                  /**
                   * The unique Adjust identifier for the customer.
                   */
                  AdjustId = "$adjustId",
                  /**
                   * The Amplitude device ID of the customer.
                   */
                  AmplitudeDeviceId = "$amplitudeDeviceId",
                  /**
                   * The Amplitude user ID of the customer.
                   */
                  AmplitudeUserId = "$amplitudeUserId",
                  /**
                   * Appsflyer Id. The unique Appsflyer identifier for the customer.
                   */
                  AppsflyerId = "$appsflyerId",
                  /**
                   * The AppsFlyer sharing filter of the customer.
                   */
                  AppsflyerSharingFilter = "$appsflyerSharingFilter",
                  /**
                   * The Branch ID of the customer.
                   */
                  BranchId = "$branchId",
                  /**
                   * The Braze 'alias_name' in User Alias Object.
                   */
                  BrazeAliasName = "$brazeAliasName",
                  /**
                   * The Braze 'alias_label' in User Alias Object.
                   */
                  BrazeAliasLabel = "$brazeAliasLabel",
                  /**
                   * The CleverTap ID of the customer.
                   */
                  ClevertapId = "$clevertapId",
                  /**
                   * The Facebook anonymous ID of the customer.
                   */
                  FbAnonId = "$fbAnonId",
                  /**
                   * The unique mParticle user identifier (mpid).
                   */
                  MparticleId = "$mparticleId",
                  /**
                   * The OneSignal Player Id for the customer.
                   */
                  OnesignalId = "$onesignalId",
                  /**
                   * The OneSignal user ID of the customer.
                   */
                  OnesignalUserId = "$onesignalUserId",
                  /**
                   * The Intercom contact ID of the customer.
                   */
                  IntercomContactId = "$intercomContactId",
                  /**
                   * The media source of the customer.
                   */
                  MediaSource = "$mediaSource",
                  /**
                   * The campaign of the customer.
                   */
                  Campaign = "$campaign",
                  /**
                   * The ad group of the customer.
                   */
                  AdGroup = "$adGroup",
                  /**
                   * The Ad ID of the customer.
                   */
                  AdId = "$ad",
                  /**
                   * The keyword of the customer.
                   */
                  Keyword = "$keyword",
                  /**
                   * The creative of the customer.
                   */
                  Creative = "$creative",
                  /**
                   * Apple push notification tokens for the customer.
                   */
                  APNSTokens = "$apnsTokens",
                  /**
                   * Google push notification tokens for the customer.
                   */
                  FCMTokens = "$fcmTokens",
                  /**
                   * The Airship channel ID of the customer.
                   */
                  AirshipChannelId = "$airshipChannelId",
                  /**
                   * The segment ID of the customer.
                   */
                  SegmentId = "$segmentId",
                  /**
                   * The Iterable user ID of the customer.
                   */
                  IterableUserId = "$iterableUserId",
                  /**
                   * The Iterable campaign ID of the customer.
                   */
                  IterableCampaignId = "$iterableCampaignId",
                  /**
                   * The Iterable template ID of the customer.
                   */
                  IterableTemplateId = "$iterableTemplateId",
                  /**
                   * The Firebase app instance ID of the customer.
                   */
                  FirebaseAppInstanceId = "$firebaseAppInstanceId",
                  /**
                   * The Mixpanel distinct ID of the customer.
                   */
                  MixpanelDistinctId = "$mixpanelDistinctId",
                  /**
                   * Apple App Tracking Transparency consent status for the customer.
                   */
                  ATTConsentStatus = "$attConsentStatus",
                  /**
                   * The unique Kochava device identifier of the customer.
                   */
                  KochavaDeviceId = "$kochavaDeviceId",
                  /**
                   * The device version of the customer.
                   */
                  DeviceVersion = "$deviceVersion",
                  /**
                   * The PostHog user ID of the customer.
                   */
                  PosthogUserId = "$posthogUserId",
                  /**
                   * The Telemetry Deck user ID of the customer.
                   */
                  TelemetryDeckUserId = "$telemetryDeckUserId",
                  /**
                   * The Telemetry Deck app ID of the customer.
                   */
                  TelemetryDeckAppId = "$telemetryDeckAppId",
                  /**
                   * The Apple refund handling preference of the customer.
                   */
                  AppleRefundHandlingPreference = "$appleRefundHandlingPreference",
                  /**
                   * The customer.io ID of the customer.
                   */
                  CustomerioId = "$customerioId",
                  /**
                   * The Tenjin ID of the customer.
                   */
                  TenjinId = "$tenjinId",
                  /**
                   * The Singular Device ID (SDID) of the customer, generated by the Singular SDK.
                   * Required by Singular's Event Endpoint V2.
                   */
                  SingularDeviceId = "$singularDeviceId"
              }

              /**
               * The result of restoring purchases.
               * @public
               */
              export declare interface RestorePurchasesResult {
                  customerInfo: CustomerInfo;
              }

              declare type SDKEventContextSource = "sdk" | "wpl" | string;

              /**
               * The store where the user originally subscribed.
               * @public
               */
              export declare type Store = "app_store" | "mac_app_store" | "play_store" | "amazon" | "stripe" | "rc_billing" | "promotional" | "paddle" | "test_store" | "galaxy" | "unknown";

              /**
               * Determines when the store module (e.g. Stripe) is loaded.
               * - `"configuration"`: The store module is preloaded when the SDK is configured.
               * - `"purchase_start"`: The store module is loaded on demand when a purchase is started.
               * @public
               * @deprecated we always load stripe only when needed
               */
              export declare type StoreLoadTime = "configuration" | "purchase_start";

              /**
               * Represents a transaction made in the store.
               * @public
               */
              export declare interface StoreTransaction {
                  /**
                   * The unique identifier for the store transaction.
                   */
                  readonly storeTransactionId: string;
                  /**
                   * The identifier of the product purchased in the transaction.
                   */
                  readonly productIdentifier: string;
                  /**
                   * The date when the transaction was made.
                   */
                  readonly purchaseDate: Date;
              }

              /**
               * Subscription purchases of the Customer.
               * @public
               */
              export declare interface SubscriptionInfo {
                  /**
                   * The product identifier.
                   */
                  readonly productIdentifier: string;
                  /**
                   * The base plan identifier of the subscription (For Google Play subs only).
                   */
                  readonly productPlanIdentifier: string | null;
                  /**
                   * Date when the last subscription period started.
                   */
                  readonly purchaseDate: Date;
                  /**
                   * Date when this subscription first started. This property does not update with renewals.
                   * This property also does not update for product changes within a subscription group or
                   * re-subscriptions by lapsed subscribers.
                   */
                  readonly originalPurchaseDate: Date | null;
                  /**
                   * Date when the subscription expires/expired
                   */
                  readonly expiresDate: Date | null;
                  /**
                   * Store where the subscription was purchased.
                   */
                  readonly store: Store;
                  /**
                   * Date when RevenueCat detected that auto-renewal was turned off for this subscription.
                   * Note the subscription may still be active, check the {@link SubscriptionInfo.expiresDate} attribute.
                   */
                  readonly unsubscribeDetectedAt: Date | null;
                  /**
                   * Whether or not the purchase was made in sandbox mode.
                   */
                  readonly isSandbox: boolean;
                  /**
                   * Date when RevenueCat detected any billing issues with this subscription.
                   * If and when the billing issue gets resolved, this field is set to null.
                   * Note the subscription may still be active, check the {@link SubscriptionInfo.expiresDate} attribute.
                   */
                  readonly billingIssuesDetectedAt: Date | null;
                  /**
                   * Date when any grace period for this subscription expires/expired.
                   * null if the customer has never been in a grace period.
                   */
                  readonly gracePeriodExpiresDate: Date | null;
                  /**
                   * How the Customer received access to this subscription:
                   * - "PURCHASED": The customer bought the subscription.
                   * - "FAMILY_SHARED": The customer has access to the product via their family.
                   */
                  readonly ownershipType: OwnershipType;
                  /**
                   * Type of the current subscription period:
                   * - "normal": The product is in a normal period (default)
                   * - "trial": The product is in a free trial period
                   * - "intro": The product is in an introductory pricing period
                   * - "prepaid": The product is in a prepaid pricing period
                   */
                  readonly periodType: PeriodType;
                  /**
                   * Date when RevenueCat detected a refund of this subscription.
                   */
                  readonly refundedAt: Date | null;
                  /**
                   * The transaction id in the store of the subscription.
                   */
                  readonly storeTransactionId: string | null;
                  /**
                   * URL to manage this subscription, if available.
                   */
                  readonly managementURL: string | null;
                  /**
                   * Whether the subscription is currently active
                   * (at the time this object was obtained).
                   */
                  readonly isActive: boolean;
                  /**
                   * Whether the subscription will renew at the next billing period.
                   */
                  readonly willRenew: boolean;
                  /**
                   * The display name of the subscription as configured in the RevenueCat dashboard.
                   */
                  readonly displayName: string | null;
                  /**
                   * Date when a paused subscription is expected to automatically resume.
                   * Only set for Google Play subscriptions that have been paused; null otherwise.
                   */
                  readonly autoResumeDate: Date | null;
                  /**
                   * Paid price for the subscription.
                   */
                  readonly price: Price | null;
              }

              /**
               * Represents a possible option to purchase a subscription product.
               * @public
               */
              export declare interface SubscriptionOption extends PurchaseOption {
                  /**
                   * The base phase for a SubscriptionOption, represents
                   * the price that the customer will be charged after all the discounts have
                   * been consumed and the period at which it will renew.
                   */
                  readonly base: PricingPhase;
                  /**
                   * The trial information for this subscription option if available.
                   */
                  readonly trial: PricingPhase | null;
                  /**
                   * The introductory price period for this subscription option if available.
                   */
                  readonly introPrice: PricingPhase | null;
                  /* Excluded from this release type: discount */
              }

              /**
               * The result of syncing purchases.
               * @public
               */
              export declare interface SyncPurchasesResult {
                  customerInfo: CustomerInfo;
              }

              /**
               * Contains information about the targeting context used to obtain an object.
               * @public
               */
              export declare interface TargetingContext {
                  /**
                   * The rule id from the targeting used to obtain this object.
                   */
                  readonly ruleId: string;
                  /**
                   * The revision of the targeting used to obtain this object.
                   */
                  readonly revision: number;
              }

              declare interface TrackEventProps {
                  eventName: string;
                  source: SDKEventContextSource;
                  properties?: EventProperties;
              }

              declare interface TranslateFrequencyOptions {
                  useMultipleWords?: boolean;
              }

              declare interface TranslatePeriodOptions {
                  noWhitespace?: boolean;
                  short?: boolean;
              }

              /**
               * Translation variables to be used in the translation.
               * This class allows you to pass variables to the translate method.
               * @public
               * @example Given a label with id `periods.monthPlural` and value `{{amount}} months`. This example will replace the variable `{{amount}}` with the value `10`.
               * ```typescript
               * translator.translate('periods.monthPlural', { amount: 10 });
               * // Output: 10 months
               * ```
               */
              declare type TranslationVariables = Record<string, string | number | undefined | null>;

              declare class Translator {
                  readonly selectedLocale: string;
                  readonly defaultLocale: string;
                  readonly locales: Record<string, LocaleTranslations>;
                  static fallback(): Translator;
                  constructor(customTranslations?: CustomTranslations, selectedLocale?: string, defaultLocale?: string);
                  override(customTranslations: CustomTranslations): void;
                  formatPrice(priceInMicros: number, currency: string): string;
                  /**
                   * Returns the locale in a format that is compatible with other JS libraries.
                   * This is particularly important for zh_Hans and zh_Hant that are instead
                   * represented as zh-Hans and zh-Hant in Intl.DateTimeFormat.
                   */
                  get bcp47Locale(): string;
                  /**
                   * Returns the fallback locale in a format that is compatible with other JS
                   * libraries.
                   * This is particularly important for zh_Hans and zh_Hant that are instead
                   * represented as zh-Hans and zh-Hant in Intl.DateTimeFormat.
                   */
                  get fallbackBcp47Locale(): string;
                  private getLanguageCodeString;
                  private getLocaleInstance;
                  translate(key: LocalizationKeys | EmptyString, variables?: TranslationVariables): string;
                  formatCountry(countryCode: string): string;
                  translatePeriod(amount: number, period: PeriodUnit, options?: TranslatePeriodOptions): string | undefined;
                  translatePeriodUnit(period: PeriodUnit, options?: TranslatePeriodOptions): string | undefined;
                  translatePeriodFrequency(amount: number, period: PeriodUnit, options?: TranslateFrequencyOptions): string | undefined;
                  translateDate(date: Date, options?: Intl.DateTimeFormatOptions): string | undefined;
              }

              /**
               * Error indicating that the SDK was accessed before it was initialized.
               * @public
               */
              export declare class UninitializedPurchasesError extends Error {
                  constructor();
              }

              /**
               * The VirtualCurrencies object contains all the virtual currencies associated to the user.
               *
               * @public
               */
              export declare interface VirtualCurrencies {
                  /**
                   * Map of all {@link VirtualCurrency} objects keyed by virtual currency code.
                   */
                  readonly all: {
                      [key: string]: VirtualCurrency;
                  };
              }

              /**
               * The VirtualCurrency object represents information about a virtual currency in the app.
               * Use this object to access information about a virtual currency, such as its current balance.
               *
               * @public
               */
              export declare interface VirtualCurrency {
                  /**
                   * The virtual currency's balance.
                   */
                  readonly balance: number;
                  /**
                   * The virtual currency's name.
                   */
                  readonly name: string;
                  /**
                   * The virtual currency's code.
                   */
                  readonly code: string;
                  /**
                   * The virtual currency's description defined in the RevenueCat dashboard.
                   */
                  readonly serverDescription: string | null;
              }

              /* Excluded from this release type: WorkflowContext */

              /* Excluded from this release type: WorkflowPurchaseContext */

              export { }
