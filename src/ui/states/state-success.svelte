<script lang="ts">
  import IconSuccess from "../icons/icon-success.svelte";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import MessageLayout from "../layout/message-layout.svelte";
  import { type Product, ProductType } from "../../entities/offerings";
  import { getContext } from "svelte";
  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";
  import Localized from "../localization/localized.svelte";

  export let productDetails: Product | null = null;
  export let brandingInfo: BrandingInfoResponse | null = null;
  export let onContinue: () => void;

  const isSubscription = productDetails?.productType === ProductType.Subscription;
  const translator: Translator = getContext(translatorContextKey) || Translator.fallback();
  // TODO: Continue from here
</script>

<MessageLayout
  type="success"
  title={translator.translate("state_success.purchase_successful")}
  {brandingInfo}
  {onContinue}
  closeButtonTitle={translator.translate("state_success.button_close")}
>
  <IconSuccess slot="icon" />
  {#if isSubscription}
    <Localized
      labelId="state_success.subscription_now_active"
    />
  {/if}
</MessageLayout>
