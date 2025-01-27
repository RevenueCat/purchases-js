<script lang="ts">
  import { type Snippet } from "svelte";

  export let intent: "primary" | "secondary" = "primary";
  export let disabled = false;
  export let testId: string | undefined = undefined;
  export let type: "reset" | "submit" | "button" | null | undefined = undefined;

  export let children: Snippet | undefined;
</script>

<button
  on:click
  class={`intent-${intent}`}
  {disabled}
  data-testid={testId}
  {type}
>
  {@render children?.()}
</button>

<style>
  button {
    border: none;
    border-radius: var(--rc-shape-input-button-border-radius);
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

  button:focus,
  button:active {
    outline: 2px solid var(--rc-color-focus);
  }

  button.intent-primary {
    background-color: var(--rc-color-primary);
    color: var(--rc-color-primary-text);
    font-size: 16px;
  }

  button:disabled {
    color: var(--rc-color-grey-text-light);
    background-color: var(--rc-color-grey-ui-dark);
    outline: none;
  }

  button.intent-primary:disabled {
    color: var(--rc-color-grey-text-light);
    background-color: var(--rc-color-grey-ui-dark);
  }
</style>
