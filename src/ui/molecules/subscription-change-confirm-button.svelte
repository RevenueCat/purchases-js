<script lang="ts">
  import Typography from "../atoms/typography.svelte";

  interface Props {
    changeType: "immediate" | "deferred";
    formattedPrice?: string | null;
    disabled?: boolean;
    confirming?: boolean;
    onclick?: () => void;
  }

  let {
    changeType,
    formattedPrice = null,
    disabled = false,
    confirming = false,
    onclick,
  }: Props = $props();

  const isDeferred = $derived(changeType === "deferred");

  const label = $derived.by(() => {
    if (confirming) {
      return "Confirming…";
    }
    if (isDeferred) {
      return "Schedule change";
    }
    if (formattedPrice) {
      return `Confirm upgrade  ∙  ${formattedPrice}`;
    }
    return "Confirm upgrade";
  });
</script>

<button
  type="button"
  class="rcb-subscription-change-confirm-button"
  class:rcb-subscription-change-confirm-button--immediate={!isDeferred}
  class:rcb-subscription-change-confirm-button--deferred={isDeferred}
  disabled={disabled || confirming}
  data-testid="SubscriptionChangeConfirmButton"
  {onclick}
>
  <Typography size="body-base">{label}</Typography>
</button>

<style>
  .rcb-subscription-change-confirm-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: var(--rc-spacing-inputHeight-mobile);
    padding: 0 21px;
    border-radius: var(--rc-shape-input-button-border-radius);
    cursor: pointer;
    font-weight: 700;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color 0.15s ease-in-out,
      border-color 0.15s ease-in-out,
      color 0.15s ease-in-out,
      opacity 0.15s ease-in-out;
  }

  .rcb-subscription-change-confirm-button:focus-visible {
    outline: 2px solid var(--rc-color-focus);
    outline-offset: 2px;
  }

  /* Immediate upgrade: standard primary button colours */
  .rcb-subscription-change-confirm-button--immediate {
    border: none;
    background-color: var(--rc-color-primary);
    color: var(--rc-color-primary-text);
  }

  .rcb-subscription-change-confirm-button--immediate:not(:disabled):hover {
    background-color: var(--rc-color-primary-hover);
  }

  .rcb-subscription-change-confirm-button--immediate:not(:disabled):active {
    background-color: var(--rc-color-primary-pressed);
  }

  /* Deferred / downgrade: brand outline */
  .rcb-subscription-change-confirm-button--deferred {
    border: 1px solid var(--rc-color-primary);
    background-color: var(--rc-color-white);
    color: var(--rc-color-primary);
  }

  .rcb-subscription-change-confirm-button--deferred:not(:disabled):hover {
    background-color: color-mix(
      in srgb,
      var(--rc-color-primary) 6%,
      var(--rc-color-white)
    );
  }

  .rcb-subscription-change-confirm-button--deferred:not(:disabled):active {
    background-color: color-mix(
      in srgb,
      var(--rc-color-primary) 12%,
      var(--rc-color-white)
    );
  }

  .rcb-subscription-change-confirm-button:disabled {
    cursor: not-allowed;
    color: var(--rc-color-grey-text-light);
    background-color: var(--rc-color-grey-ui-light);
    border-color: transparent;
  }

  @container layout-query-container (width >= 768px) {
    .rcb-subscription-change-confirm-button {
      height: var(--rc-spacing-inputHeight-desktop);
    }
  }
</style>
