<script lang="ts">
  import { PurchaseFlowError, PurchaseFlowErrorCode } from "../../helpers/purchase-operation-helper";
  import IconError from "../icons/icon-error.svelte";
  import { getContext, onMount } from "svelte";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import { Logger } from "../../helpers/logger.js";
  import MessageLayout from "../layout/message-layout.svelte";
  import { type Product, ProductType } from "../../entities/offerings";
  import { Translator } from "../localization/translator";
  import { translatorContextKey } from "../localization/constants";
  import Localized from "../localization/localized.svelte";

  export let brandingInfo: BrandingInfoResponse | null = null;
  export let lastError: PurchaseFlowError;
  export let supportEmail: string | null = null;
  export let productDetails: Product | null = null;
  export let onContinue: () => void;

  const translator = getContext(translatorContextKey) || Translator.fallback();

  onMount(() => {
    Logger.errorLog(
      `Displayed error: ${PurchaseFlowErrorCode[lastError.errorCode]}. Message: ${lastError.message ?? "None"}. Underlying error: ${lastError.underlyingErrorMessage ?? "None"}`,
    );
  });

  function getTranslatedErrorTitle(): string | undefined {
    switch (lastError.errorCode) {
      case PurchaseFlowErrorCode.AlreadyPurchasedError:
        if (productDetails?.productType === ProductType.Subscription) {
          return translator.translate("state_error.error_title_already_subscribed");
        } else {
          return translator.translate("state_error.error_title_already_purchased");
        }
      default:
        return translator.translate("state_error.error_title_other_errors");
    }
  }

  function getTranslatedErrorMessage(): string | undefined {
    const publicErrorCode = lastError.getErrorCode();
    switch (lastError.errorCode) {
      case PurchaseFlowErrorCode.UnknownError:
        return translator.translate("state_error.error_message_unknown_error", { errorCode: publicErrorCode });
      case PurchaseFlowErrorCode.ErrorSettingUpPurchase:
        return translator.translate("state_error.error_message_error_setting_up_purchase", { errorCode: publicErrorCode });
      case PurchaseFlowErrorCode.ErrorChargingPayment:
        return translator.translate("state_error.error_message_error_charging_payment", { errorCode: publicErrorCode });
      case PurchaseFlowErrorCode.NetworkError:
        return translator.translate("state_error.error_message_network_error", { errorCode: publicErrorCode });
      case PurchaseFlowErrorCode.StripeError:
        // For stripe errors, we can display the stripe-provided error message.
        return this.message;
      case PurchaseFlowErrorCode.MissingEmailError:
        return translator.translate("state_error.error_message_missing_email_error", { errorCode: publicErrorCode });
      case PurchaseFlowErrorCode.AlreadyPurchasedError:
        if (productDetails?.productType === ProductType.Subscription) {
          return translator.translate("state_error.error_message_already_purchased", { errorCode: publicErrorCode });
        } else {
          return translator.translate("state_error.error_message_already_subscribed", { errorCode: publicErrorCode });
        }
    }
  }
</script>

<MessageLayout
  title={getTranslatedErrorTitle()}
  {brandingInfo}
  {onContinue}
  type="error"
  closeButtonTitle={translator.translate("state_error.button_try_again")}
>
  <IconError slot="icon" />

  {getTranslatedErrorMessage()}
  {#if supportEmail}
    <br>
    <Localized labelId="state_error.if_error_persists">
      If this error persists, please contact
    </Localized>
    <a href="mailto:{supportEmail}">{supportEmail}</a>.
  {/if}
</MessageLayout>
