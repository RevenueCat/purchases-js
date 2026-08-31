<script lang="ts">
  import { getContext } from "svelte";
  import { type Writable } from "svelte/store";
  import type { Translator } from "../localization/translator";
  import { translatorContextKey } from "../localization/constants";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import Typography from "../atoms/typography.svelte";

  interface Props {
    previousProductName: string;
    variant?: "refund" | "credit";
  }

  const { previousProductName, variant = "refund" }: Props = $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);

  const titleKey = $derived(
    variant === "credit"
      ? LocalizationKeys.CreditForUnusedTimeTitle
      : LocalizationKeys.RefundForUnusedTimeTitle,
  );
  const messageKey = $derived(
    variant === "credit"
      ? LocalizationKeys.CreditForUnusedTimeMessage
      : LocalizationKeys.RefundForUnusedTimeMessage,
  );
</script>

<div class="rcb-unused-time-adjustment">
  <div class="rcb-unused-time-adjustment-title">
    <Typography size="body-small">
      {$translator.translate(titleKey)}
    </Typography>
  </div>
  <div class="rcb-unused-time-adjustment-message">
    <Typography size="caption-default">
      {$translator.translate(messageKey, {
        previousProductName,
      })}
    </Typography>
  </div>
</div>

<style>
  .rcb-unused-time-adjustment {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapSmall-mobile);
    padding: var(--rc-spacing-gapLarge-mobile);
    border: 1px solid var(--rc-color-grey-ui-dark);
    border-radius: var(--rc-shape-input-border-radius);
    background-color: transparent;
  }

  .rcb-unused-time-adjustment-title {
    color: var(--rc-color-grey-text-dark);
  }

  .rcb-unused-time-adjustment-message {
    color: var(--rc-color-grey-text-light);
  }

  @container layout-query-container (width >= 768px) {
    .rcb-unused-time-adjustment {
      gap: var(--rc-spacing-gapSmall-desktop);
      padding: var(--rc-spacing-gapLarge-desktop);
    }
  }
</style>
