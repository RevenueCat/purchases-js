import en from "./locale/en.json";
import es from "./locale/es.json";
import it from "./locale/it.json";
import ar from "./locale/ar.json";
import ca from "./locale/ca.json";
import zh_Hans from "./locale/zh_Hans.json";
import zh_Hant from "./locale/zh_Hant.json";
import hr from "./locale/hr.json";
import cs from "./locale/cs.json";
import da from "./locale/da.json";
import nl from "./locale/nl.json";
import fi from "./locale/fi.json";
import fr from "./locale/fr.json";
import de from "./locale/de.json";
import el from "./locale/el.json";
import he from "./locale/he.json";
import hi from "./locale/hi.json";
import hu from "./locale/hu.json";
import id from "./locale/id.json";
import ja from "./locale/ja.json";
import ko from "./locale/ko.json";
import ms from "./locale/ms.json";
import no from "./locale/no.json";
import pl from "./locale/pl.json";
import pt from "./locale/pt.json";
import ro from "./locale/ro.json";
import ru from "./locale/ru.json";
import sk from "./locale/sk.json";
import sv from "./locale/sv.json";
import th from "./locale/th.json";
import tr from "./locale/tr.json";
import uk from "./locale/uk.json";
import vi from "./locale/vi.json";

export enum LocalizationKeys {
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
  PaymentEntryPageIntroPriceRecurringSubscriptionTermsInfo = "payment_entry_page.intro_recurring_subscription_terms_info",
  PaymentEntryPageIntroPricePaidUpfrontSubscriptionTermsInfo = "payment_entry_page.intro_paid_upfront_subscription_terms_info",
  PaymentEntryPageTrialAndIntroPriceRecurringSubscriptionTermsInfo = "payment_entry_page.trial_and_intro_recurring_subscription_terms_info",
  PaymentEntryPageTrialAndIntroPricePaidUpfrontSubscriptionTermsInfo = "payment_entry_page.trial_and_intro_paid_upfront_subscription_terms_info",
  PaymentEntryPageNonTrialSubscriptionTermsInfo = "payment_entry_page.non_trial_subscription_terms_info",
  PaymentEntryPageOtpTermsInfo = "payment_entry_page.otp_terms_info",
  PaymentEntryPageSubscriptionInfo = "payment_entry_page.subscription_info",
  PaymentEntryPageButtonPay = "payment_entry_page.button_pay",
  PaymentEntryPageButtonStartTrial = "payment_entry_page.button_start_trial",
  PaymentEntryPageButtonWithPrice = "payment_entry_page.button_with_price",
  PaymentEntryPageButtonPaymentMethod = "payment_entry_page.button_payment_method",
  PaymentEntryPageExpressCheckoutDivider = "payment_entry_page.express_checkout_divider",
  SuccessPagePurchaseSuccessful = "success_page.purchase_successful",
  SuccessPageButtonClose = "success_page.button_close",
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
  PricingTotalExcludingTax = "pricing_table.total_excluding_tax",
  PricingTableTrialEnds = "pricing_table.trial_ends",
  PricingTableTotalDueToday = "pricing_table.total_due_today",
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
}

export const supportedLanguages: Record<
  string,
  Record<LocalizationKeys, string>
> = {
  en,
  es,
  it,
  ar,
  ca,
  zh_Hans,
  zh_Hant,
  hr,
  cs,
  da,
  nl,
  fi,
  fr,
  de,
  el,
  he,
  hi,
  hu,
  id,
  ja,
  ko,
  ms,
  no,
  pl,
  pt,
  ro,
  ru,
  sk,
  sv,
  th,
  tr,
  uk,
  vi,
};
