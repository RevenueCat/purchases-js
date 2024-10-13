<script lang="ts">
  export let intent: "primary" | "secondary" = "primary";
  export let disabled = false;
  export let testId: string | undefined = undefined;
</script>

<button on:click class={`intent-${intent}`} {disabled} data-testid={testId}
  ><slot /></button
>

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
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    -webkit-tap-highlight-color: transparent;
  }

  button:focus {
    outline: 2px solid var(--rc-color-focus);
  }

  button:active {
    /* This should be a color that contrasts with the form background and the button, the current solution is not ideal*/
    outline: 2px solid var(--rc-color-grey-text-dark);
  }

  button.intent-primary {
    background-color: var(--rc-color-button-primary-bg);
    color: var(--rc-color-button-primary-text);
    font-size: 16px;
  }

  button:disabled {
    color: var(--rc-color-grey-text-light);
  }

  button.intent-primary:disabled {
    color: var(--rc-color-grey-text-light);
  }
</style>
