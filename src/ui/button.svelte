<script lang="ts">
  export let intent: "primary" | "secondary" = "primary";
  export let disabled = false;
</script>

<button on:click class={`intent-${intent}`} {disabled}><slot /></button>

<style>
  button {
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: bold;
    cursor: pointer;
    margin: 0.25rem;
  }

  button.intent-primary {
    background-color: #4c78af;
    color: white;
    font-size: 0.9rem;
  }
</style>
