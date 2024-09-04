<script lang="ts">
  import Button from "../button.svelte";
  import ModalFooter from "../modal-footer.svelte";
  import ModalSection from "../modal-section.svelte";
  import RowLayout from "../layout/row-layout.svelte";
  import ModalHeader from "../modal-header.svelte";
  import ProcessingAnimation from "../processing-animation.svelte";
  import { validateEmail } from "../../helpers/validators";
  import { PurchaseFlowError } from "../../helpers/purchase-operation-helper";
  import { beforeUpdate } from "svelte";
  import { getStyleVariable } from "../../helpers/process-style-overrides";
  import { appearanceConfigStore } from "../../store/store";

  export let onContinue: any;
  export let onClose: () => void;
  export let processing: boolean;
  export let lastError: PurchaseFlowError | null;

  const accentColor = getStyleVariable({
    property: $appearanceConfigStore["color_accent"] as string,
    variableName: "accent",
    fallbackVariableName: "--rc-color-focus",
  });

  $: email = "";
  $: error = "";
  $: inputClass = error ? "error" : "";

  const handleContinue = async () => {
    const verificationErrors = validateEmail(email);
    if (verificationErrors) {
      error = verificationErrors;
    } else {
      onContinue({ email });
    }
  };

  beforeUpdate(async () => {
    error = lastError?.message ?? "";
  });
</script>

<form on:submit|preventDefault={handleContinue}>
  <ModalHeader>Billing email address</ModalHeader>
  <ModalSection>
    <div class="form-container">
      <div class="form-label"><label for="email">Email</label></div>
      <div class="form-input {inputClass}">
        <input
          name="email"
          placeholder="john@appleseed.com"
          autocapitalize="off"
          bind:value={email}
          style={accentColor}
        />
      </div>
      {#if error}<div class="form-error">{error}</div>{/if}
    </div>
  </ModalSection>
  <ModalFooter>
    <RowLayout>
      <Button disabled={processing}>
        {#if processing}
          <ProcessingAnimation />
        {:else}
          Continue
        {/if}
      </Button>
      <Button intent="secondary" on:click={onClose} disabled={processing}
        >Close</Button
      >
    </RowLayout>
  </ModalFooter>
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    flex-grow: 1;
  }

  .form-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    margin-top: 32px;
    margin-bottom: 16px;
  }

  .form-label {
    margin-top: 8px;
    margin-bottom: 8px;
    display: block;
    font-weight: 500;
    line-height: 22px;
  }

  .form-input.error input {
    border-color: var(--rc-color-error);
  }

  .form-error {
    margin-top: 4px;
    font-size: 16px;
    line-height: 20px;
    min-height: 40px;
    color: var(--rc-color-error);
  }

  input {
    width: 100%;
    box-sizing: border-box;
    padding: 8px;
    border: 2px solid var(--rc-color-grey-ui-dark);
    border-radius: 12px;
    font-size: 16px;
    height: 48px;
    padding: 6px 14px;
  }
  input:focus {
    outline: none;
    border: 2px solid var(--accent);
  }
</style>
