<script lang="ts">
  import IconSuccess from "../atoms/icons/icon-success.svelte";
  import MessageLayout from "../layout/message-layout.svelte";
  import { getContext, onMount } from "svelte";
  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";

  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { SDKEventName } from "../../behavioural-events/sdk-events";
  import { type IEventsTracker } from "../../behavioural-events/events-tracker";
  import { eventsTrackerContextKey } from "../constants";
  import { type Writable } from "svelte/store";
  export let onContinue: () => void;
  export let title: string | undefined = undefined;
  export let closeButtonTitle: string | undefined = undefined;
  export let fullWidth: boolean = false;

  const translator: Writable<Translator> = getContext(translatorContextKey);
  const eventsTracker = getContext(eventsTrackerContextKey) as IEventsTracker;

  function handleContinue() {
    eventsTracker.trackSDKEvent({
      eventName: SDKEventName.CheckoutPurchaseSuccessfulDismiss,
      properties: {
        ui_element: "go_back_to_app",
      },
    });
    onContinue();
  }

  onMount(() => {
    eventsTracker.trackSDKEvent({
      eventName: SDKEventName.CheckoutPurchaseSuccessfulImpression,
    });
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
