<script lang="ts">
  import Button from "../button.svelte";
  import ModalFooter from "../modal-footer.svelte";
  import ModalSection from "../modal-section.svelte";
  import RowLayout from "../layout/row-layout.svelte";
  import { validateEmail } from "../../helpers/validators";
  import { PurchaseFlowError } from "../../helpers/purchase-operation-helper";
  import { getContext, onMount } from "svelte";
  import Localized from "../localization/localized.svelte";
  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";

  import { LocalizationKeys } from "../localization/supportedLanguages";
  import SecureCheckoutRc from "../secure-checkout-rc.svelte";
  import { type ContinueHandlerParams } from "../ui-types";
  import { eventsTrackerContextKey } from "../constants";
  import { type IEventsTracker } from "../../behavioural-events/events-tracker";
  import { createCheckoutBillingFormErrorEvent } from "../../behavioural-events/sdk-event-helpers";
  import { SDKEventName } from "../../behavioural-events/sdk-events";
  import { type Writable } from "svelte/store";

  export let onContinue: (params: ContinueHandlerParams) => void;
  export let processing: boolean;
  export let lastError: PurchaseFlowError | null;

  const eventsTracker = getContext(eventsTrackerContextKey) as IEventsTracker;

  $: email = "";
  $: errorMessage = lastError?.message || "";
  $: inputClass = (lastError?.message ?? errorMessage) !== "" ? "error" : "";

  const handleContinue = async () => {
    errorMessage = validateEmail(email) ?? "";
    if (errorMessage !== "") {
      const event = createCheckoutBillingFormErrorEvent({
        errorCode: null,
        errorMessage,
      });
      eventsTracker.trackSDKEvent(event);
    } else {
      eventsTracker.trackSDKEvent({
        eventName: SDKEventName.CheckoutBillingFormSubmit,
      });
      onContinue({ authInfo: { email } });
    }
  };

  onMount(() => {
    eventsTracker.trackSDKEvent({
      eventName: SDKEventName.CheckoutBillingFormImpression,
    });
  });

  const contextTranslator: Writable<Translator> =
    getContext(translatorContextKey);

  let translator: Translator = Translator.fallback();

  $: {
    if ($contextTranslator) {
      translator = $contextTranslator;
    }
  }
</script>

<div class="rcb-state-container">
  <span class="rcb-auth-info-title">
    <label for="email">
      <Localized key={LocalizationKeys.StateNeedsAuthInfoEmailStepTitle} />
    </label></span
  >
  <form on:submit|preventDefault={handleContinue}>
    <ModalSection>
      <div class="rcb-form-container">
        <div class="rcb-form-input {inputClass}">
          <input
            id="email"
            name="email"
            inputmode="email"
            placeholder={translator.translate(
              LocalizationKeys.StateNeedsAuthInfoEmailInputPlaceholder,
            )}
            autocapitalize="off"
            autocomplete="email"
            data-testid="email"
            bind:value={email}
          />
        </div>
        {#if errorMessage !== ""}
          <div class="rcb-form-error">{errorMessage}</div>
        {/if}
      </div>
    </ModalSection>
    <ModalFooter>
      <RowLayout>
        <Button disabled={processing} type="submit" loading={processing}>
          <Localized key={LocalizationKeys.StateNeedsAuthInfoButtonContinue} />
        </Button>
      </RowLayout>
      <div class="secure-checkout-container">
        <SecureCheckoutRc />
      </div>
    </ModalFooter>
  </form>
</div>

<style>
  .rcb-auth-info-title {
    font: var(--rc-text-titleLarge-mobile);
  }

  .secure-checkout-container {
    margin-top: var(--rc-spacing-gapXXLarge-mobile);
  }

  @container layout-query-container (width >= 768px) {
    .rcb-auth-info-title {
      font: var(--rc-text-titleLarge-desktop);
    }

    .secure-checkout-container {
      margin-top: var(--rc-spacing-gapXXLarge-desktop);
    }
  }

  .rcb-state-container {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    user-select: none;
  }

  form {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .rcb-form-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    margin-top: var(--rc-spacing-gapXLarge-desktop);
    margin-bottom: var(--rc-spacing-gapXLarge-desktop);
  }

  @media screen and (max-width: 767px) {
    .rcb-form-container {
      margin-top: var(--rc-spacing-gapXLarge-mobile);
      margin-bottom: var(--rc-spacing-gapXLarge-mobile);
    }
  }

  .rcb-form-label {
    margin-top: var(--rc-spacing-gapSmall-desktop);
    margin-bottom: var(--rc-spacing-gapSmall-desktop);
    font: var(--rc-text-body1-mobile);
    display: block;
  }

  @container layout-query-container (width >= 768px) {
    .rcb-form-label {
      font: var(--rc-text-body1-desktop);
    }
  }

  .rcb-form-input.error input {
    border-color: var(--rc-color-error);
  }

  .rcb-form-error {
    margin-top: var(--rc-spacing-gapSmall-desktop);
    font: var(--rc-text-body1-mobile);
    color: var(--rc-color-error);
  }

  @container layout-query-container (width >= 768px) {
    .rcb-form-error {
      font: var(--rc-text-body1-desktop);
    }
  }

  input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--rc-color-grey-ui-dark);
    border-radius: var(--rc-shape-input-border-radius);
    font: var(--rc-text-body1-mobile);
    height: var(--rc-spacing-inputHeight-desktop);
    background: var(--rc-color-input-background);
    color: inherit;
  }

  @container layout-query-container (width < 768px) {
    input {
      padding-left: var(--rc-spacing-gapLarge-mobile);
      height: var(--rc-spacing-inputHeight-mobile);
    }
  }

  @container layout-query-container (width >= 768px) {
    input {
      font: var(--rc-text-body1-desktop);
      padding-left: var(--rc-spacing-gapLarge-desktop);
    }

    .rcb-state-container {
      max-width: 50vw;
      flex-grow: 0;
    }
  }

  input:focus {
    outline: none;
    border: 1px solid var(--rc-color-focus);
  }

  input::placeholder {
    color: var(--rc-color-grey-ui-dark);
  }
</style>
