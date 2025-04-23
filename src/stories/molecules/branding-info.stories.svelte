<script module>
  import BrandingInfo from "../../ui/molecules/branding-info.svelte";
  import {
    type Args,
    defineMeta,
    setTemplate,
    type StoryContext,
  } from "@storybook/addon-svelte-csf";
  import { brandingInfos } from "../fixtures";
  import { renderInsideNavbarHeader } from "../decorators/layout-decorators";
  import { mobileAndDesktopBrandingModes } from "../../../.storybook/modes";

  let { Story } = defineMeta({
    component: BrandingInfo,
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
    title: "Molecules/Branding Info",
  });
</script>

<script lang="ts">
  setTemplate(template);
</script>

{#snippet template(
  args: Args<typeof Story>,
  context: StoryContext<typeof Story>,
)}
  {@const brandingInfo = brandingInfos[context.globals.brandingName]}
  <BrandingInfo
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
