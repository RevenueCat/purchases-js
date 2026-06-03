<script lang="ts">
  import FullscreenTemplate from "./layout/fullscreen-template.svelte";
  import { type BrandingInfoResponse } from "../networking/responses/branding-response";
  import { PADDLE_INLINE_FRAME_TARGET } from "../paddle/paddle-service";

  interface Props {
    brandingInfo: BrandingInfoResponse | null;
    isSandbox: boolean;
    isInElement: boolean;
  }

  const { brandingInfo, isSandbox, isInElement }: Props = $props();
</script>

<FullscreenTemplate {brandingInfo} {isInElement} {isSandbox}>
  {#snippet mainContent()}
    <!-- Paddle injects its inline checkout iframe into this container (its
         frameTarget className). The element must already exist in the DOM when
         PaddleService.purchase() calls Paddle.Checkout.open(). -->
    <div
      class={PADDLE_INLINE_FRAME_TARGET}
      data-testid="paddle-inline-checkout-container"
      style="width: 100%; min-height: 450px;"
    ></div>
  {/snippet}
</FullscreenTemplate>
