<script lang="ts">
  import InfoMessage from "./info-message.svelte";
  import { Translator } from "../localization/translator";
  import { translatorContextKey } from "../localization/constants";
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import type { SubscriptionOption } from "../../entities/offerings";

  type Props = {
    subscriptionOption: SubscriptionOption | null;
  };

  const { subscriptionOption }: Props = $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);

  let message = $state(
    $translator.translate(LocalizationKeys.PriceUpdateBaseMessage),
  );
  if (!subscriptionOption?.trial) {
    message +=
      " " +
      $translator.translate(LocalizationKeys.PriceUpdateChargedOnceMessage);
  }
</script>

<InfoMessage
  title={$translator.translate(LocalizationKeys.PriceUpdateTitle)}
  {message}
/>
