<script lang="ts">
  import { PurchaseFlowError, PurchaseFlowErrorCode } from "../../helpers/purchase-operation-helper";
  import Button from "../button.svelte";
  import ModalFooter from "../modal-footer.svelte";
  import ModalSection from "../modal-section.svelte";
  import IconError from "../assets/icon-error.svelte";
  import RowLayout from "../layout/row-layout.svelte";
  import { onMount } from "svelte";

  export let lastError: PurchaseFlowError;
  export let onContinue: () => void;

  onMount(() => {
    console.debug(`Displayed error: ${PurchaseFlowErrorCode[lastError.errorCode]}. Message: ${lastError.message ?? "None"}. Underlying error: ${lastError.underlyingErrorMessage ?? "None"}`);
  });

  function getErrorMessage(): string {
    switch (lastError.errorCode) {
      // TODO: Localize these messages
      case PurchaseFlowErrorCode.UnknownError:
        return "An unknown error occurred. Please try again or contact support.";
      case PurchaseFlowErrorCode.ErrorSettingUpPurchase:
        return "Purchase not started due to an error. Please try again or contact support.";
      case PurchaseFlowErrorCode.ErrorChargingPayment:
        return "Payment failed. Please try again or contact support.";
      case PurchaseFlowErrorCode.NetworkError:
        return "Network error. Please check your internet connection and try again.";
      case PurchaseFlowErrorCode.StripeError:
        // For stripe errors, we can display the stripe-provided error message.
        return lastError.message;
      case PurchaseFlowErrorCode.MissingEmailError:
        return "Email is required to complete the purchase. Please add it and try again.";
    }
    return lastError.message;
  }
</script>


<RowLayout gutter="2rem">
  <ModalSection>
    <div class="rcb-modal-error">
      <RowLayout gutter="1rem">
        <IconError />
        <RowLayout gutter="1rem">
          <span class="title">Something went wrong.</span>
          <span class="subtitle">{getErrorMessage()}</span>
        </RowLayout>
      </RowLayout>
    </div>
  </ModalSection>
  <ModalFooter>
    <Button intent="secondary" on:click={onContinue}>Go back to app</Button>
  </ModalFooter>
</RowLayout>

<style>
    .rcb-modal-error {
        width: 100%;
        min-height: 10rem;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        text-align: center;
    }

    .title {
        font-size: 24px;
    }

    .subtitle {
        font-size: 16px;
    }
</style>
