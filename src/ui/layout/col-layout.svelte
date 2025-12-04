<script lang="ts">
  import { type Snippet } from "svelte";
  type Gap = "large" | "medium" | "small";
  export let gap: Gap = "small";
  export let justify: "start" | "center" | "end" = "start";
  export let align: "start" | "center" | "end" = "start";
  export let children: Snippet;
</script>

<div class="rcb-column gap-{gap} justify-{justify} align-{align}">
  {@render children?.()}
</div>

<style>
  .rcb-column {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    flex-grow: 1;
    min-width: 100%;
  }

  .rcb-column.justify-center {
    justify-content: center;
  }

  .rcb-column.justify-end {
    justify-content: flex-end;
  }

  .rcb-column.align-center {
    align-items: center;
  }

  .rcb-column.align-end {
    align-items: flex-end;
  }

  .rcb-column.gap-small {
    gap: var(--rc-spacing-gapSmall-mobile);
  }

  .rcb-column.gap-medium {
    gap: var(--rc-spacing-gapXLarge-mobile);
  }

  .rcb-column.gap-large {
    gap: var(--rc-spacing-gapXXLarge-mobile);
  }

  @container layout-query-container (width >= 768px) {
    .rcb-column.gap-small {
      gap: var(--rc-spacing-gapSmall-desktop);
    }

    .rcb-column.gap-medium {
      gap: var(--rc-spacing-gapLarge-desktop);
    }

    .rcb-column.gap-large {
      gap: var(--rc-spacing-gapXXLarge-desktop);
    }
  }
</style>
