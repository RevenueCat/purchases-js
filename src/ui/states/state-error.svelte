<script lang="ts">
  import { PurchaseFlowError, PurchaseFlowErrorCode } from "../../helpers/purchase-operation-helper";
  import IconError from "../icons/icon-error.svelte";
  import { onMount } from "svelte";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import { Logger } from "../../helpers/logger.js";
  import MessageLayout from "../layout/message-layout.svelte";
  import { type Product, ProductType } from "../../entities/offerings";

  export let brandingInfo: BrandingInfoResponse | null = null;
  export let lastError: PurchaseFlowError;
  export let supportEmail: string | null = null;
  export let productDetails: Product | null = null;
  export let onContinue: () => void;

  onMount(() => {
    Logger.errorLog(
      `Displayed error: ${PurchaseFlowErrorCode[lastError.errorCode]}. Message: ${lastError.message ?? "None"}. Underlying error: ${lastError.underlyingErrorMessage ?? "None"}`,
    );
  });

  function getErrorTitle(): string {
    switch (lastError.errorCode) {
      case PurchaseFlowErrorCode.AlreadyPurchasedError:
        if (productDetails?.productType === ProductType.Subscription) {
          return "Already subscribed";
        } else {
          return "Already purchased";
        }
      default:
        return "Something went wrong";
    }
  }
</script>

<MessageLayout
  title={getErrorTitle()}
  {brandingInfo}
  {onContinue}
  type="error"
  closeButtonTitle="Try Again"
>
  <IconError slot="icon" />
  {lastError.getPublicErrorMessage(productDetails)}
  {#if supportEmail}
    <br>If this error persists, please contact <a href="mailto:{supportEmail}">{supportEmail}</a>.
  {/if}
</MessageLayout>
