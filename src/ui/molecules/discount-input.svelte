<script lang="ts">
  import Icon from "../atoms/icon.svelte";

  export let showDiscountCodeField = false;
  export let discountCode = "";
  export let appliedDiscountCode: string | null = null;
  export let appliedDiscountPercentage: number | null = null;
  export let discountCodeError: string | null = null;
  export let isUpdatingDiscountCode = false;
  export let isDiscountCodeControlsEnabled = false;
  export let onDiscountCodeChange:
    | ((discountCode: string) => void)
    | undefined = undefined;
  export let onApplyDiscountCode: (() => void | Promise<void>) | undefined =
    undefined;
  export let onRemoveDiscountCode: (() => void | Promise<void>) | undefined =
    undefined;

  let isDiscountCodeFocused = false;

  const normalizeDiscountCode = (value: string) => value.toUpperCase();

  const handleDiscountCodeInput = () => {
    discountCode = normalizeDiscountCode(discountCode);
    onDiscountCodeChange?.(discountCode);
  };

  const handleDiscountCodeKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    event.stopPropagation();

    if (!isApplyButtonEnabled) return;

    onApplyDiscountCode?.();
  };

  $: hasDiscountCodeValue = discountCode.trim().length > 0;
  $: isDiscountFieldFloating = isDiscountCodeFocused || hasDiscountCodeValue;
  $: isApplyButtonEnabled =
    isDiscountCodeControlsEnabled &&
    !isUpdatingDiscountCode &&
    hasDiscountCodeValue;
  $: displayDiscountCodeError =
    discountCodeError === "Enter a discount code."
      ? discountCodeError
      : "Code can’t be applied.";
  $: appliedDiscountLabel =
    appliedDiscountPercentage === null
      ? null
      : `${appliedDiscountPercentage}% off`;
  $: displayAppliedDiscountCode = appliedDiscountCode
    ? normalizeDiscountCode(appliedDiscountCode)
    : null;
</script>

