<script lang="ts">
  import {
    PurchaseFlowError,
    PurchaseFlowErrorCode,
  } from "../../helpers/purchase-operation-helper";
  import IconError from "../atoms/icons/icon-error.svelte";
  import { getContext, onMount } from "svelte";
  import { Logger } from "../../helpers/logger.js";
  import MessageLayout from "../layout/message-layout.svelte";
  import { type Product, ProductType } from "../../entities/offerings";
  import { Translator } from "../localization/translator";
  import { translatorContextKey } from "../localization/constants";
  import Localized from "../localization/localized.svelte";

  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { type Writable } from "svelte/store";

  interface Props {
    lastError: PurchaseFlowError | null;
    supportEmail: string | null;
    productDetails: Product;
    email?: string;
    onContinue: () => void;
  }

  const { lastError, supportEmail, productDetails, email, onContinue }: Props =
    $props();

  const error: PurchaseFlowError = $derived(
    lastError ??
      new PurchaseFlowError(
        PurchaseFlowErrorCode.UnknownError,
        "Unknown error without state set.",
      ),
  );

  const translator: Writable<Translator> = getContext(translatorContextKey);

  onMount(() => {
    Logger.errorLog(
      `Displayed error: ${PurchaseFlowErrorCode[error.errorCode]}. Message: ${error.message ?? "None"}. Underlying error: ${error.underlyingErrorMessage ?? "None"}`,
    );
  });

  function getTranslatedErrorTitle(): string {
    switch (error.errorCode) {
      case PurchaseFlowErrorCode.AlreadyPurchasedError:
        if (productDetails.productType === ProductType.Subscription) {
          return $translator.translate(
            LocalizationKeys.ErrorPageErrorTitleAlreadySubscribed,
          );
        } else {
          return $translator.translate(
            LocalizationKeys.ErrorPageErrorTitleAlreadyPurchased,
          );
        }
      default:
        return $translator.translate(
          LocalizationKeys.ErrorPageErrorTitleOtherErrors,
        );
    }
  }

  function getTranslatedErrorMessage(): string | undefined {
    const publicErrorCode = error.getErrorCode();
    switch (error.errorCode) {
      case PurchaseFlowErrorCode.UnknownError:
        return $translator.translate(
          LocalizationKeys.ErrorPageErrorMessageUnknownError,
          { errorCode: publicErrorCode },
        );
      case PurchaseFlowErrorCode.ErrorSettingUpPurchase:
        return $translator.translate(
          LocalizationKeys.ErrorPageErrorMessageErrorSettingUpPurchase,
          { errorCode: publicErrorCode },
        );
      case PurchaseFlowErrorCode.ErrorChargingPayment:
        return $translator.translate(
          LocalizationKeys.ErrorPageErrorMessageErrorChargingPayment,
          { errorCode: publicErrorCode },
        );
      case PurchaseFlowErrorCode.NetworkError:
        return $translator.translate(
          LocalizationKeys.ErrorPageErrorMessageNetworkError,
          { errorCode: publicErrorCode },
        );
      case PurchaseFlowErrorCode.MissingEmailError:
        return $translator.translate(
          LocalizationKeys.ErrorPageErrorMessageInvalidEmailError,
          { errorCode: publicErrorCode, email: email ?? "" },
        );
      case PurchaseFlowErrorCode.AlreadyPurchasedError:
        if (productDetails.productType === ProductType.Subscription) {
          return $translator.translate(
            LocalizationKeys.ErrorPageErrorMessageAlreadySubscribed,
            { errorCode: publicErrorCode },
          );
        } else {
          return $translator.translate(
            LocalizationKeys.ErrorPageErrorMessageAlreadyPurchased,
            { errorCode: publicErrorCode },
          );
        }
    }
  }
</script>

<MessageLayout
  title={getTranslatedErrorTitle()}
  {onContinue}
  type="error"
  closeButtonTitle={$translator.translate(LocalizationKeys.ErrorButtonTryAgain)}
>
  {#snippet icon()}
    <IconError />
  {/snippet}

  {#snippet message()}
    {getTranslatedErrorMessage()}
    {#if supportEmail}
      <br />
      <Localized key={LocalizationKeys.ErrorPageIfErrorPersists} />
      <a href="mailto:{supportEmail}">{supportEmail}</a>.
    {/if}
  {/snippet}
</MessageLayout>

<style>
  a {
    color: var(--rc-color-primary);
  }
</style>
