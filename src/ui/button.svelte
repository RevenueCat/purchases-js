<script lang="ts">
  export let intent: "primary" | "secondary" = "primary";
  export let disabled = false;
</script>

<button on:click class={`intent-${intent}`} {disabled}><slot /></button>

<style>
  button {
    border: none;
    border-radius: 3.5rem;
    font-size: 1rem;
    cursor: pointer;
    height: 3.5rem;
    color: black;
    background-color: #dfdfdf;
  }

  button.intent-primary {
    background-color: #000;
    color: white;
    font-size: 1rem;
  }
</style>
