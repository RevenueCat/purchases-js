<script lang="ts">
  import IconSuccess from "../icons/icon-success.svelte";
  import MessageLayout from "../layout/message-layout.svelte";
  import { type Product, ProductType } from "../../entities/offerings";
  import { getContext } from "svelte";
  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";
  import Localized from "../localization/localized.svelte";

  import { LocalizationKeys } from "../localization/supportedLanguages";

  export let productDetails: Product | null = null;
  export let onContinue: () => void;

  const isSubscription =
    productDetails?.productType === ProductType.Subscription;
  const translator: Translator =
    getContext(translatorContextKey) || Translator.fallback();
</script>

<MessageLayout
  type="success"
  title={translator.translate(LocalizationKeys.StateSuccessPurchaseSuccessful)}
  {onContinue}
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
