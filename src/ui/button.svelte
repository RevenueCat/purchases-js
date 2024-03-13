<script lang="ts">
  export let intent: "primary" | "secondary" = "primary";
  export let disabled = false;
</script>

<button on:click class={`intent-${intent}`} {disabled}><slot /></button>

<style>
  button {
    border: none;
    border-radius: 56px;
    font-size: 16px;
    cursor: pointer;
    height: 56px;
    color: black;
    background-color: #dfdfdf;
  }

  button.intent-primary {
    background-color: #000;
    color: white;
    font-size: 16px;
  }
</style>
