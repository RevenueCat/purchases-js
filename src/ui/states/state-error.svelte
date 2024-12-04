<script lang="ts">
  import {
    PurchaseFlowError,
    PurchaseFlowErrorCode,
  } from "../../helpers/purchase-operation-helper";
  import IconError from "../icons/icon-error.svelte";
  import { getContext, onMount } from "svelte";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import { Logger } from "../../helpers/logger.js";
  import MessageLayout from "../layout/message-layout.svelte";
  import { type Product, ProductType } from "../../entities/offerings";
  import { LocalizationKeys, Translator } from "../localization/translator";
  import { translatorContextKey } from "../localization/constants";
  import Localized from "../localization/localized.svelte";

  export let brandingInfo: BrandingInfoResponse | null = null;
  export let lastError: PurchaseFlowError;
  export let supportEmail: string | null = null;
  export let productDetails: Product | null = null;
  export let onContinue: () => void;

  const translator: Translator =
    getContext(translatorContextKey) || Translator.fallback();

  onMount(() => {
    Logger.errorLog(
      `Displayed error: ${PurchaseFlowErrorCode[lastError.errorCode]}. Message: ${lastError.message ?? "None"}. Underlying error: ${lastError.underlyingErrorMessage ?? "None"}`,
    );
  });

  function getTranslatedErrorTitle(): string {
    switch (lastError.errorCode) {
      case PurchaseFlowErrorCode.AlreadyPurchasedError:
        if (productDetails?.productType === ProductType.Subscription) {
          return translator.translate(
            LocalizationKeys.StateErrorErrorTitleAlreadySubscribed,
          );
        } else {
          return translator.translate(
            LocalizationKeys.StateErrorErrorTitleAlreadyPurchased,
          );
        }
      default:
        return translator.translate(
          LocalizationKeys.StateErrorErrorTitleOtherErrors,
        );
    }
  }

  function getTranslatedErrorMessage(): string | undefined {
    const publicErrorCode = lastError.getErrorCode();
    switch (lastError.errorCode) {
      case PurchaseFlowErrorCode.UnknownError:
        return translator.translate(
          LocalizationKeys.StateErrorErrorMessageUnknownError,
          { errorCode: publicErrorCode },
        );
      case PurchaseFlowErrorCode.ErrorSettingUpPurchase:
        return translator.translate(
          LocalizationKeys.StateErrorErrorMessageErrorSettingUpPurchase,
          { errorCode: publicErrorCode },
        );
      case PurchaseFlowErrorCode.ErrorChargingPayment:
        return translator.translate(
          LocalizationKeys.StateErrorErrorMessageErrorChargingPayment,
          { errorCode: publicErrorCode },
        );
      case PurchaseFlowErrorCode.NetworkError:
        return translator.translate(
          LocalizationKeys.StateErrorErrorMessageNetworkError,
          { errorCode: publicErrorCode },
        );
      case PurchaseFlowErrorCode.StripeError:
        // For stripe errors, we can display the stripe-provided error message.
        return lastError.message;
      case PurchaseFlowErrorCode.MissingEmailError:
        return translator.translate(
          LocalizationKeys.StateErrorErrorMessageMissingEmailError,
          { errorCode: publicErrorCode },
        );
      case PurchaseFlowErrorCode.AlreadyPurchasedError:
        if (productDetails?.productType === ProductType.Subscription) {
          return translator.translate(
            LocalizationKeys.StateErrorErrorMessageAlreadySubscribed,
            { errorCode: publicErrorCode },
          );
        } else {
          return translator.translate(
            LocalizationKeys.StateErrorErrorMessageAlreadyPurchased,
            { errorCode: publicErrorCode },
          );
        }
    }
  }
</script>

<MessageLayout
  title={getTranslatedErrorTitle()}
  {brandingInfo}
  {onContinue}
  type="error"
  closeButtonTitle={translator.translate(
    LocalizationKeys.StateErrorButtonTryAgain,
  )}
>
  <IconError slot="icon" />

  {getTranslatedErrorMessage()}
  {#if supportEmail}
    <br />
    <Localized key={LocalizationKeys.StateErrorIfErrorPersists} />
    <a href="mailto:{supportEmail}">{supportEmail}</a>.
  {/if}
</MessageLayout>
