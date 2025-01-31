<script lang="ts">
  import Icon from "../assets/close.svg?raw";

  export let disabled = false;
</script>

<button on:click class="close-button" {disabled} data-testid="close-button">
  <div>
    {@html Icon}
  </div>
</button>

<style>
  .close-button {
    border: none;
    cursor: pointer;
    background-color: transparent;
    padding: 0px;
    height: 24px;
    border-radius: 50%;
    color: var(--rc-color-grey-text-light);
  }

  .close-button:focus {
    outline: 2px solid var(--rc-color-focus);
  }
  .close-button:hover {
    color: var(--rc-color-grey-text-dark);
  }
</style>
