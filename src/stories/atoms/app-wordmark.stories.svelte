<script module lang="ts">
  import AppWordmark from "../../ui/atoms/app-wordmark.svelte";
  import {
    type Args,
    defineMeta,
    setTemplate,
    type StoryContext,
  } from "@storybook/addon-svelte-csf";
  import { renderInsideMain } from "../decorators/layout-decorators";
  import { brandingModes } from "../../../.storybook/modes";
  import { brandingInfos } from "../fixtures";
  import { buildAssetURL } from "../../networking/assets";

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
  });
</script>

<script lang="ts">
  setTemplate(template);
</script>

{#snippet template(
  _args: Args<typeof Story>,
  context: StoryContext<typeof Story>,
)}
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
  <AppWordmark {src} {srcWebp} />
{/snippet}

<Story name="Default" />
