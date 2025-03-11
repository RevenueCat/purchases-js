<script lang="ts">
  import Icon from "../assets/close.svg?raw";

  export let disabled = false;
</script>

<button on:click class="rcb-close-button" {disabled} data-testid="close-button">
  {@html Icon}
</button>

<style>
  .rcb-close-button {
    border: none;
    cursor: pointer;
    background-color: transparent;
    padding: 0;
    height: 24px;
    width: 24px;
    padding: 4px;
    border-radius: 50%;
    color: var(--rc-color-grey-text-light);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .rcb-close-button:active {
    transition: outline 0.1s ease-in-out;
    outline: 2px solid var(--rc-color-focus);
  }

  .rcb-close-button:hover {
    color: var(--rc-color-grey-text-dark);
  }
</style>
