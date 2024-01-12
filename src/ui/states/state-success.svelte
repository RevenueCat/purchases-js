<script>
  import Button from "../button.svelte";
  import ModalFooter from "../modal-footer.svelte";
  import ModalSection from "../modal-section.svelte";
  import IconSuccess from "../assets/icon-success.svelte";
  import RowLayout from "../layout/row-layout.svelte";

  export let onContinue;
</script>

<RowLayout gutter="2rem">
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
    <Button intent="secondary" on:click={onContinue}>Go back to app</Button>
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
