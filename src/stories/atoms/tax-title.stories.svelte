<script module>
  import TaxTitle from "../../ui/atoms/tax-title.svelte";
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import { withLayout } from "../decorators/with-layout";
  import { brandingModes } from "../../../.storybook/modes";

  let { Story } = defineMeta({
    component: TaxTitle,
    title: "Atoms/TaxTitle",
    // @ts-expect-error ignore typing of decorator
    decorators: [withLayout],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
  });
</script>

<Story
  name="VAT California"
  args={{
    taxType: "vat",
    country: "US",
    state: "CA",
    taxPercentageInMicros: 80000,
  }}
/>

<Story
  name="Sales Tax New York"
  args={{
    taxType: "sales_tax",
    country: "USA",
    state: "NY",
    taxPercentageInMicros: 88000,
  }}
/>

<Story
  name="IVA Spain"
  args={{
    taxType: "vat",
    country: "ES",
    taxPercentageInMicros: 21000,
  }}
/>

<Story
  name="Canada GST"
  args={{
    taxType: "gst",
    country: "CA",
    state: "ON",
    taxPercentageInMicros: 50000,
  }}
/>

<Story
  name="Canada QST"
  args={{
    taxType: "qst",
    country: "CA",
    state: null,
    taxPercentageInMicros: 99750,
  }}
/>
