<script>
  import { Meta, Story, Template } from "@storybook/addon-svelte-csf";
  import StateLoading from "../ui/states/state-loading.svelte";
  import Layout from "../ui/layout/layout.svelte";
  import Container from "../ui/layout/container.svelte";
  import Main from "../ui/layout/main-block.svelte";
  import ModalBackdrop from "../ui/modal-backdrop.svelte";

  import {
    colorfulBrandingAppearance,
    product,
    subscriptionOption,
  } from "./fixtures";
</script>

<Meta title="StateLoading" component={StateLoading} />

<Template let:args>
  <Container>
    <ModalBackdrop>
      <Layout>
        <Main brandingAppearance={args.brandingAppearance}>
          {#snippet body()}
            <StateLoading {...args} />
          {/snippet}
        </Main>
      </Layout>
    </ModalBackdrop>
  </Container>
</Template>

<Story
  name="Standard"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOption,
    brandingAppearance: {},
  }}
/>

<Story
  name="Rounded"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOption,
    brandingAppearance: {
      shapes: "rounded",
    },
  }}
/>

<Story
  name="Pill"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOption,
    brandingAppearance: {
      shapes: "pill",
    },
  }}
/>

<Story
  name="Rectangle"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOption,
    brandingAppearance: {
      shapes: "rectangle",
    },
  }}
/>

<Story
  name="ColorfulRectangle"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOption,
    brandingAppearance: colorfulBrandingAppearance,
  }}
/>
