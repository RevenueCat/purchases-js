<script lang="ts">
  export let intent: "primary" | "secondary" = "primary";
  export let disabled = false;
  export let id: string | undefined = undefined;
</script>

<button on:click class={`intent-${intent}`} {disabled} {id}><slot /></button>

<style>
  button {
    border: none;
    border-radius: 56px;
    font-size: 16px;
    cursor: pointer;
    height: 56px;
    color: var(--rc-color-grey-text-dark);
    background-color: var(--rc-color-grey-ui-dark);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  button.intent-primary {
    background-color: var(--rc-color-grey-text-dark);
    color: var(--rc-color-white);
    font-size: 16px;
  }

  button:disabled {
    color: var(--rc-color-grey-text-light);
  }

  button.intent-primary:disabled {
    color: var(--rc-color-grey-text-light);
  }
</style>
