<script lang="ts">
  import Button from "../button.svelte";
  import ModalFooter from "../modal-footer.svelte";
  import ModalSection from "../modal-section.svelte";
  import RowLayout from "../layout/row-layout.svelte";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import BrandAndCloseHeader from "../brand-and-close-header.svelte";

  export let brandingInfo: BrandingInfoResponse | null = null;
  export let onContinue: () => void;
  export let title: string;
  export let type: string;
  export let closeButtonTitle: string = "Go back to app";
</script>

<RowLayout gutter="32px">
  <BrandAndCloseHeader {brandingInfo} onClose={onContinue} />
  <ModalSection>
    <div class="rcb-modal-message" data-type={type}>
      <RowLayout gutter="16px">
        <slot name="icon" />
        <RowLayout gutter="16px">
          <span class="title">{title}</span>
          <span class="subtitle">
            <slot />
          </span>
        </RowLayout>
      </RowLayout>
    </div>
  </ModalSection>
  <ModalFooter>
    <Button on:click={onContinue}>{closeButtonTitle}</Button>
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
