<script lang="ts">
  import { type ComponentProps } from "svelte";
  import { Main, Paywall } from "@revenuecat/purchases-ui-js";

  const props: ComponentProps<typeof Paywall> = $props();
</script>

<Main
  paywallData={props.paywallData}
  preferredColorMode={props.preferredColorMode}
>
  <Paywall {...props} />
</Main>
