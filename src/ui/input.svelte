<script lang="ts">
  export let label: string;
  export let placeholder: string;
  export let value: string;
  export let name: string;
  export let id: string;
  export let labelClass: string;
  let isFocused = false;

  function handleFocus() {
    isFocused = true;
  }

  function handleBlur() {
    if (!value) {
      isFocused = false;
    }
  }

  $: labelClass = value || isFocused ? "label label--floating" : "label";
</script>

<div class="input-container">
  <label class={labelClass} for={id}>{label}</label>
  <input
    {id}
    {name}
    {placeholder}
    bind:value
    onfocus={handleFocus}
    onblur={handleBlur}
    {...$$restProps}
  />
</div>

<style>
  input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--rc-color-grey-ui-dark);
    border-radius: var(--rc-shape-input-border-radius);
    font: var(--rc-text-body1-mobile);
    height: 55px;
    background: var(--rc-color-input-background);
    color: inherit;
    padding: 0.75rem;
    padding-top: 31px;
    transition:
      background 0.15s ease,
      border 0.15s ease,
      box-shadow 0.15s ease,
      color 0.15s ease;
  }

  .input-container {
    position: relative;
    width: 100%;
  }

  .label {
    position: absolute;
    font: var(--rc-text-body1-mobile);
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    line-height: 22px;
    transition:
      top 0.5s cubic-bezier(0.19, 1, 0.22, 1),
      transform 0.5s cubic-bezier(0.19, 1, 0.22, 1),
      opacity 0.5s cubic-bezier(0.19, 1, 0.22, 1);
  }

  .label--floating {
    font: var(--rc-text-body1-mobile);

    pointer-events: none;
    position: absolute;
    -webkit-transform-origin: top left;
    -ms-transform-origin: top left;
    transform-origin: top left;
    will-change: transform;
    z-index: 2;

    top: 0.45rem;
    transform: translateY(0%) scale(1);
    opacity: 0.8;
  }

  input::placeholder {
    color: transparent;
    transition: color 0.5s cubic-bezier(0.19, 1, 0.22, 1) 0.1s;
  }

  input:focus {
    outline: none;
    border-color: var(--rc-color-accent);
  }

  input:focus::placeholder {
    color: var(--rc-color-grey-text-light);
  }
</style>
