<script lang="ts">
  import type { WhopGatewayParams } from "../../networking/responses/checkout-start-response";

  interface Props {
    whopGatewayParams: WhopGatewayParams;
    checkoutReturnUrl: string;
  }

  const { whopGatewayParams, checkoutReturnUrl }: Props = $props();

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
    ></div>
  {/if}
</div>
