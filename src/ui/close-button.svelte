<script lang="ts">
  import Icon from "../assets/close.svg";

  export let disabled = false;
</script>

<button on:click class="close-button" {disabled}>
  <img src={Icon} alt="close" />
</button>

<style>
  .close-button {
    border: none;
    cursor: pointer;
    background-color: transparent;
    padding: 0px;
    height: 24px;
  }
</style>
