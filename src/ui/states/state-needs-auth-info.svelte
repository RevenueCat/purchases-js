<script lang="ts">
  import Button from "../button.svelte";
  import ModalFooter from "../modal-footer.svelte";
  import ModalSection from "../modal-section.svelte";
  import RowLayout from "../layout/row-layout.svelte";
  import ModalHeader from "../modal-header.svelte";

  export let onContinue: any;
  export let onClose: () => void;

  $: email = "";
  $: error = "";
  $: inputClass = error ? "error" : "";

  const handleContinue = async () => {
    if (email.trim() === "") {
      error = "You need to provide your email address to continue.";
    } else {
      onContinue({ email });
    }
  };
</script>

<div>
  <form on:submit|preventDefault={handleContinue}>
    <ModalHeader>Billing email address</ModalHeader>
    <ModalSection>
      <div class="form-container">
        <div class="form-label"><label for="email">Email</label></div>
        <div class="form-input {inputClass}">
          <input
            name="email"
            placeholder="john@appleseed.com"
            autocapitalize="off"
            bind:value={email}
          />
        </div>
        <div class="form-error">{error}</div>
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
    margin-top: 32px;
  }

  .form-label {
    margin-top: 8px;
    margin-bottom: 8px;
    display: block;
    font-weight: 500;
    line-height: 22px;
  }

  .form-input {
    margin-bottom: 16px;
  }

  .form-input.error input {
    border-color: red;
  }

  .form-error {
    font-size: 12px;
    margin-bottom: 16px;
    line-height: 20px;
    min-height: 40px;
    color: red;
  }

  input {
    width: 100%;
    box-sizing: border-box;
    padding: 8px;
    border: 2px solid #ccc;
    border-radius: 12px;
    font-size: 16px;
    height: 48px;
    padding: 6px 14px;
  }

  input:focus {
    outline: none;
    border: 2px solid #0000c0;
  }
</style>
