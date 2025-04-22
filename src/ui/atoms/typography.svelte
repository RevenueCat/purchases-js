<script module>
  import { type Snippet } from "svelte";

  type Size =
    | "heading-2xl"
    | "heading-xl"
    | "heading-lg"
    | "heading-md"
    | "body-base"
    | "body-small"
    | "label-button"
    | "label-default"
    | "caption-default"
    | "caption-link";

  type Props = {
    size?: Size;
    children?: Snippet;
  };
</script>

<script lang="ts">
  const { children, size = "body-base" }: Props = $props();
</script>

<span class="rcb-typography rcb-typography-{size}">
  {@render children?.()}
</span>

<style>
  /* svelte-ignore css-unused-selector */
  .rcb-typography-heading-2xl {
    font: var(--rc-text-heading2xl-mobile);
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-heading-xl {
    font: var(--rc-text-headingXl-mobile);
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-heading-lg {
    font: var(--rc-text-headingLg-mobile);
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-heading-md {
    font: var(--rc-text-headingMd-mobile);
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-body-base {
    font: var(--rc-text-bodyBase-mobile);
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-body-small {
    font: var(--rc-text-bodySmall-mobile);
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-label-button {
    font: var(--rc-text-labelButton-mobile);
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-label-default {
    font: var(--rc-text-labelDefault-mobile);
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-caption-default {
    font: var(--rc-text-captionDefault-mobile);
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-caption-link {
    font: var(--rc-text-captionLink-mobile);
  }

  @container layout-query-container (width >= 768px) {
    /* svelte-ignore css-unused-selector */
    .rcb-typography-heading-2xl {
      font: var(--rc-text-heading2xl-desktop);
    }

    /* svelte-ignore css-unused-selector */
    .rcb-typography-heading-xl {
      font: var(--rc-text-headingXl-desktop);
    }

    /* svelte-ignore css-unused-selector */
    .rcb-typography-heading-lg {
      font: var(--rc-text-headingLg-desktop);
    }

    /* svelte-ignore css-unused-selector */
    .rcb-typography-heading-md {
      font: var(--rc-text-headingMd-desktop);
    }

    /* svelte-ignore css-unused-selector */
    .rcb-typography-body-base {
      font: var(--rc-text-bodyBase-desktop);
    }

    /* svelte-ignore css-unused-selector */
    .rcb-typography-body-small {
      font: var(--rc-text-bodySmall-desktop);
    }

    /* svelte-ignore css-unused-selector */
    .rcb-typography-label-button {
      font: var(--rc-text-labelButton-desktop);
    }

    /* svelte-ignore css-unused-selector */
    .rcb-typography-label-default {
      font: var(--rc-text-labelDefault-desktop);
    }

    /* svelte-ignore css-unused-selector */
    .rcb-typography-caption-default {
      font: var(--rc-text-captionDefault-desktop);
    }

    /* svelte-ignore css-unused-selector */
    .rcb-typography-caption-link {
      font: var(--rc-text-captionLink-desktop);
    }
  }
</style>
