<script lang="ts">
  import { getStyleVariable } from "../helpers/process-style-overrides";
  import { appearanceConfigStore } from "../store/store";

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
