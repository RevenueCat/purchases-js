<script lang="ts">
  import { type Snippet } from "svelte";
  import ProcessingAnimation from "../atoms/processing-animation.svelte";

  export let intent: "primary" = "primary";
  export let disabled = false;
  export let testId: string | undefined = undefined;
  export let type: "reset" | "submit" | "button" | null | undefined = undefined;
  export let loading: boolean = false;

  export let children: Snippet | undefined;
</script>

<button
  on:click
  class={`intent-${intent}`}
  {disabled}
  data-testid={testId}
  {type}
>
  {#if loading}
    <ProcessingAnimation size="small" />
  {:else}
    {@render children?.()}
  {/if}
</button>

<style>
  button {
    border: none;
    border-radius: var(--rc-shape-input-button-border-radius);
    font-size: 16px;
    cursor: pointer;
    height: var(--rc-spacing-inputHeight-mobile);
    color: var(--rc-color-grey-text-dark);
    background-color: var(--rc-color-grey-ui-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    -webkit-tap-highlight-color: transparent;
    transition: background-color 0.15s ease-in-out;
    user-select: none;
  }

  @container layout-query-container (width >= 768px) {
    button {
      height: var(--rc-spacing-inputHeight-desktop);
    }
  }

  /* focus-visible is triggered only when focused with keyboard/reader */
  button:focus-visible {
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

  button.intent-primary:not(:disabled):hover {
    background-color: var(--rc-color-primary-hover);
  }

  button.intent-primary:not(:disabled):active,
  button:active {
    background-color: var(--rc-color-primary-pressed);
    outline: none;
  }

  button.intent-primary:disabled {
    color: var(--rc-color-grey-text-light);
    background-color: var(--rc-color-grey-ui-dark);
  }
</style>
