<script>
  export let gutter = "8px";
</script>

<div class="column" style={`--gap:${gutter};`}>
  <slot />
</div>

<style>
  .column {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: var(--gap, "8px");
    flex-grow: 1;
  }
</style>
