<script lang="ts">
  import { getContext } from "svelte";
  import { type Writable } from "svelte/store";
  import type { Translator } from "../localization/translator";
  import { translatorContextKey } from "../localization/constants";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import Typography from "../atoms/typography.svelte";

  interface Props {
    previousProductName: string;
    productName: string;
    variant?: "refund" | "credit" | "deferred";
  }

  const {
    previousProductName,
    productName,
    variant = "refund",
  }: Props = $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);

  const titleKey = $derived(
    variant === "deferred"
      ? LocalizationKeys.DeferredSubscriptionChangeTitle
      : variant === "credit"
        ? LocalizationKeys.CreditForUnusedTimeTitle
        : LocalizationKeys.RefundForUnusedTimeTitle,
  );
  const messageKey = $derived(
    variant === "deferred"
      ? LocalizationKeys.DeferredSubscriptionChangeMessage
      : variant === "credit"
        ? LocalizationKeys.CreditForUnusedTimeMessage
        : LocalizationKeys.RefundForUnusedTimeMessage,
  );
</script>

<div class="rcb-subscription-change-notice">
  <div class="rcb-subscription-change-notice-title">
    <Typography size="body-small">
      {$translator.translate(titleKey)}
    </Typography>
  </div>
  <div class="rcb-subscription-change-notice-message">
    <Typography size="caption-default">
      {$translator.translate(messageKey, {
        previousProductName,
        productName,
      })}
    </Typography>
  </div>
</div>

<style>
  .rcb-subscription-change-notice {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapSmall-mobile);
    padding: var(--rc-spacing-gapLarge-mobile);
    border: 1px solid var(--rc-color-grey-ui-dark);
    border-radius: var(--rc-shape-input-border-radius);
    background-color: transparent;
  }

  .rcb-subscription-change-notice-title {
    color: var(--rc-color-grey-text-dark);
  }

  .rcb-subscription-change-notice-message {
    color: var(--rc-color-grey-text-light);
  }

  @container layout-query-container (width >= 768px) {
    .rcb-subscription-change-notice {
      gap: var(--rc-spacing-gapSmall-desktop);
      padding: var(--rc-spacing-gapLarge-desktop);
    }
  }
</style>
