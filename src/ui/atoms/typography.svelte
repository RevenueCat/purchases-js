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
    branded?: boolean;
  };
</script>

<script lang="ts">
  const { children, size = "body-base", branded = false }: Props = $props();
</script>

<span
  class="rcb-typography rcb-typography-{size} {branded
    ? 'rcb-typography-branded'
    : ''}"
>
  {@render children?.()}
</span>

<style>
  .rcb-typography {
    display: inline-block;
    line-height: normal;
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-heading-2xl {
    font: var(--rc-text-heading2xl-mobile);
  }

  .rcb-typography-heading-2xl.rcb-typography-branded {
    font: var(--rc-text-heading2xl-branded-mobile);
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-heading-xl {
    font: var(--rc-text-headingXl-mobile);
  }

  .rcb-typography-heading-xl.rcb-typography-branded {
    font: var(--rc-text-headingXl-branded-mobile);
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-heading-lg {
    font: var(--rc-text-headingLg-mobile);
  }

  .rcb-typography-heading-lg.rcb-typography-branded {
    font: var(--rc-text-headingLg-branded-mobile);
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-heading-md {
    font: var(--rc-text-headingMd-mobile);
  }

  .rcb-typography-heading-md.rcb-typography-branded {
    font: var(--rc-text-headingMd-branded-mobile);
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-body-base {
    font: var(--rc-text-bodyBase-mobile);
  }

  .rcb-typography-body-base.rcb-typography-branded {
    font: var(--rc-text-bodyBase-branded-mobile);
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-body-small {
    font: var(--rc-text-bodySmall-mobile);
  }

  .rcb-typography-body-small.rcb-typography-branded {
    font: var(--rc-text-bodySmall-branded-mobile);
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-label-button {
    font: var(--rc-text-labelButton-mobile);
  }

  .rcb-typography-label-button.rcb-typography-branded {
    font: var(--rc-text-labelButton-branded-mobile);
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-label-default {
    font: var(--rc-text-labelDefault-mobile);
  }

  .rcb-typography-label-default.rcb-typography-branded {
    font: var(--rc-text-labelDefault-branded-mobile);
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-caption-default {
    font: var(--rc-text-captionDefault-mobile);
  }

  .rcb-typography-caption-default.rcb-typography-branded {
    font: var(--rc-text-captionDefault-branded-mobile);
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-caption-link {
    font: var(--rc-text-captionLink-mobile);
  }

  .rcb-typography-caption-link.rcb-typography-branded {
    font: var(--rc-text-captionLink-branded-mobile);
  }

  @container layout-query-container (width >= 768px) {
    span.rcb-typography-branded {
      font: var(--rc-text-brandedText-font-style-desktop);
    }

    /* svelte-ignore css-unused-selector */
    .rcb-typography-heading-2xl {
      font: var(--rc-text-heading2xl-desktop);
    }

    .rcb-typography-heading-2xl.rcb-typography-branded {
      font: var(--rc-text-heading2xl-branded-desktop);
    }

    /* svelte-ignore css-unused-selector */
    .rcb-typography-heading-xl {
      font: var(--rc-text-headingXl-desktop);
    }

    .rcb-typography-heading-xl.rcb-typography-branded {
      font: var(--rc-text-headingXl-branded-desktop);
    }

    /* svelte-ignore css-unused-selector */
    .rcb-typography-heading-lg {
      font: var(--rc-text-headingLg-desktop);
    }

    .rcb-typography-heading-lg.rcb-typography-branded {
      font: var(--rc-text-headingLg-branded-desktop);
    }

    /* svelte-ignore css-unused-selector */
    .rcb-typography-heading-md {
      font: var(--rc-text-headingMd-desktop);
    }

    .rcb-typography-heading-md.rcb-typography-branded {
      font: var(--rc-text-headingMd-branded-desktop);
    }

    /* svelte-ignore css-unused-selector */
    .rcb-typography-body-base {
      font: var(--rc-text-bodyBase-desktop);
    }

    .rcb-typography-body-base.rcb-typography-branded {
      font: var(--rc-text-bodyBase-branded-desktop);
    }

    /* svelte-ignore css-unused-selector */
    .rcb-typography-body-small {
      font: var(--rc-text-bodySmall-desktop);
    }

    .rcb-typography-body-small.rcb-typography-branded {
      font: var(--rc-text-bodySmall-branded-desktop);
    }

    /* svelte-ignore css-unused-selector */
    .rcb-typography-label-button {
      font: var(--rc-text-labelButton-desktop);
    }

    .rcb-typography-label-button.rcb-typography-branded {
      font: var(--rc-text-labelButton-branded-desktop);
    }

    /* svelte-ignore css-unused-selector */
    .rcb-typography-label-default {
      font: var(--rc-text-labelDefault-desktop);
    }

    .rcb-typography-label-default.rcb-typography-branded {
      font: var(--rc-text-labelDefault-branded-desktop);
    }

    /* svelte-ignore css-unused-selector */
    .rcb-typography-caption-default {
      font: var(--rc-text-captionDefault-desktop);
    }

    .rcb-typography-caption-default.rcb-typography-branded {
      font: var(--rc-text-captionDefault-branded-desktop);
    }

    /* svelte-ignore css-unused-selector */
    .rcb-typography-caption-link {
      font: var(--rc-text-captionLink-desktop);
    }

    .rcb-typography-caption-link.rcb-typography-branded {
      font: var(--rc-text-captionLink-branded-desktop);
    }
  }
</style>
