<script module>
  import { default as Dropdown } from "../../ui/molecules/pricing-dropdown.svelte";
  import {
    type Args,
    defineMeta,
    setTemplate,
  } from "@storybook/addon-svelte-csf";
  import { withNavbar } from "../decorators/with-navbar";
  import { brandingLanguageViewportModes } from "../../../.storybook/modes";

  let { Story } = defineMeta({
    component: Dropdown,
    title: "Molecules/PricingDropdown",
    // @ts-expect-error ignore typing of decorator
    decorators: [withNavbar],
    parameters: {
      chromatic: {
        modes: brandingLanguageViewportModes,
      },
    },
  });
</script>

<script lang="ts">
  setTemplate(template);
</script>

{#snippet template({ ...props }: Args<typeof Story>)}
  <Dropdown isExpanded={props.isExpanded ?? true}>
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
