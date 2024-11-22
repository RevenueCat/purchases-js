<script lang="ts">
  import IconSuccess from "../icons/icon-success.svelte";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import MessageLayout from "../layout/message-layout.svelte";
  import { type Product, ProductType } from "../../entities/offerings";

  export let productDetails: Product | null = null;
  export let brandingInfo: BrandingInfoResponse | null = null;
  export let onContinue: () => void;

  const isSubscription = productDetails?.productType === ProductType.Subscription;
</script>

<MessageLayout
  type="success"
  title="Purchase successful"
  {brandingInfo}
  {onContinue}
  closeButtonTitle="Close"
>
  <IconSuccess slot="icon" />
  {#if isSubscription}
    Your subscription is now active.
  {/if}
</MessageLayout>
