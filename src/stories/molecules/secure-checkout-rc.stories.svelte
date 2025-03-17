<script module>
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import { withNavbar } from "../decorators/with-navbar";
  import SecureCheckoutRC from "../../ui/molecules/secure-checkout-rc.svelte";

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

<Story name="With Terms Info">
  <SecureCheckoutRC
    termsInfo="By continuing, you agree to our Terms of Service and Privacy Policy."
    trialInfo={null}
  />
</Story>

<Story name="With Trial Info">
  <SecureCheckoutRC
    termsInfo={null}
    trialInfo="Your free trial will begin today and you won't be charged until the trial ends on May 15, 2023."
  />
</Story>

<Story name="With Both Info">
  <SecureCheckoutRC
    termsInfo="By continuing, you agree to our Terms of Service and Privacy Policy."
    trialInfo="Your free trial will begin today and you won't be charged until the trial ends on May 15, 2023."
  />
</Story>

<Story name="Without Any Info">
  <SecureCheckoutRC termsInfo={null} trialInfo={null} />
</Story>
