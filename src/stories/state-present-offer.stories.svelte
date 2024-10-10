<script>
  import { Meta, Story, Template } from "@storybook/addon-svelte-csf";
  import StatePresentOffer from "../ui/states/state-present-offer.svelte";
  import Shell from "../ui/shell.svelte";
  import { mapStyleOverridesToStyleVariables } from "../helpers/process-style-overrides.ts";
  import Layout from "../ui/layout/layout.svelte";
  import Container from "../ui/layout/container.svelte";
  import Aside from "../ui/layout/aside-block.svelte";


  let subscriptionOption = {
    id: "option_id_1",
    priceId: "price_1",
    base: {
      periodDuration: "P1M",
      price: {
        id: "price_1",
        amount: 999,
        amountMicros: 999,
        currency: "USD",
        formattedPrice: "9.99$",
      },
      cycleCount: 0,
    },
  };

  let product = {
    identifier: "some_product_123",
    displayName: "Some Product 123",
    title: "Some Product 123",
    productType: "subscription",
    currentPrice: {
      amount: 999,
      amountMicros: 999,
      currency: "USD",
      formattedPrice: "9.99$",
    },
    normalPeriodDuration: "P1M",
    presentedOfferingIdentifier: "some_offering_identifier",
    defaultSubscriptionOption: subscriptionOption,
    subscriptionOptions: {
      option_id_1: subscriptionOption,
    },
  };
</script>


<Meta title="StoryContext" component={StatePresentOffer} />


<Template let:args>
  <Container style={mapStyleOverridesToStyleVariables(args?.brandingAppearance)}>
    <Layout>
      <Aside>
        <Shell dark>
          <StatePresentOffer {...args} />
        </Shell>
      </Aside>
    </Layout>
  </Container>
</Template>


<Story name='Primary' args={{ productDetails:product, purchaseOption:subscriptionOption, brandingAppearance:{

} }} />