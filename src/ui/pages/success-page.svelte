<script lang="ts">
  import IconSuccess from "../atoms/icons/icon-success.svelte";
  import MessageLayout from "../layout/message-layout.svelte";
  import { type Product, ProductType } from "../../entities/offerings";
  import { getContext, onMount } from "svelte";
  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";
  import Localized from "../localization/localized.svelte";

  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { SDKEventName } from "../../behavioural-events/sdk-events";
  import { type IEventsTracker } from "../../behavioural-events/events-tracker";
  import { eventsTrackerContextKey } from "../constants";
  import { type ContinueHandlerParams } from "../ui-types";
  import { type Writable } from "svelte/store";
  export let productDetails: Product;
  export let onContinue: (params?: ContinueHandlerParams) => void;

  const isSubscription =
    productDetails.productType === ProductType.Subscription;
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
  title={$translator.translate(LocalizationKeys.SuccessPagePurchaseSuccessful)}
  onDismiss={handleContinue}
  closeButtonTitle={$translator.translate(
    LocalizationKeys.SuccessPageButtonClose,
  )}
>
  {#snippet icon()}
    <IconSuccess />
  {/snippet}
  {#snippet message()}
    {#if isSubscription}
      <Localized key={LocalizationKeys.SuccessPageSubscriptionNowActive} />
    {/if}
  {/snippet}
</MessageLayout>
