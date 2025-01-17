<script lang="ts">
  import { type Snippet } from "svelte";
  export let gutter = "8px";
  export let children: Snippet;
</script>

<div class="column" style={`--gap:${gutter};`}>
  {@render children?.()}
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
