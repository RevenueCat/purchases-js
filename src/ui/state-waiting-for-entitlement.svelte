<script lang="ts">
  import type { Purchases } from "src/main";
  import StateLoading from "./state-loading.svelte";

  import { onMount } from "svelte";

  export let purchases: Purchases;
  export let appUserId: string;
  export let entitlement: string;
  export let onContinue: () => void;
  export let onError: () => void;

  onMount(async () => {
    const result = await purchases.waitForEntitlement(appUserId, entitlement);

    if (result) {
      onContinue();
    } else {
      onError();
    }
  });
</script>

<StateLoading />
