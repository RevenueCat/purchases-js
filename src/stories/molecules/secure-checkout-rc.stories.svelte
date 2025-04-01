<script module>
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import { withNavbar } from "../decorators/with-navbar";
  import SecureCheckoutRC from "../../ui/molecules/secure-checkout-rc.svelte";
  import { brandingInfo } from "../fixtures";
  import { subscriptionOptionWithTrial } from "../fixtures";

  const { Story } = defineMeta({
    component: SecureCheckoutRC,
    title: "Molecules/SecureCheckoutRC",
    // @ts-expect-error ignore typing of decorator
    decorators: [withNavbar],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
  });
</script>

<Story name="Without Extra Info">
  <SecureCheckoutRC brandingInfo={null} subscriptionOption={null} />
</Story>

<Story name="With Terms Info">
  <SecureCheckoutRC {brandingInfo} />
</Story>

<Story name="With Terms and Trial Info">
  <SecureCheckoutRC
    {brandingInfo}
    subscriptionOption={subscriptionOptionWithTrial}
  />
</Story>
