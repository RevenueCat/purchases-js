<script lang="ts">
  import IconSuccess from "../atoms/icons/icon-success.svelte";
  import MessageLayout from "../layout/message-layout.svelte";
  import { getContext, onMount } from "svelte";
  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";

  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { type IEventsTracker } from "../../behavioural-events/events-tracker";
  import { eventsTrackerContextKey } from "../constants";
  import { type Writable } from "svelte/store";
  import { defaultPurchaseMode } from "../../behavioural-events/event";
  import {
    createCheckoutPurchaseSuccessfulDismissEvent,
    createCheckoutPurchaseSuccessfulImpressionEvent,
  } from "../../behavioural-events/sdk-event-helpers";

  export let onContinue: () => void;
  export let title: string | undefined = undefined;
  export let closeButtonTitle: string | undefined = undefined;
  export let fullWidth: boolean = false;

  const translator: Writable<Translator> = getContext(translatorContextKey);
  const eventsTracker = getContext(eventsTrackerContextKey) as IEventsTracker;

  function handleContinue() {
    eventsTracker.trackSDKEvent(
      createCheckoutPurchaseSuccessfulDismissEvent(
        "go_back_to_app",
        defaultPurchaseMode,
      ),
    );
    onContinue();
  }

  onMount(() => {
    eventsTracker.trackSDKEvent(
      createCheckoutPurchaseSuccessfulImpressionEvent(defaultPurchaseMode),
    );
  });
</script>

<MessageLayout
  type="success"
  title={title ??
    $translator.translate(LocalizationKeys.SuccessPagePurchaseSuccessful)}
  onDismiss={handleContinue}
  closeButtonTitle={closeButtonTitle ??
    $translator.translate(LocalizationKeys.SuccessPageButtonClose)}
  {fullWidth}
>
  {#snippet icon()}
    <IconSuccess />
  {/snippet}
</MessageLayout>
