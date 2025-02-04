<script lang="ts">
  import { getContext, onMount } from "svelte";
  import Button from "../button.svelte";
  import { Elements, PaymentElement } from "svelte-stripe";
  import type {
    Stripe,
    StripeElementLocale,
    StripeElements,
    StripeError,
    StripePaymentElementChangeEvent,
  } from "@stripe/stripe-js";
  import { loadStripe } from "@stripe/stripe-js";
  import ModalSection from "../modal-section.svelte";
  import ModalFooter from "../modal-footer.svelte";
  import StateLoading from "./state-loading.svelte";
  import RowLayout from "../layout/row-layout.svelte";
  import { type PurchaseResponse } from "../../networking/responses/purchase-response";
  import ModalHeader from "../modal-header.svelte";
  import IconLock from "../icons/icon-lock.svelte";
  import ProcessingAnimation from "../processing-animation.svelte";
  import type { Product, PurchaseOption } from "../../entities/offerings";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import CloseButton from "../close-button.svelte";
  import { Theme } from "../theme/theme";
  import IconError from "../icons/icon-error.svelte";
  import MessageLayout from "../layout/message-layout.svelte";

  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";
  import Localized from "../localization/localized.svelte";

  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { type IEventsTracker } from "../../behavioural-events/events-tracker";
  import { eventsTrackerContextKey } from "../constants";
  import {
    createPaymentEntryErrorEvent,
    createPaymentEntrySubmitEvent,
  } from "../../behavioural-events/event-helpers";
  import { SDKEventName } from "../../behavioural-events/sdk-events";

  export let onClose: any;
  export let onContinue: any;
  export let paymentInfoCollectionMetadata: PurchaseResponse;
  export let processing = false;
  export let productDetails: Product;
  export let purchaseOption: PurchaseOption;
  export let brandingInfo: BrandingInfoResponse | null;

  const clientSecret = paymentInfoCollectionMetadata.data.client_secret;

  let stripe: Stripe | null = null;
  let elements: StripeElements;
  let safeElements: StripeElements;
  let modalErrorMessage: string | undefined = undefined;
  let isPaymentInfoComplete = false;
  let selectedPaymentMethod: string | undefined = undefined;

  const eventsTracker = getContext(eventsTrackerContextKey) as IEventsTracker;

  $: {
    // @ts-ignore
    if (elements && elements._elements.length > 0) {
      safeElements = elements;
    }
  }

  onMount(async () => {
    eventsTracker.trackSDKEvent({
      eventName: SDKEventName.PaymentEntryImpression,
    });

    const stripePk = paymentInfoCollectionMetadata.data.publishable_api_key;
    const stripeAcctId = paymentInfoCollectionMetadata.data.stripe_account_id;

    if (!stripePk || !stripeAcctId) {
      throw new Error("Stripe publishable key or account ID not found");
    }

    stripe = await loadStripe(stripePk, {
      stripeAccount: stripeAcctId,
    });
  });

  const handleClose = () => {
    eventsTracker.trackSDKEvent({
      eventName: SDKEventName.PaymentEntryDismiss,
    });
    onClose();
  };

  const handleContinue = async () => {
    if (processing || !stripe || !safeElements || !clientSecret) return;

    const event = createPaymentEntrySubmitEvent(selectedPaymentMethod);
    eventsTracker.trackSDKEvent(event);

    processing = true;

    const isSetupIntent = clientSecret.startsWith("seti_");

    // confirm payment with stripe
    let error: StripeError | undefined = undefined;
    if (isSetupIntent) {
      const result = await stripe.confirmSetup({
        elements: safeElements,
        redirect: "if_required",
      });
      error = result.error;
    } else {
      const result = await stripe.confirmPayment({
        elements: safeElements,
        redirect: "if_required",
      });
      error = result.error;
    }

    if (error) {
      const event = createPaymentEntryErrorEvent(
        error.code ?? null,
        error.message ?? null,
      );
      eventsTracker.trackSDKEvent(event);
      processing = false;
      if (shouldShowErrorModal(error)) {
        modalErrorMessage = error.message;
      }
    } else {
      onContinue();
    }
  };

  function shouldShowErrorModal(error: StripeError) {
    const FORM_VALIDATED_CARD_ERROR_CODES = [
      "card_declined",
      "expired_card",
      "incorrect_cvc",
      "incorrect_number",
    ];
    if (
      error.type === "card_error" &&
      error.code &&
      FORM_VALIDATED_CARD_ERROR_CODES.includes(error.code)
    ) {
      return false;
    }

    return true;
  }

  const handleErrorTryAgain = () => {
    modalErrorMessage = undefined;
  };

  const theme = new Theme(brandingInfo?.appearance);

  let customShape = theme.shape;
  let customColors = theme.formColors;

  const translator: Translator =
    getContext(translatorContextKey) || Translator.fallback();
  const stripeElementLocale = (translator.locale ||
    translator.fallbackLocale) as StripeElementLocale;

  type OnChangeEvent = CustomEvent<StripePaymentElementChangeEvent>;

  /**
   * This function converts some particular locales to the ones that stripe supports.
   * Finally falls back to 'auto' if the initialLocale is not supported by stripe.
   * @param initialLocale
   */
  const getLocaleToUse = (initialLocale: string) => {
    // These locale that we support are not supported by stripe.
    // if any of these is passed we fallback to 'auto' so that
    // stripe will pick up the locale from the browser.
    const stripeUnsupportedLocale = ["ca", "hi", "uk"];

    if (stripeUnsupportedLocale.includes(initialLocale)) {
      return "auto" as StripeElementLocale;
    }

    const mappedLocale: Record<string, string> = {
      zh_Hans: "zh",
      zh_Hant: "zh",
    };

    if (Object.keys(mappedLocale).includes(initialLocale)) {
      return mappedLocale[initialLocale] as StripeElementLocale;
    }

    return initialLocale as StripeElementLocale;
  };

  const localeToUse = getLocaleToUse(stripeElementLocale);
