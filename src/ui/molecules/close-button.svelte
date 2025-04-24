<script lang="ts">
  import Icon from "../atoms/icon.svelte";
</script>

<button on:click class="rcb-close-button" data-testid="close-button">
  <Icon name="close" />
</button>

<style>
  .rcb-close-button {
    padding: 10px;
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

  .rcb-close-button:active {
    transition: outline 0.1s ease-in-out;
    outline: 2px solid var(--rc-color-focus);
  }

  .rcb-close-button:hover {
    color: var(--rc-color-grey-text-dark);
  }
</style>
