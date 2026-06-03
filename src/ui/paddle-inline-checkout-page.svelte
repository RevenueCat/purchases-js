<script lang="ts">
  import FullscreenTemplate from "./layout/fullscreen-template.svelte";
  import CloseButton from "./molecules/close-button.svelte";
  import { type BrandingInfoResponse } from "../networking/responses/branding-response";
  import { PADDLE_INLINE_FRAME_TARGET } from "../paddle/paddle-service";

  interface Props {
    brandingInfo: BrandingInfoResponse | null;
    isSandbox: boolean;
    isInElement: boolean;
    onClose: () => void;
  }

  const { brandingInfo, isSandbox, isInElement, onClose }: Props = $props();
</script>

<FullscreenTemplate {brandingInfo} {isInElement} {isSandbox}>
  {#snippet mainContent()}
    <div class="rcb-paddle-inline-checkout">
      {#if !isInElement}
        <!-- Inline checkout has no Paddle-provided dismiss (unlike the overlay
             modal), so we render our own close affordance to cancel. -->
        <div class="rcb-paddle-inline-checkout-header">
          <CloseButton on:click={onClose} />
        </div>
      {/if}
      <!-- Paddle injects its inline checkout iframe into this container (its
           frameTarget className). The element must already exist in the DOM when
           PaddleService.purchase() calls Paddle.Checkout.open(). -->
      <div
        class={PADDLE_INLINE_FRAME_TARGET}
        data-testid="paddle-inline-checkout-container"
        style="width: 100%; min-height: 450px;"
      ></div>
    </div>
  {/snippet}
</FullscreenTemplate>

<style>
  .rcb-paddle-inline-checkout {
    width: 100%;
  }

  .rcb-paddle-inline-checkout-header {
    display: flex;
    justify-content: flex-end;
    width: 100%;
  }
</style>
