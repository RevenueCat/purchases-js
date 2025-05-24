<script lang="ts">
  import { type SubscriptionOption } from "../../entities/offerings";
  import { Button } from "@revenuecat/purchases-ui-js";
  import Localized from "../localization/localized.svelte";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { type PriceBreakdown } from "../ui-types";
  import { type Writable } from "svelte/store";
  import { Translator } from "../localization/translator";
  import { translatorContextKey } from "../../ui/localization/constants";
  import { getContext } from "svelte";
  import { brandingContextKey } from "../constants";
  import type { BrandingAppearance } from "../../entities/branding";

  type Props = {
    disabled: boolean;
    subscriptionOption: SubscriptionOption | null;
    priceBreakdown?: PriceBreakdown;
    selectedPaymentMethod?: string;
  };

  const { disabled, subscriptionOption, priceBreakdown }: Props = $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);

  const brandingAppearanceStore =
    getContext<Writable<BrandingAppearance>>(brandingContextKey);
  const brandingAppearance = $derived($brandingAppearanceStore);

  const formattedPrice = $derived(
    priceBreakdown
      ? $translator.formatPrice(
          priceBreakdown.totalAmountInMicros,
          priceBreakdown.currency,
        )
      : null,
  );

  const trialPeriod = subscriptionOption?.trial?.period;

  const trialPeriodLabel = $derived(
    trialPeriod
      ? $translator.translatePeriod(trialPeriod.number, trialPeriod.unit)
      : null,
  );
</script>

<Button {disabled} testId="PayButton" {brandingAppearance}>
  {#if subscriptionOption?.trial}
    <Localized
      key={LocalizationKeys.PaymentEntryPageButtonStartTrial}
      variables={{ trialPeriodLabel }}
    />
  {:else if formattedPrice}
    <Localized
      key={LocalizationKeys.PaymentEntryPageButtonWithPrice}
      variables={{ formattedPrice }}
    />
  {:else}
    <Localized key={LocalizationKeys.PaymentEntryPageButtonPay} />
  {/if}
</Button>
