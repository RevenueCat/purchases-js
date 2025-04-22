<script lang="ts">
  import { type SubscriptionOption } from "../../entities/offerings";
  import Button from "./button.svelte";
  import Localized from "../localization/localized.svelte";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { type PriceBreakdown } from "../ui-types";
  import { type Writable } from "svelte/store";
  import { Translator } from "../localization/translator";
  import { translatorContextKey } from "../../ui/localization/constants";
  import { getContext } from "svelte";

  type Props = {
    disabled: boolean;
    subscriptionOption: SubscriptionOption | null;
    priceBreakdown?: PriceBreakdown;
    paymentMethod?: string;
  };

  const { disabled, subscriptionOption, priceBreakdown, paymentMethod }: Props =
    $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);

  const formattedPrice = $derived(
    priceBreakdown
      ? $translator.formatPrice(
          priceBreakdown.totalAmountInMicros,
          priceBreakdown.currency,
        )
      : null,
  );
</script>

<Button {disabled} testId="PayButton">
  {#if paymentMethod && formattedPrice}
    <Localized
      key={LocalizationKeys.PaymentEntryPageButtonPaymentMethod}
      variables={{ formattedPrice, paymentMethod }}
    />
  {:else if subscriptionOption?.trial}
    <Localized key={LocalizationKeys.PaymentEntryPageButtonStartTrial} />
  {:else}
    <Localized key={LocalizationKeys.PaymentEntryPageButtonPay} />
  {/if}
</Button>
