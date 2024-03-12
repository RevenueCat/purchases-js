<script lang="ts">
  import IconSuccess from "../assets/icon-success.svelte";
  import { BrandingInfoResponse } from "../../networking/responses/branding-response";
  import MessageLayout from "../layout/message-layout.svelte";

  export let brandingInfo: BrandingInfoResponse | null = null;
  export let onContinue: () => void;
</script>

<MessageLayout title="Purchase successful" {brandingInfo} {onContinue}>
  <IconSuccess slot="icon" />
  Your plan is now active.
</MessageLayout>
