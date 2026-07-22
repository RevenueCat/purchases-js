<script lang="ts">
  import { getContext } from "svelte";
  import { type Writable } from "svelte/store";
  import { translatorContextKey } from "../localization/constants";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { Translator } from "../localization/translator";
  import Typography from "../atoms/typography.svelte";

  const TERMS_PLACEHOLDER = "__TERMS_OF_SERVICE__";

  interface Props {
    appName: string | null | undefined;
    termsAndConditionsUrl: string;
    checked?: boolean;
    onChange: (checked: boolean) => void;
  }

  let {
    appName,
    termsAndConditionsUrl,
    checked = $bindable(false),
    onChange,
  }: Props = $props();

  const translator = getContext<Writable<Translator>>(translatorContextKey);

  const termsLabel = $derived(
    $translator.translate(
      LocalizationKeys.PaymentEntryPageCheckoutConsentTermsOfService,
    ),
  );

  const agreementParts = $derived.by(() => {
    const agreement = $translator.translate(
      LocalizationKeys.PaymentEntryPageCheckoutConsentAgreement,
      {
        appName: appName ?? "",
        termsOfService: TERMS_PLACEHOLDER,
      },
    );
    const [before = "", after = ""] = agreement.split(TERMS_PLACEHOLDER);
    return { before, after };
  });

  const handleChange = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    checked = target.checked;
    onChange(target.checked);
  };
</script>

<label class="rcb-checkout-consent" data-testid="CheckoutConsent">
  <input
    type="checkbox"
    class="rcb-checkout-consent-checkbox"
    data-testid="CheckoutConsentCheckbox"
    {checked}
    onchange={handleChange}
  />
  <Typography size="caption-default">
    {agreementParts.before}<a
      href={termsAndConditionsUrl}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="CheckoutConsentTermsLink"
      onclick={(event) => event.stopPropagation()}
    >
      {termsLabel}
    </a>{agreementParts.after}
  </Typography>
</label>

<style>
  .rcb-checkout-consent {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 12px;
    cursor: pointer;
  }

  .rcb-checkout-consent-checkbox {
    margin-top: 2px;
    flex-shrink: 0;
  }

  .rcb-checkout-consent :global(a) {
    color: inherit;
    text-decoration: underline;
  }
</style>
