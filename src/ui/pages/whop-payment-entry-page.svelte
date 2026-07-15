<script lang="ts">
  import type { WhopGatewayParams } from "../../networking/responses/checkout-start-response";
  import type { BrandingAppearance } from "../../entities/branding";

  interface Props {
    whopGatewayParams: WhopGatewayParams;
    checkoutReturnUrl: string;
    brandingAppearance: BrandingAppearance | null;
  }

  const { whopGatewayParams, checkoutReturnUrl, brandingAppearance }: Props =
    $props();

  const whopBorderRadius = $derived(
    brandingAppearance?.shapes === "rectangle"
      ? "0"
      : brandingAppearance?.shapes === "rounded"
        ? "8"
        : brandingAppearance?.shapes === "pill"
          ? "9999"
          : undefined,
  );

  let whopState = $state({ whopLoaded: false, whopError: null });

  const loadScript = (src: string) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.addEventListener("load", () => resolve(script));
      script.addEventListener("error", () => reject(script));

      document.body.appendChild(script);
    });
  };

  loadScript("https://js.whop.com/static/checkout/loader.js")
    .then(() => {
      whopState.whopLoaded = true;
      console.log("Whop checkout loaded");
    })
    .catch((err) => {
      whopState.whopError = err;
      whopState.whopLoaded = false;
      console.log("Whop checkout failed to load");
    });
</script>

<div class="w-full h-full flex flex-col items-center justify-center">
  {#if !whopState.whopLoaded}
    <div>Loading Whop checkout...</div>
  {/if}
  {#if whopState.whopError}
    <div>Error loading Whop checkout: {whopState.whopError}</div>
  {/if}

  {#if whopState.whopLoaded && !whopState.whopError}
    <div
      data-whop-checkout-plan-id={whopGatewayParams.plan_id}
      data-whop-checkout-session={whopGatewayParams.checkout_session_id}
      data-whop-checkout-return-url={checkoutReturnUrl}
      data-whop-checkout-environment={whopGatewayParams.environment}
      data-whop-checkout-skip-redirect="true"
      data-whop-checkout-theme-background-color={brandingAppearance?.color_form_bg}
      data-whop-checkout-theme-accent-color={brandingAppearance?.color_buttons_primary}
      data-whop-checkout-theme-border-radius={whopBorderRadius}
      data-whop-checkout-oncomplete={() => {
        alert("Payment completed!");
      }}
    ></div>
  {/if}
</div>
