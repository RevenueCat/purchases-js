<script lang="ts">
  import { type ComponentProps } from "svelte";
  import { Paywall, WorkflowShell } from "@revenuecat/purchases-ui-js";

  const props: ComponentProps<typeof Paywall> = $props();
</script>

<WorkflowShell
  paywallData={props.paywallData}
  preferredColorMode={props.preferredColorMode}
>
  <Paywall {...props} />
</WorkflowShell>