<div class="rcb-product-price-container">
  {#if appliedDiscountCode}
    <div class="rcb-applied-discount">
      {#if isDiscountCodeControlsEnabled}
        <button
          class="rcb-applied-discount-chip"
          type="button"
          disabled={isUpdatingDiscountCode}
          aria-label={`Remove promo code ${displayAppliedDiscountCode}`}
          onclick={() => onRemoveDiscountCode?.()}
        >
          <span class="rcb-applied-discount-code"
            >{displayAppliedDiscountCode}</span
          >
          <span class="rcb-applied-discount-icon" aria-hidden="true">
            <Icon name="close" />
          </span>
        </button>
      {:else}
        <div
          class="rcb-applied-discount-chip rcb-applied-discount-chip--static"
        >
          <span class="rcb-applied-discount-code"
            >{displayAppliedDiscountCode}</span
          >
        </div>
      {/if}
      {#if appliedDiscountLabel}
        <div class="rcb-applied-discount-label">{appliedDiscountLabel}</div>
      {/if}
    </div>
  {:else if showDiscountCodeField}
    <div class="rcb-discount-input">
      <div class="rcb-discount-input-row">
        <div
          class="rcb-discount-field"
          class:rcb-discount-field--focused={isDiscountCodeFocused}
          class:rcb-discount-field--floating={isDiscountFieldFloating}
        >
          <label class="rcb-discount-field-label" for="rc-discount-code">
            Promo code
          </label>

          <input
            class="rcb-discount-field-input"
            id="rc-discount-code"
            type="text"
            bind:value={discountCode}
            autocomplete="off"
            placeholder=" "
            aria-invalid={!!discountCodeError}
            disabled={isUpdatingDiscountCode || !isDiscountCodeControlsEnabled}
            onfocus={() => (isDiscountCodeFocused = true)}
            onblur={() => (isDiscountCodeFocused = false)}
            oninput={handleDiscountCodeInput}
            onkeydown={handleDiscountCodeKeyDown}
          />
        </div>
        <button
          class="rcb-discount-action-button"
          class:rcb-discount-action-button--enabled={isApplyButtonEnabled}
          type="button"
          disabled={isUpdatingDiscountCode ||
            !isDiscountCodeControlsEnabled ||
            !discountCode.trim()}
          onclick={() => onApplyDiscountCode?.()}
        >
          {isUpdatingDiscountCode ? "Applying..." : "Apply"}
        </button>
      </div>
      {#if discountCodeError}
        <div class="rcb-discount-error" role="alert">
          <span class="rcb-discount-error-icon" aria-hidden="true">
            <Icon name="warning" />
          </span>
          <span>{displayDiscountCodeError}</span>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .rcb-product-price-container {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: var(--rc-spacing-gapMedium-mobile);
    color: var(--rc-color-grey-text-dark);
  }

  .rcb-discount-input {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .rcb-discount-input-row {
    display: flex;
    gap: 8px;
    width: 100%;
  }

  .rcb-discount-field {
    position: relative;
    display: flex;
    align-items: flex-end;
    flex: 1 1 auto;
    min-width: 0;
    min-height: 48px;
    padding: 4px 12px;
    border: 1px solid var(--rc-color-grey-ui-dark);
    border-radius: var(--rc-shape-input-border-radius);
    background: var(--rc-color-background);
    transition: border-color 150ms ease;
  }

  .rcb-discount-field--focused {
    border-color: var(--rc-color-focus);
  }

  .rcb-discount-field-label {
    position: absolute;
    top: 50%;
    left: 12px;
    max-width: calc(100% - 24px);
    overflow: hidden;
    color: var(--rc-color-grey-text-light);
    font: var(--rc-text-bodySmall-mobile);
    text-overflow: ellipsis;
    pointer-events: none;
    transform: translateY(-50%);
    transform-origin: left top;
    transition:
      top 150ms ease,
      transform 150ms ease,
      font-size 150ms ease,
      color 150ms ease;
    white-space: nowrap;
  }

  .rcb-discount-field--floating .rcb-discount-field-label {
    top: 8px;
    font-size: 12px;
    transform: translateY(0);
  }

  .rcb-discount-field-input {
    width: 100%;
    min-width: 0;
    padding: 14px 0 0;
    border: none;
    outline: none;
    background: transparent;
    color: var(--rc-color-grey-text-dark);
    font: var(--rc-text-bodySmall-mobile);
  }

  .rcb-discount-field-input::placeholder {
    color: transparent;
  }

  .rcb-discount-field-input:disabled {
    cursor: not-allowed;
  }

  .rcb-discount-action-button {
    flex: 0 0 auto;
    min-width: 82px;
    min-height: 48px;
    padding: 0 16px;
    border: none;
    border-radius: var(--rc-shape-input-button-border-radius);
    background-color: var(--rc-color-grey-ui-light);
    color: var(--rc-color-grey-text-light);
    font: var(--rc-text-labelButton-mobile);
    transition:
      background-color 150ms ease,
      color 150ms ease,
      opacity 150ms ease;
  }

  .rcb-discount-action-button--enabled {
    background-color: var(--rc-color-primary);
    color: var(--rc-color-primary-text);
    cursor: pointer;
  }

  .rcb-discount-action-button:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .rcb-discount-error {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--rc-color-grey-text-dark);
    font: var(--rc-text-bodySmall-mobile);
  }

  .rcb-discount-error-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 16px;
    height: 16px;
  }

  .rcb-discount-error-icon :global(svg) {
    display: block;
    width: 16px;
    height: 16px;
  }

  .rcb-applied-discount {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    max-width: 100%;
  }

  .rcb-applied-discount-chip {
    --arrow-fill-color: var(--rc-color-grey-text-dark);

    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
    max-width: 100%;
    padding: 0 8px 0 8px;
    border: 1px solid var(--rc-color-grey-text-light);
    border-radius: var(--rc-shape-input-button-border-radius);
    background-color: var(--rc-color-grey-ui-light);
    color: var(--rc-color-grey-text-dark);
    font: var(--rc-text-bodySmall-mobile);
    font-weight: 500;
    transition:
      background-color 150ms ease,
      border-color 150ms ease,
      opacity 150ms ease;
  }

  button.rcb-applied-discount-chip {
    cursor: pointer;
  }

  .rcb-applied-discount-chip--static {
    cursor: default;
  }

  button.rcb-applied-discount-chip:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .rcb-applied-discount-code {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 4px 0;
  }

  .rcb-applied-discount-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    color: var(--rc-color-grey-text-light);
  }

  .rcb-applied-discount-icon :global(svg) {
    width: 16px;
    height: 16px;
  }

  .rcb-applied-discount-label {
    color: var(--rc-color-grey-text-light);
    font: var(--rc-text-bodySmall-mobile);
  }
</style>
