<script lang="ts">
  import IconSuccess from "../icons/icon-success.svelte";
  import MessageLayout from "../layout/message-layout.svelte";
  import { type Product, ProductType } from "../../entities/offerings";
  import { getContext, onMount } from "svelte";
  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";
  import Localized from "../localization/localized.svelte";

  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { ContinueHandlerParams } from "../ui-types";
  import { SDKEventName } from "../../behavioural-events/sdk-events";
  import { type IEventsTracker } from "../../behavioural-events/events-tracker";
  import { eventsTrackerContextKey } from "../constants";

  export let productDetails: Product | null = null;
  export let onContinue: (params?: ContinueHandlerParams) => void;

  const isSubscription =
    productDetails?.productType === ProductType.Subscription;
  const translator: Translator =
    getContext(translatorContextKey) || Translator.fallback();
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
  title={translator.translate(LocalizationKeys.StateSuccessPurchaseSuccessful)}
  onContinue={handleContinue()}
  closeButtonTitle={translator.translate(
    LocalizationKeys.StateSuccessButtonClose,
  )}
>
  {#snippet icon()}
    <IconSuccess />
  {/snippet}
  {#snippet message()}
    {#if isSubscription}
      <Localized key={LocalizationKeys.StateSuccessSubscriptionNowActive} />
    {/if}
  {/snippet}
</MessageLayout>
