<script lang="ts">
  import Button from "../button.svelte";
  import ModalFooter from "../modal-footer.svelte";
  import ModalSection from "../modal-section.svelte";
  import RowLayout from "../layout/row-layout.svelte";

  export let onContinue: any;
  export let onClose: () => void;

  $: email = "";

  const handleContinue = async () => {
    onContinue({ email });
  };


</script>

<div>
  <form on:submit|preventDefault={handleContinue}>
    <ModalSection>
      <span class="title">User authentication</span>
    </ModalSection>
    <ModalSection>
      <div class="form-container">
        <div class="form-label"><label for="email">E-mail</label></div>
        <div class="form-input">
          <input
            name="email"
            placeholder="john@appleseed.com"
            bind:value={email}
          />
        </div>
      </div>
    </ModalSection>
    <ModalFooter>
      <RowLayout>
        <Button>Continue</Button>
        <Button intent="secondary" on:click={onClose}>Close</Button>
      </RowLayout>
    </ModalFooter>
  </form>
</div>

<style>
  .form-container {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .form-label {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    display: block;
  }

  .form-input {
    margin-bottom: 1rem;
  }

  .title {
    font-size: 1.5rem;
    margin: 0;
    margin-bottom: 0.5rem;
  }

  input {
    width: 94%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 0.25rem;
  }
</style>
