<script lang="ts">
  import { getStyleVariable } from "../helpers/process-style-overrides";
  import { appearanceConfigStore } from "../store/store";

  export let intent: "primary" | "secondary" = "primary";
  export let disabled = false;
  export let testId: string | undefined = undefined;
  const btnColor = getStyleVariable({
    property:
      intent === "primary" ? $appearanceConfigStore.color_buttons_primary : "",
    variableName: "btn-color",
    fallbackVariableName: "--rc-color-grey-text-dark",
  });
</script>

<button
  on:click
  class={`intent-${intent}`}
  {disabled}
  data-testid={testId}
  style={btnColor}>
  <slot />
</button
>

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
    }

    button.intent-primary {
        background-color: var(--btn-color);
        color: var(--rc-color-white);
        font-size: 16px;
    }

    button:disabled {
        color: var(--rc-color-grey-text-light);
        background-color: var(--rc-color-grey-ui-dark);
    }

    button.intent-primary:disabled {
        color: var(--rc-color-grey-text-light);
        background-color: var(--rc-color-grey-ui-dark);
    }
</style>
