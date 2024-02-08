<script lang="ts">
  import Button from "../button.svelte";
  import ModalFooter from "../modal-footer.svelte";
  import ModalSection from "../modal-section.svelte";
  import IconSuccess from "../assets/icon-success.svelte";
  import RowLayout from "../layout/row-layout.svelte";
  import BrandAndCloseHeader from "../brand-and-close-header.svelte";
  import { BrandingInfoResponse } from "../../networking/responses/branding-response";

  export let brandingInfo: BrandingInfoResponse | null = null;
  export let onContinue: () => void;
</script>

<RowLayout gutter="2rem">
  <BrandAndCloseHeader brandingInfo={brandingInfo} onClose={onContinue} />
  <ModalSection>
    <div class="rcb-modal-success">
      <RowLayout gutter="1rem">
        <IconSuccess />
        <RowLayout gutter="1rem">
          <span class="title">Purchase Successful</span>
          <span class="subtitle">Your plan is now active.</span>
        </RowLayout>
      </RowLayout>
    </div>
  </ModalSection>
  <ModalFooter>
    <Button on:click={onContinue}>Go back to app</Button>
  </ModalFooter>
</RowLayout>

<style>
  .rcb-modal-success {
    width: 100%;
    min-height: 10rem;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    text-align: center;
  }

  .title {
    font-size: 24px;
  }

  .subtitle {
    font-size: 16px;
  }
</style>
