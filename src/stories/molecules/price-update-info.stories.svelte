<script module>
  import PriceUpdateInfo from "../../ui/molecules/price-update-info.svelte";
  import {
    type Args,
    defineMeta,
    setTemplate,
  } from "@storybook/addon-svelte-csf";
  import { withLayout } from "../decorators/with-layout";
  import { brandingModes } from "../../../.storybook/modes";
  import { subscriptionOption, subscriptionOptionWithTrial } from "../fixtures";

  let { Story } = defineMeta({
    component: PriceUpdateInfo,
    title: "Molecules/InfoMessage",
    // @ts-expect-error ignore typing of decorator
    decorators: [withLayout],
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

{#snippet template(args: Args<typeof Story>)}
  <PriceUpdateInfo
    subscriptionOption={args.subscriptionOption ?? subscriptionOption}
  />
{/snippet}

<Story name="Price Update" args={{ subscriptionOption: subscriptionOption }} />

<Story
  name="Price Update (Free Trial)"
  args={{ subscriptionOption: subscriptionOptionWithTrial }}
/>
