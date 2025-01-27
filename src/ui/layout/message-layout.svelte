<script lang="ts">
  import Button from "../button.svelte";
  import ModalFooter from "../modal-footer.svelte";
  import ModalSection from "../modal-section.svelte";
  import RowLayout from "../layout/row-layout.svelte";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import BrandAndCloseHeader from "../brand-and-close-header.svelte";

  export let brandingInfo: BrandingInfoResponse | null = null;
  export let onContinue: () => void;
  export let onClose: () => void;
  export let title: string | null = null;
  export let type: string;
  export let closeButtonTitle: string = "Go back to app";
  export let icon: (() => any) | null = null;
  export let message;
</script>

<RowLayout gutter="32px">
  {#if title}
    <BrandAndCloseHeader {brandingInfo} {onClose} />
  {/if}
  <ModalSection>
    <div class="rcb-modal-message" data-type={type} data-has-title={!!title}>
      <RowLayout gutter="48px">
        {#if icon}
          {@render icon()}
        {/if}
        <RowLayout gutter="16px">
          {#if title}
            <span class="title">{title}</span>
          {/if}
          {#if message}
            <span class="subtitle">
              {@render message()}
            </span>
          {/if}
        </RowLayout>
      </RowLayout>
    </div>
  </ModalSection>
  <ModalFooter>
    <Button on:click={onContinue} type="submit">{closeButtonTitle}</Button>
  </ModalFooter>
</RowLayout>

<style>
  .rcb-modal-message {
    width: 100%;
    min-height: 160px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    text-align: center;
    margin-bottom: 16px;
    margin-top: 16px;
  }

  .rcb-modal-message[data-has-title="false"] {
    margin-top: 80px;
  }

  .title {
    font-size: 24px;
    line-height: 1.25em;
  }

  .subtitle {
    font-size: 16px;
    line-height: 1.25em;
    overflow-wrap: anywhere;
  }
</style>
