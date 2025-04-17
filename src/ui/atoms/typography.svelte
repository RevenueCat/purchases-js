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
    font-size: 28px;
    line-height: 140%;
    font-weight: 600; /* SF Pro - Semibold */
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-heading-xl {
    font-size: 24px;
    line-height: 140%;
    font-weight: 600; /* SF Pro - Semibold */
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-heading-lg {
    font-size: 20px;
    line-height: 140%;
    font-weight: 600; /* SF Pro - Semibold */
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-heading-md {
    font-size: 16px;
    line-height: 140%;
    font-weight: 500; /* SF Pro - Medium */
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-body-base {
    font-size: 16px;
    line-height: 140%;
    font-weight: 400; /* SF Pro - Regular */
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-body-small {
    font-size: 14px;
    line-height: 140%;
    font-weight: 400; /* SF Pro - Regular */
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-label-button {
    font-size: 16px;
    line-height: 140%;
    font-weight: 400; /* SF Pro - Regular */
    letter-spacing: -0.2px;
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-label-default {
    font-size: 14px;
    line-height: 140%;
    font-weight: 400; /* SF Pro - Regular */
    letter-spacing: -0.2px;
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-caption-default {
    font-size: 12px;
    line-height: 140%;
    font-weight: 400; /* SF Pro - Regular */
  }

  /* svelte-ignore css-unused-selector */
  .rcb-typography-caption-link {
    font-size: 12px;
    line-height: 140%;
    font-weight: 400; /* SF Pro - Regular */
  }

  @container layout-query-container (width >= 768px) {
    /* svelte-ignore css-unused-selector */
    .rcb-typography-heading-2xl {
      font-size: 36px;
    }

    /* svelte-ignore css-unused-selector */
    .rcb-typography-heading-xl {
      font-size: 32px;
    }

    /* svelte-ignore css-unused-selector */
    .rcb-typography-heading-lg {
      font-size: 26px;
    }

    /* svelte-ignore css-unused-selector */
    .rcb-typography-heading-md {
      font-size: 18px;
    }
  }
</style>
