<script module lang="ts">
  import AppWordmark from "../../ui/atoms/app-wordmark.svelte";
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import { renderInsideMain } from "../decorators/layout-decorators";
  import { brandingModes } from "../../../.storybook/modes";
  import { brandingInfos } from "../fixtures";
  import { buildAssetURL } from "../../networking/assets";
  import type { ComponentProps } from "svelte";

  let { Story } = defineMeta({
    component: AppWordmark,
    title: "Atoms/AppWordmark",
    // @ts-expect-error ignore typing of decorator
    decorators: [renderInsideMain],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
    // @ts-expect-error ignore importing before initializing
    render: template,
  });
  type Args = ComponentProps<typeof AppWordmark>;
  type Context = StoryContext<typeof AppWordmark>;
</script>

{#snippet template(_args: Args, context: Context)}
  {@const isLoading = context.story === "Loading"}
  {@const brandingInfo = brandingInfos[context.globals.brandingName]}
  {@const src =
    brandingInfo?.app_wordmark && !isLoading
      ? buildAssetURL(brandingInfo?.app_wordmark)
      : null}
  {@const srcWebp =
    brandingInfo?.app_wordmark_webp && !isLoading
      ? buildAssetURL(brandingInfo?.app_wordmark_webp)
      : null}
  {#if src}
    <AppWordmark {src} {srcWebp} />
  {/if}
{/snippet}

<Story name="Default" />
