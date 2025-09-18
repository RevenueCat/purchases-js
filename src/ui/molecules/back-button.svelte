<script lang="ts">
  import Icon from "../atoms/icon.svelte";

  let { disabled = false } = $props();
</script>

<button on:click {disabled} class="rcb-back-button" data-testid="close-button">
  <Icon name="back" />
</button>

<style>
  .rcb-back-button {
    padding: 8px;
    border: none;
    cursor: pointer;
    background-color: transparent;
    border-radius: 50%;
    color: var(--rc-color-grey-text-dark);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: fit-content;
    height: fit-content;
  }
</style>
