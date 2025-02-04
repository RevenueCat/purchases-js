<script lang="ts">
  import IconSuccess from "../icons/icon-success.svelte";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import MessageLayout from "../layout/message-layout.svelte";
  import { type Product, ProductType } from "../../entities/offerings";
  import { getContext, onMount } from "svelte";
  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";
  import Localized from "../localization/localized.svelte";

  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { TrackedEventName } from "../../behavioural-events/sdk-events";
  import { type IEventsTracker } from "../../behavioural-events/events-tracker";
  import { eventsTrackerContextKey } from "../constants";

  export let productDetails: Product | null = null;
  export let brandingInfo: BrandingInfoResponse | null = null;
  export let onContinue: () => void;

  const isSubscription =
    productDetails?.productType === ProductType.Subscription;
  const translator: Translator =
    getContext(translatorContextKey) || Translator.fallback();
  const eventsTracker = getContext(eventsTrackerContextKey) as IEventsTracker;

  function handleContinue() {
    eventsTracker.trackSDKEvent({
      eventName: TrackedEventName.PurchaseSuccessfulDismiss,
      properties: {
        buttonPressed: "go_back_to_app",
      },
    });
    onContinue();
  }

  function handleClose() {
    eventsTracker.trackSDKEvent({
      eventName: TrackedEventName.PurchaseSuccessfulDismiss,
      properties: {
        buttonPressed: "close",
      },
    });
    onContinue();
  }

  onMount(() => {
    eventsTracker.trackSDKEvent({
      eventName: TrackedEventName.PurchaseSuccessfulImpression,
    });
  });
</script>

<MessageLayout
  type="success"
  title={translator.translate(LocalizationKeys.StateSuccessPurchaseSuccessful)}
  {brandingInfo}
  onContinue={handleContinue}
  onClose={handleClose}
  closeButtonTitle={translator.translate(
    LocalizationKeys.StateSuccessButtonClose,
  )}
>
  <IconSuccess slot="icon" />
  {#if isSubscription}
    <Localized key={LocalizationKeys.StateSuccessSubscriptionNowActive} />
  {/if}
</MessageLayout>
