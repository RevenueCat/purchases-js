<script lang="ts">
  import {
    PurchaseFlowError,
    PurchaseFlowErrorCode,
  } from "../../helpers/purchase-operation-helper";
  import { getContext, onMount } from "svelte";
  import { Logger } from "../../helpers/logger.js";
  import MessageLayout from "../layout/message-layout.svelte";
  import { type Product, ProductType } from "../../entities/offerings";
  import { Translator } from "../localization/translator";
  import { translatorContextKey } from "../localization/constants";
  import Localized from "../localization/localized.svelte";

  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { type Writable } from "svelte/store";
  import Icon, { type IconName } from "../atoms/icon.svelte";

  interface Props {
    lastError: PurchaseFlowError | null;
    supportEmail: string | null;
    productDetails: Product;
    onDismiss: () => void;
    appName: string | null;
  }

  const { lastError, supportEmail, productDetails, onDismiss, appName }: Props =
    $props();

  const error: PurchaseFlowError = $derived(
    lastError ??
      new PurchaseFlowError(
        PurchaseFlowErrorCode.UnknownError,
        "Unknown error without state set.",
      ),
  );

  const translator: Writable<Translator> = getContext(translatorContextKey);

  const showOnlyInSandboxNote = $derived(
    error.errorCode === PurchaseFlowErrorCode.StripeTaxNotActive ||
      error.errorCode === PurchaseFlowErrorCode.StripeInvalidTaxOriginAddress ||
      error.errorCode === PurchaseFlowErrorCode.StripeMissingRequiredPermission,
  );

  onMount(() => {
    Logger.errorLog(
      `Displayed error: ${PurchaseFlowErrorCode[error.errorCode]}. Message: ${error.message ?? "None"}. Underlying error: ${error.underlyingErrorMessage ?? "None"}`,
    );
  });

  function getButtonTitle(): string {
    if (error.errorCode === PurchaseFlowErrorCode.AlreadyPurchasedError) {
      return $translator.translate(LocalizationKeys.ErrorPageCloseButtonTitle, {
        appName: appName ?? "App",
      });
    } else if (showOnlyInSandboxNote) {
      return $translator.translate(LocalizationKeys.ErrorButtonClose);
    } else {
      return $translator.translate(LocalizationKeys.ErrorButtonTryAgain);
    }
  }

  function getTranslatedErrorTitle(): string {
    switch (error.errorCode) {
      case PurchaseFlowErrorCode.AlreadyPurchasedError:
        if (productDetails.productType === ProductType.Subscription) {
          return $translator.translate(
            LocalizationKeys.ErrorPageErrorTitleAlreadySubscribed,
            { productTitle: productDetails.title },
          );
        } else {
          return $translator.translate(
            LocalizationKeys.ErrorPageErrorTitleAlreadyPurchased,
            { productTitle: productDetails.title },
          );
        }
      case PurchaseFlowErrorCode.StripeTaxNotActive:
        return $translator.translate(
          LocalizationKeys.ErrorPageErrorTitleStripeTaxNotActive,
        );
      case PurchaseFlowErrorCode.StripeInvalidTaxOriginAddress:
        return $translator.translate(
          LocalizationKeys.ErrorPageErrorTitleStripeInvalidTaxOriginAddress,
        );
      case PurchaseFlowErrorCode.StripeMissingRequiredPermission:
        return $translator.translate(
          LocalizationKeys.ErrorPageErrorTitleStripeMissingRequiredPermission,
        );
      default:
        return $translator.translate(
          LocalizationKeys.ErrorPageErrorTitleOtherErrors,
        );
    }
  }

  function getTranslatedErrorMessage(): string {
    const publicErrorCode = error.getErrorCode();
    switch (error.errorCode) {
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
      case PurchaseFlowErrorCode.StripeTaxNotActive:
        return $translator.translate(
          LocalizationKeys.ErrorPageErrorMessageStripeTaxNotActive,
          { errorCode: publicErrorCode },
        );
      case PurchaseFlowErrorCode.StripeInvalidTaxOriginAddress:
        return $translator.translate(
          LocalizationKeys.ErrorPageErrorMessageStripeInvalidTaxOriginAddress,
          { errorCode: publicErrorCode },
        );
      case PurchaseFlowErrorCode.StripeMissingRequiredPermission:
        return $translator.translate(
          LocalizationKeys.ErrorPageErrorMessageStripeMissingRequiredPermission,
          { errorCode: publicErrorCode },
        );
      case PurchaseFlowErrorCode.NetworkError:
        return $translator.translate(
          LocalizationKeys.ErrorPageErrorMessageNetworkError,
          { errorCode: publicErrorCode },
        );
      default:
        return $translator.translate(
          LocalizationKeys.ErrorPageErrorMessageUnknownError,
          { errorCode: publicErrorCode },
        );
    }
  }

  function getTranslatedSupportMessageKey(): LocalizationKeys {
    if (error.errorCode === PurchaseFlowErrorCode.AlreadyPurchasedError) {
      return LocalizationKeys.ErrorPageTroubleAccessing;
    } else {
      return LocalizationKeys.ErrorPageIfErrorPersists;
    }
  }

  function iconName(): IconName {
    if (error.errorCode === PurchaseFlowErrorCode.AlreadyPurchasedError) {
      return "success";
    } else {
      return "error";
    }
  }
</script>

<MessageLayout
  title={getTranslatedErrorTitle()}
  {onDismiss}
  type="error"
  closeButtonTitle={getButtonTitle()}
>
  {#snippet icon()}
    <Icon name={iconName()} />
  {/snippet}

  {#snippet message()}
    {#if showOnlyInSandboxNote}
      <span class="rc-sandbox-only-error">
        <Localized key={LocalizationKeys.ErrorPageErrorMessageOnlyInSandbox} />
      </span>
      <br />
      <br />
    {/if}

    {getTranslatedErrorMessage()}
    {#if !showOnlyInSandboxNote && supportEmail}
      <Localized key={getTranslatedSupportMessageKey()} />
      <a href="mailto:{supportEmail}">{supportEmail}</a>.
    {/if}
  {/snippet}
</MessageLayout>

<style>
  a {
    color: var(--rc-color-grey-text-dark);
  }

  .rc-sandbox-only-error {
    font-weight: bold;
  }
</style>
