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
    onContinue: () => void;
  }

  const { lastError, supportEmail, productDetails, onContinue }: Props =
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
            LocalizationKeys.StateErrorErrorTitleAlreadySubscribed,
          );
        } else {
          return $translator.translate(
            LocalizationKeys.StateErrorErrorTitleAlreadyPurchased,
          );
        }
      default:
        return $translator.translate(
          LocalizationKeys.StateErrorErrorTitleOtherErrors,
        );
    }
  }

  function getTranslatedErrorMessage(): string | undefined {
    const publicErrorCode = error.getErrorCode();
    switch (error.errorCode) {
      case PurchaseFlowErrorCode.UnknownError:
        return $translator.translate(
          LocalizationKeys.StateErrorErrorMessageUnknownError,
          { errorCode: publicErrorCode },
        );
      case PurchaseFlowErrorCode.ErrorSettingUpPurchase:
        return $translator.translate(
          LocalizationKeys.StateErrorErrorMessageErrorSettingUpPurchase,
          { errorCode: publicErrorCode },
        );
      case PurchaseFlowErrorCode.ErrorChargingPayment:
        return $translator.translate(
          LocalizationKeys.StateErrorErrorMessageErrorChargingPayment,
          { errorCode: publicErrorCode },
        );
      case PurchaseFlowErrorCode.NetworkError:
        return $translator.translate(
          LocalizationKeys.StateErrorErrorMessageNetworkError,
          { errorCode: publicErrorCode },
        );
      case PurchaseFlowErrorCode.MissingEmailError:
        return $translator.translate(
          LocalizationKeys.StateErrorErrorMessageMissingEmailError,
          { errorCode: publicErrorCode },
        );
      case PurchaseFlowErrorCode.AlreadyPurchasedError:
        if (productDetails.productType === ProductType.Subscription) {
          return $translator.translate(
            LocalizationKeys.StateErrorErrorMessageAlreadySubscribed,
            { errorCode: publicErrorCode },
          );
        } else {
          return $translator.translate(
            LocalizationKeys.StateErrorErrorMessageAlreadyPurchased,
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
  closeButtonTitle={$translator.translate(
    LocalizationKeys.StateErrorButtonTryAgain,
  )}
>
  {#snippet icon()}
    <IconError />
  {/snippet}

  {#snippet message()}
    {getTranslatedErrorMessage()}
    {#if supportEmail}
      <br />
      <Localized key={LocalizationKeys.StateErrorIfErrorPersists} />
      <a href="mailto:{supportEmail}">{supportEmail}</a>.
    {/if}
  {/snippet}
</MessageLayout>

<style>
  a {
    color: var(--rc-color-primary);
  }
</style>
