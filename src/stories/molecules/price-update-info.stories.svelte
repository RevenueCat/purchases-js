<script module>
  import PriceUpdateInfo from "../../ui/molecules/price-update-info.svelte";
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { withLayout } from "../decorators/with-layout";
  import { brandingModes } from "../../../.storybook/modes";

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

<Story name="Price Update" />
