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
    selectedPaymentMethod?: string;
  };

  const {
    disabled,
    subscriptionOption,
    priceBreakdown,
    selectedPaymentMethod,
  }: Props = $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);

  const formattedPrice = $derived(
    priceBreakdown
      ? $translator.formatPrice(
          priceBreakdown.totalAmountInMicros,
          priceBreakdown.currency,
        )
      : null,
  );

  const paymentMethod = $derived(
    $translator.translatePaymentMethod(selectedPaymentMethod ?? "card"),
  );
</script>

<Button {disabled} testId="PayButton">
  {#if subscriptionOption?.trial}
    <Localized key={LocalizationKeys.PaymentEntryPageButtonStartTrial} />
  {:else if formattedPrice && paymentMethod}
    <Localized
      key={LocalizationKeys.PaymentEntryPageButtonPaymentMethod}
      variables={{ formattedPrice, paymentMethod }}
    />
  {:else}
    <Localized key={LocalizationKeys.PaymentEntryPageButtonPay} />
  {/if}
</Button>
