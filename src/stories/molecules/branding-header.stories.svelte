<script module lang="ts">
  import BrandingHeader from "../../ui/molecules/branding-header.svelte";
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import { brandingInfos } from "../fixtures";
  import { renderInsideNavbarHeader } from "../decorators/layout-decorators";
  import { mobileAndDesktopBrandingModes } from "../../../.storybook/modes";
  import type { ComponentProps } from "svelte";

  let { Story } = defineMeta({
    component: BrandingHeader,
    args: {
      showCloseButton: false,
      onClose: () => {},
    },
    // @ts-expect-error ignore typing of decorator
    decorators: [renderInsideNavbarHeader],
    parameters: {
      chromatic: {
        modes: mobileAndDesktopBrandingModes,
      },
    },
    title: "Molecules/BrandingHeader",
    // @ts-expect-error ignore importing before initializing
    render: template,
  });
  type Args = ComponentProps<typeof BrandingHeader>;
  type Context = StoryContext<typeof BrandingHeader>;
</script>

{#snippet template(args: Args, context: Context)}
  {@const brandingInfo = brandingInfos[context.globals.brandingName]}
  <BrandingHeader
    {brandingInfo}
    showCloseButton={args.showCloseButton ?? false}
    onClose={args.onClose}
  />
{/snippet}

<Story name="Default" />

<Story
  name="With Close Button"
  args={{ showCloseButton: true, onClose: () => {} }}
/>
