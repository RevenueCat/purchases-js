<script lang="ts">
  import { type Snippet } from "svelte";
  type Gap = "large" | "medium" | "small";
  export let gap: Gap = "small";
  export let align: "start" | "center" | "end" = "start";
  export let children: Snippet;
  export let icon: (() => any) | null = null;
</script>

<div class="rcb-row gap-{gap} align-{align}">
  {@render children?.()}
</div>

<style>
  .rcb-row {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
  }

  @container layout-query-container (width >= 768px) {
  }
</style>
