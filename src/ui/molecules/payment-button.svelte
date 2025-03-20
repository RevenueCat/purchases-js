<script lang="ts">
  import { type SubscriptionOption } from "../../entities/offerings";
  import Button from "../atoms/button.svelte";
  import Localized from "../localization/localized.svelte";
  import { LocalizationKeys } from "../localization/supportedLanguages";

  export let disabled: boolean;
  export let subscriptionOption: SubscriptionOption | null;
</script>

<Button {disabled} testId="PayButton">
  {#if subscriptionOption?.trial}
    <Localized key={LocalizationKeys.StateNeedsPaymentInfoButtonStartTrial} />
  {:else}
    <Localized key={LocalizationKeys.StateNeedsPaymentInfoButtonPay} />
  {/if}
</Button>
