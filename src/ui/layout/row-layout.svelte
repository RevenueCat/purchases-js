<script>
  export let gutter = "0.5rem";
</script>

<div class="column" style={`--gap:${gutter};`}>
  <slot />
</div>

<style>
  .column {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: var(--gap, "0.5rem");
  }
</style>
