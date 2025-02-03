<script lang="ts">
  import Button from "../button.svelte";
  import ModalFooter from "../modal-footer.svelte";
  import ModalSection from "../modal-section.svelte";
  import RowLayout from "../layout/row-layout.svelte";
  import ModalHeader from "../modal-header.svelte";
  import ProcessingAnimation from "../processing-animation.svelte";
  import { validateEmail } from "../../helpers/validators";
  import { PurchaseFlowError } from "../../helpers/purchase-operation-helper";
  import { getContext, onMount } from "svelte";
  import CloseButton from "../close-button.svelte";
  import Localized from "../localization/localized.svelte";
  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";

  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { eventsTrackerContextKey } from "../constants";
  import { IEventsTracker } from "../../behavioural-events/events-tracker";
  import { createBillingEmailEntryErrorEvent } from "../../behavioural-events/event-helpers";
  import { TrackedEventName } from "../../behavioural-events/tracked-events";

  export let onContinue: any;
  export let onClose: () => void;
  export let processing: boolean;
  export let lastError: PurchaseFlowError | null;

  function onCloseHandle() {
    eventsTracker.trackEvent({
      eventName: TrackedEventName.BillingEmailEntryDismiss,
    });
    onClose();
  }

  const eventsTracker = getContext(eventsTrackerContextKey) as IEventsTracker;

  $: email = "";
  $: errorMessage = lastError?.message || "";
  $: inputClass = lastError?.message || errorMessage ? "error" : "";

  const handleContinue = async () => {
    errorMessage ||= validateEmail(email) || "";
    if (errorMessage !== "") {
      const event = createBillingEmailEntryErrorEvent(null, errorMessage);
      eventsTracker.trackEvent(event);
    } else {
      eventsTracker.trackEvent({
        eventName: TrackedEventName.BillingEmailEntrySubmit,
      });
      onContinue({ email });
    }
  };

  onMount(() => {
    eventsTracker.trackEvent({
      eventName: TrackedEventName.BillingEmailEntryImpression,
    });
  });

  const translator: Translator =
    getContext(translatorContextKey) || Translator.fallback();
</script>

<div class="container">
  <ModalHeader>
    <span>
      <Localized key={LocalizationKeys.StateNeedsAuthInfoEmailStepTitle} />
    </span>
    <CloseButton on:click={onCloseHandle} />
  </ModalHeader>
  <form on:submit|preventDefault={handleContinue}>
    <ModalSection>
      <div class="form-container">
        <div class="form-label">
          <label for="email">
            <Localized
              key={LocalizationKeys.StateNeedsAuthInfoEmailInputLabel}
            />
          </label>
        </div>
        <div class="form-input {inputClass}">
          <input
            name="email"
            placeholder={translator.translate(
              LocalizationKeys.StateNeedsAuthInfoEmailInputPlaceholder,
            )}
            autocapitalize="off"
            data-testid="email"
            bind:value={email}
          />
        </div>
        {#if errorMessage !== ""}
          <div class="form-error">{errorMessage}</div>
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
      </RowLayout>
    </ModalFooter>
  </form>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

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
    border-radius: var(--rc-shape-input-border-radius);
    font-size: 16px;
    height: 48px;
    padding: 6px 14px;
    background: var(--rc-color-input-background);
    color: inherit;
  }

  input:focus {
    outline: none;
    border: 2px solid var(--rc-color-focus);
  }
</style>
