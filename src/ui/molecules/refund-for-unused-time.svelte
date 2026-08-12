<script lang="ts">
  import { getContext } from "svelte";
  import { type Writable } from "svelte/store";
  import type { Translator } from "../localization/translator";
  import { translatorContextKey } from "../localization/constants";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import Typography from "../atoms/typography.svelte";

  interface Props {
    previousProductName: string;
  }

  const { previousProductName }: Props = $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);
</script>

<div class="rcb-refund-for-unused-time">
  <div class="rcb-refund-for-unused-time-title">
    <Typography size="body-small">
      {$translator.translate(LocalizationKeys.RefundForUnusedTimeTitle)}
    </Typography>
  </div>
  <div class="rcb-refund-for-unused-time-message">
    <Typography size="caption-default">
      {$translator.translate(LocalizationKeys.RefundForUnusedTimeMessage, {
        previousProductName,
      })}
    </Typography>
  </div>
</div>

<style>
  .rcb-refund-for-unused-time {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapSmall-mobile);
    padding: var(--rc-spacing-gapLarge-mobile);
    border: 1px solid var(--rc-color-grey-ui-dark);
    border-radius: var(--rc-shape-input-border-radius);
    background-color: transparent;
  }

  .rcb-refund-for-unused-time-title {
    color: var(--rc-color-grey-text-dark);
  }

  .rcb-refund-for-unused-time-message {
    color: var(--rc-color-grey-text-light);
  }

  @container layout-query-container (width >= 768px) {
    .rcb-refund-for-unused-time {
      gap: var(--rc-spacing-gapSmall-desktop);
      padding: var(--rc-spacing-gapLarge-desktop);
    }
  }
</style>
