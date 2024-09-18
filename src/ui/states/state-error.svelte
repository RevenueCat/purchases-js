<script lang="ts">
  import {
    PurchaseFlowError,
    PurchaseFlowErrorCode,
  } from "../../helpers/purchase-operation-helper";
  import IconError from "../assets/icon-error.svelte";
  import { onMount } from "svelte";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import { Logger } from "../../helpers/logger.js";
  import MessageLayout from "../layout/message-layout.svelte";

  export let brandingInfo: BrandingInfoResponse | null = null;
  export let lastError: PurchaseFlowError;
  export let supportEmail: string | null = null;
  export let onContinue: () => void;

  onMount(() => {
    Logger.errorLog(
      `Displayed error: ${PurchaseFlowErrorCode[lastError.errorCode]}. Message: ${lastError.message ?? "None"}. Underlying error: ${lastError.underlyingErrorMessage ?? "None"}`,
    );
  });

  function getErrorTitle(): string {
    switch (lastError.errorCode) {
      case PurchaseFlowErrorCode.AlreadySubscribedError:
        return "Already subscribed";
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
>
  <IconError slot="icon" />
  {lastError.getPublicErrorMessage()}
  {#if supportEmail}
    If this error persists, please contact <a href="mailto:{supportEmail}"
      >{supportEmail}</a
    >.
  {/if}
</MessageLayout>
