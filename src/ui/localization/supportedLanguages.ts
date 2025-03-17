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
  ProductInfoProductTitle = "state_present_offer.product_title",
  ProductInfoProductDescription = "state_present_offer.product_description",
  ProductInfoProductPrice = "state_present_offer.product_price",
  ProductInfoFreeTrialDuration = "state_present_offer.free_trial_duration",
  ProductInfoPriceAfterFreeTrial = "state_present_offer.price_after_free_trial",
  ProductInfoPriceTotalDueToday = "state_present_offer.total_due_today",
  ProductInfoSubscribeTo = "state_present_offer.subscribe_to",
  ProductInfoRenewalFrequency = "state_present_offer.renewal_frequency",
  ProductInfoContinuesUntilCancelled = "state_present_offer.continues_until_cancelled",
  ProductInfoCancelAnytime = "state_present_offer.cancel_anytime",
  StateNeedsAuthInfoEmailStepTitle = "state_needs_auth_info.email_step_title",
  StateNeedsAuthInfoEmailInputLabel = "state_needs_auth_info.email_input_label",
  StateNeedsAuthInfoEmailInputPlaceholder = "state_needs_auth_info.email_input_placeholder",
  StateNeedsAuthInfoButtonContinue = "state_needs_auth_info.button_continue",
  StateNeedsPaymentInfoPaymentStepTitle = "state_needs_payment_info.payment_step_title",
  StateNeedsPaymentInfoTermsInfo = "state_needs_payment_info.terms_info",
  StateNeedsPaymentInfoTrialInfo = "state_needs_payment_info.trial_info",
  StateNeedsPaymentInfoButtonPay = "state_needs_payment_info.button_pay",
  StateNeedsPaymentInfoButtonStartTrial = "state_needs_payment_info.button_start_trial",
  StateSuccessPurchaseSuccessful = "state_success.purchase_successful",
  StateSuccessSubscriptionNowActive = "state_success.subscription_now_active",
  StateSuccessButtonClose = "state_success.button_close",
  StateErrorIfErrorPersists = "state_error.if_error_persists",
  StateErrorErrorTitleAlreadySubscribed = "state_error.error_title_already_subscribed",
  StateErrorErrorTitleAlreadyPurchased = "state_error.error_title_already_purchased",
  StateErrorErrorTitleOtherErrors = "state_error.error_title_other_errors",
  StateErrorErrorMessageAlreadySubscribed = "state_error.error_message_already_subscribed",
  StateErrorErrorMessageAlreadyPurchased = "state_error.error_message_already_purchased",
  StateErrorErrorMessageMissingEmailError = "state_error.error_message_missing_email_error",
  StateErrorErrorMessageNetworkError = "state_error.error_message_network_error",
  StateErrorErrorMessageErrorChargingPayment = "state_error.error_message_error_charging_payment",
  StateErrorErrorMessageErrorSettingUpPurchase = "state_error.error_message_error_setting_up_purchase",
  StateErrorErrorMessageUnknownError = "state_error.error_message_unknown_error",
  StateErrorButtonTryAgain = "state_error.button_try_again",
  PaywallVariablesPricePerPeriod = "paywall_variables.price_per_period",
  PaywallVariablesSubRelativeDiscount = "paywall_variables.sub_relative_discount",
  PaywallVariablesTotalPriceAndPerMonth = "paywall_variables.total_price_and_per_month",
  PricingDropdownShowDetails = "pricing_dropdown.show_details",
  PricingDropdownHideDetails = "pricing_dropdown.hide_details",
  NavbarHeaderDetails = "navbar_header.details",
  NavbarBackButton = "navbar_header.back_button",
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
