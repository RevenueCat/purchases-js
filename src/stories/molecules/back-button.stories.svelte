<script module>
  import BackButton from "../../ui/molecules/back-button.svelte";
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { withLayout } from "../decorators/with-layout";
  import { brandingModes } from "../../../.storybook/modes";

  let { Story } = defineMeta({
    component: BackButton,
    title: "Molecules/BackButton",
    // @ts-expect-error ignore typing of decorator
    decorators: [withLayout],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
  });
</script>

<Story name="Default" />
<Story name="Disabled" args={{ disabled: true }} />
