<script lang="ts">
  import IconArrow from "./icons/icon-arrow.svelte";
  import Localized from "./localization/localized.svelte";

  export let disabled = false;
</script>

<button on:click class="rcb-back-button" {disabled} data-testid="close-button">
  <IconArrow className="back" />
  <div>
    <Localized>Back</Localized>
  </div>
</button>

<style>
  .rcb-back-button {
    border: none;
    cursor: pointer;
    background-color: transparent;
    padding: 0;
    height: 24px;
    border-radius: 50%;
    color: var(--rc-color-grey-text-dark);
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
