<script lang="ts">
  import { type Snippet } from "svelte";
  type Gap = "large" | "medium" | "small";
  export let gap: Gap = "small";
  export let align: "start" | "center" | "end" = "start";
  export let children: Snippet;
</script>

<div class="column gap-{gap} align-{align}">
  {@render children?.()}
</div>

<style>
  .column {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    flex-grow: 1;
  }

  .column.align-center {
    justify-content: center;
  }

  .column.align-end {
    justify-content: flex-end;
  }

  .column.gap-small {
    gap: var(--rc-spacing-gapSmall-mobile);
  }

  .column.gap-medium {
    gap: var(--rc-spacing-gapMedium-mobile);
  }

  .column.gap-large {
    gap: var(--rc-spacing-gapXXLarge-mobile);
  }

  @container layout-query-container (width > 768px) {
    .column.gap-small {
      gap: var(--rc-spacing-gapSmall-desktop);
    }

    .column.gap-medium {
      gap: var(--rc-spacing-gapMedium-desktop);
    }

    .column.gap-large {
      gap: var(--rc-spacing-gapXXLarge-desktop);
    }
  }
</style>
