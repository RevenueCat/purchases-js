<script lang="ts">
  import { type Snippet } from "svelte";
  type Gap = "large" | "medium" | "small";
  export let gap: Gap = "small";
  export let align: "start" | "center" | "end" = "start";
  export let children: Snippet;
</script>

<div class="rcb-column gap-{gap} align-{align}">
  {@render children?.()}
</div>

<style>
  .rcb-column {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    flex-grow: 1;
  }

  .rcb-column.align-center {
    justify-content: center;
  }

  .rcb-column.align-end {
    justify-content: flex-end;
  }

  .rcb-column.gap-small {
    gap: var(--rc-spacing-gapSmall-mobile);
  }

  .rcb-column.gap-medium {
    gap: var(--rc-spacing-gapMedium-mobile);
  }

  .rcb-column.gap-large {
    gap: var(--rc-spacing-gapXXLarge-mobile);
  }

  @container layout-query-container (width >= 768px) {
    .rcb-column.gap-small {
      gap: var(--rc-spacing-gapSmall-desktop);
    }

    .rcb-column.gap-medium {
      gap: var(--rc-spacing-gapMedium-desktop);
    }

    .rcb-column.gap-large {
      gap: var(--rc-spacing-gapXXLarge-desktop);
    }
  }
</style>
