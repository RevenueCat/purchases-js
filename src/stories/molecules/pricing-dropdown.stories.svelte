<script module lang="ts">
  import { default as Dropdown } from "../../ui/molecules/pricing-dropdown.svelte";
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import { renderInsideNavbarBody } from "../decorators/layout-decorators";
  import { mobileAndDesktopBrandingModes } from "../../../.storybook/modes";
  import type { ComponentProps } from "svelte";

  let { Story } = defineMeta({
    component: Dropdown,
    title: "Molecules/PricingDropdown",
    // @ts-expect-error ignore typing of decorator
    decorators: [renderInsideNavbarBody],
    parameters: {
      chromatic: {
        modes: mobileAndDesktopBrandingModes,
      },
    },
    // @ts-expect-error ignore importing before initializing
    render: template,
  });
  type Args = ComponentProps<typeof Dropdown>;
  type Context = StoryContext<typeof Dropdown>;
</script>

{#snippet template(args: Args, _context: Context)}
  <Dropdown isExpanded={args.isExpanded ?? true}>
    {#snippet children()}
      <p>
        This is the dropdown content.<br />
        You can put any content here.
      </p>
    {/snippet}
  </Dropdown>
{/snippet}

<Story name="Default" />
<Story name="Collapsed" args={{ isExpanded: false }} />