</script>

<div>
  {#if stripe && clientSecret}
    <ModalHeader>
      <div class="rcb-header-wrapper">
        <IconLock />
        <div class="rcb-step-title">
          <Localized
            key={LocalizationKeys.StateNeedsPaymentInfoPaymentStepTitle}
          />
        </div>
      </div>
      <CloseButton on:click={handleClose} />
    </ModalHeader>
    <form data-testid="payment-form" on:submit|preventDefault={handleContinue}>
      <Elements
        {stripe}
        {clientSecret}
        loader="always"
        locale={localeToUse}
        bind:elements
        theme="stripe"
        variables={{
          borderRadius: customShape["input-border-radius"],
          fontSizeBase: "16px",
          fontSizeSm: "16px",
          spacingGridRow: "16px",
          focusBoxShadow: "none",
          colorDanger: customColors["error"],
          colorTextPlaceholder: customColors["grey-text-light"],
          colorText: customColors["grey-text-dark"],
          colorTextSecondary: customColors["grey-text-light"],
        }}
        rules={{
          ".Input": {
            boxShadow: "none",
            border: `2px solid ${customColors["grey-ui-dark"]}`,
            backgroundColor: customColors["input-background"],
            color: customColors["grey-text-dark"],
          },
          ".Input:focus": {
            border: `2px solid ${customColors["focus"]}`,
            outline: "none",
          },
          ".Label": {
            marginBottom: "8px",
            fontWeight: "500",
            lineHeight: "22px",
            color: customColors["grey-text-dark"],
          },
          ".Input--invalid": {
            boxShadow: "none",
          },
          ".Tab": {
            boxShadow: "none",
            backgroundColor: "transparent",
            color: customColors["grey-text-light"],
            border: `2px solid ${customColors["grey-ui-dark"]}`,
          },
          ".Tab:hover, .Tab:focus, .Tab--selected, .Tab--selected:hover, .Tab--selected:focus":
            {
              boxShadow: "none",
              color: customColors["grey-text-dark"],
            },
          ".Tab:focus, .Tab--selected, .Tab--selected:hover, .Tab--selected:focus":
            {
              border: `2px solid ${customColors["focus"]}`,
            },
          ".TabIcon": {
            fill: customColors["grey-text-light"],
          },
          ".TabIcon--selected": {
            fill: customColors["grey-text-dark"],
          },
          ".Block": {
            boxShadow: "none",
            backgroundColor: "transparent",
            border: `2px solid ${customColors["grey-ui-dark"]}`,
          },
        }}
      >
        <ModalSection>
          <div
            class="rcb-stripe-elements-container"
            hidden={!!modalErrorMessage}
          >
            <PaymentElement
              options={{
                business: brandingInfo?.app_name
                  ? { name: brandingInfo.app_name }
                  : undefined,
                layout: {
                  type: "tabs",
                },
              }}
              on:change={(event: OnChangeEvent) => {
                selectedPaymentMethod = event.detail.value.type;
                isPaymentInfoComplete = event.detail.complete;
              }}
            />
          </div>
          {#if modalErrorMessage}
            <MessageLayout
              title={null}
              type="error"
              closeButtonTitle={translator.translate(
                LocalizationKeys.StateErrorButtonTryAgain,
              )}
              onContinue={handleErrorTryAgain}
              onClose={handleErrorTryAgain}
              brandingInfo={null}
            >
              <IconError slot="icon" />
              {modalErrorMessage}
            </MessageLayout>
          {/if}
        </ModalSection>
        <ModalFooter>
          {#if !modalErrorMessage}
            <RowLayout>
              <Button
                disabled={processing || !isPaymentInfoComplete}
                testId="PayButton"
              >
                {#if processing}
                  <ProcessingAnimation />
                {:else if productDetails.subscriptionOptions?.[purchaseOption.id]?.trial}
                  <Localized
                    key={LocalizationKeys.StateNeedsPaymentInfoButtonStartTrial}
                  />
                {:else}
                  <Localized
                    key={LocalizationKeys.StateNeedsPaymentInfoButtonPay}
                  />
                {/if}
              </Button>
            </RowLayout>
          {/if}
        </ModalFooter>
      </Elements>
    </form>
  {:else}
    <StateLoading />
  {/if}
</div>

<style>
  .rcb-header-wrapper {
    display: flex;
    align-items: center;
  }

  .rcb-step-title {
    margin-left: 10px;
  }

  .rcb-stripe-elements-container {
    width: 100%;

    /* The standard height of the payment form from Stripe */
    /* Added to avoid the card getting smaller while loading */
    min-height: 320px;

    margin-top: 32px;
    margin-bottom: 24px;
  }
</style>
