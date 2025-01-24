<script lang="ts">
  import Button from "../button.svelte";
  import ModalFooter from "../modal-footer.svelte";
  import ModalSection from "../modal-section.svelte";
  import RowLayout from "../layout/row-layout.svelte";
  import ProcessingAnimation from "../processing-animation.svelte";
  import { validateEmail } from "../../helpers/validators";
  import { PurchaseFlowError } from "../../helpers/purchase-operation-helper";
  import { beforeUpdate, getContext } from "svelte";
  import Localized from "../localization/localized.svelte";
  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";

  import { LocalizationKeys } from "../localization/supportedLanguages";

  export let onContinue: any;
  export let onClose: () => void;
  export let processing: boolean;
  export let lastError: PurchaseFlowError | null;

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

  const translator: Translator =
    getContext(translatorContextKey) || Translator.fallback();
</script>

<div class="needs-auth-info-container">
  <span class="auth-info-title">
    <Localized key={LocalizationKeys.StateNeedsAuthInfoEmailStepTitle} />
  </span>
  <form on:submit|preventDefault={handleContinue}>
    <ModalSection>
      <div class="form-container">
        <div class="form-input {inputClass}">
          <input
            name="email"
            placeholder={translator.translate(
              LocalizationKeys.StateNeedsAuthInfoEmailInputPlaceholder,
            )}
            autocapitalize="off"
            bind:value={email}
          />
        </div>
        {#if error}
          <div class="form-error">{error}</div>
        {/if}
      </div>
    </ModalSection>
    <ModalFooter>
      <RowLayout>
        <Button disabled={processing} type="submit">
          {#if processing}
            <ProcessingAnimation />
          {:else}
            <Localized
              key={LocalizationKeys.StateNeedsAuthInfoButtonContinue}
            />
          {/if}
        </Button>
        <p class="footer-caption">Secure checkout by RevenueCat</p>
      </RowLayout>
    </ModalFooter>
  </form>
</div>

<style>
  .auth-info-title {
    font: var(--rc-text-title3);
  }

  .footer-caption {
    font: var(--rc-text-caption);
    color: var(--rc-color-text-secondary);
    margin: var(--rc-spacing-gapSmall-desktop);
    text-align: center;
    font-weight: 400;
  }

  .needs-auth-info-container {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    padding: var(--rc-spacing-innerPadding-mobile);
  }

  form {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .form-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    margin-top: var(--rc-spacing-gapMedium-desktop);
    margin-bottom: var(--rc-spacing-gapMedium-desktop);
  }

  @media screen and (max-width: 768px) {
    .form-container {
      margin-top: var(--rc-spacing-gapMedium-mobile);
      margin-bottom: var(--rc-spacing-gapMedium-mobile);
    }
  }

  .form-label {
    margin-top: var(--rc-spacing-gapSmall-desktop);
    margin-bottom: var(--rc-spacing-gapSmall-desktop);
    font: var(--rc-text-body1);
    display: block;
  }

  .form-input.error input {
    border-color: var(--rc-color-error);
  }

  .form-error {
    margin-top: var(--rc-spacing-gapSmall-desktop);
    font: var(--rc-text-body1);
    color: var(--rc-color-error);
  }

  input {
    width: 100%;
    box-sizing: border-box;
    padding: var(--rc-spacing-innerPadding-desktop);
    border: 2px solid var(--rc-color-grey-ui-dark);
    border-radius: var(--rc-shape-input-border-radius);
    font: var(--rc-text-body1);
    height: var(--rc-spacing-inputHeight-desktop);
    background: var(--rc-color-input-background);
    color: inherit;
  }

  @media screen and (max-width: 768px) {
    input {
      padding: var(--rc-spacing-innerPadding-mobile);
      height: var(--rc-spacing-inputHeight-mobile);
    }
  }

  @media screen and (min-width: 768px) {
    .needs-auth-info-container {
      max-width: 50vw;
      padding: var(--rc-spacing-innerPadding-desktop);
    }
  }

  input:focus {
    outline: none;
    border: 2px solid var(--rc-color-focus);
  }
</style>
