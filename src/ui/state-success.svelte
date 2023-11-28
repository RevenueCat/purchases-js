<script>
  import Button from "./button.svelte";
  import ModalFooter from "./modal-footer.svelte";
  import ModalSection from "./modal-section.svelte";

  export let onContinue;
</script>

<ModalSection>
  <div class="rcb-modal-success">
    <p class="title">Success!</p>
    <p class="subtitle">You're all set.</p>
  </div>
</ModalSection>
<ModalFooter>
  <Button intent="secondary" on:click={onContinue}>Dismiss</Button>
</ModalFooter>

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
