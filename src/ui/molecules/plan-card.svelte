<script lang="ts">
  import { getContext } from "svelte";
  import { type Writable } from "svelte/store";
  import type { BrandingAppearance } from "../../entities/branding";
  import type { Translator } from "../localization/translator";
  import { brandingContextKey } from "../constants";
  import { translatorContextKey } from "../localization/constants";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { DEFAULT_FORM_COLORS } from "../theme/colors";
  import { isHexColorLight } from "../theme/utils";
  import Typography from "../atoms/typography.svelte";

  interface Props {
    name: string;
    price: string;
    variant: "current" | "new";
  }

  const { name, price, variant }: Props = $props();

  const brandingAppearanceStore =
    getContext<Writable<BrandingAppearance | null | undefined>>(
      brandingContextKey,
    );

  const translator: Writable<Translator> = getContext(translatorContextKey);

  const badgeLabel = $derived(
    variant === "current"
      ? $translator.translate(LocalizationKeys.PlanCardCurrent)
      : $translator.translate(LocalizationKeys.PlanCardNew),
  );

  // White card + light primary could make a badge invisible.
  // Fall back to primary-text as the fill (black on white primary) for contrast.
  const invertNewBadge = $derived(
    variant === "new" &&
      isHexColorLight(
        $brandingAppearanceStore?.color_buttons_primary ??
          DEFAULT_FORM_COLORS.primary,
      ),
  );
</script>

<div class="rcb-plan-card rcb-plan-card-{variant}">
  <div class="rcb-plan-card-content">
    <div class="rcb-plan-card-text">
      <div class="rcb-plan-card-name">
        <Typography size="body-base">{name}</Typography>
      </div>
      <div class="rcb-plan-card-price">
        <Typography size="caption-default">{price}</Typography>
      </div>
    </div>
    <span
      class="rcb-plan-badge rcb-plan-badge-{variant}"
      class:rcb-plan-badge-new-inverted={invertNewBadge}
    >
      {badgeLabel}
    </span>
  </div>
</div>

<style>
  .rcb-plan-card {
    box-sizing: border-box;
    width: 100%;
    padding: var(--rc-spacing-gapLarge-mobile);
    border-radius: var(--rc-shape-input-border-radius);
  }

  .rcb-plan-card-current {
    background-color: var(--rc-color-grey-ui-light);
  }

  .rcb-plan-card-new {
    /* Fixed white card: keep text dark even when product-info tokens flip for a dark page bg */
    --rc-color-grey-text-dark: rgba(0, 0, 0, 1);
    --rc-color-grey-text-light: rgba(0, 0, 0, 0.6);
    background-color: #ffffff;
    color: rgba(0, 0, 0, 1);
    box-shadow:
      0 0 0 0.5px rgba(0, 0, 0, 0.05),
      0 0.5px 0 rgba(0, 0, 0, 0.06),
      0 2px 4px rgba(0, 0, 0, 0.06);
  }

  .rcb-plan-card-content {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: var(--rc-spacing-gapMedium-mobile);
  }

  .rcb-plan-card-text {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapSmall-mobile);
  }

  .rcb-plan-card-name {
    color: var(--rc-color-grey-text-dark);
    font-weight: 500;
    overflow-wrap: anywhere;
  }

  .rcb-plan-card-price {
    color: var(--rc-color-grey-text-light);
  }

  .rcb-plan-badge {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--rc-spacing-gapSmall-mobile)
      var(--rc-spacing-gapMedium-mobile);
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
    border-radius: var(--rc-shape-input-button-border-radius);
  }

  .rcb-plan-badge-current {
    color: var(--rc-color-grey-text-light);
    background-color: transparent;
    border: 1px solid var(--rc-color-grey-ui-dark);
  }

  .rcb-plan-badge-new {
    color: var(--rc-color-primary-text);
    background-color: var(--rc-color-primary);
    border: 1px solid var(--rc-color-primary);
  }

  .rcb-plan-badge-new-inverted {
    color: #ffffff;
    background-color: var(--rc-color-primary-text);
    border-color: var(--rc-color-primary-text);
  }

  @container layout-query-container (width >= 768px) {
    .rcb-plan-card {
      padding: var(--rc-spacing-gapLarge-desktop);
    }

    .rcb-plan-card-text {
      gap: var(--rc-spacing-gapSmall-desktop);
    }

    .rcb-plan-badge {
      padding: var(--rc-spacing-gapSmall-desktop)
        var(--rc-spacing-gapMedium-desktop);
    }
  }
</style>
