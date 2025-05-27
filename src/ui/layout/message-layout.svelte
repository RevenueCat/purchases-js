<script lang="ts">
  import { Button } from "@revenuecat/purchases-ui-js";
  import ModalFooter from "./modal-footer.svelte";
  import ModalSection from "./modal-section.svelte";
  import MessageLayoutError from "./message-layout-error.svelte";
  import MessageLayoutSuccess from "./message-layout-success.svelte";
  import { getContext } from "svelte";
  import { brandingContextKey } from "../constants";
  import type { BrandingAppearance } from "../../entities/branding";
  import { type Writable } from "svelte/store";

  let {
    onDismiss,
    title = null,
    type,
    closeButtonTitle = "Go back to app",
    icon = null,
    message = null,
  } = $props();

  const brandingAppearanceStore =
    getContext<Writable<BrandingAppearance>>(brandingContextKey);
  const brandingAppearance = $derived($brandingAppearanceStore);

  function handleClick() {
    onDismiss();
  }
</script>

<div class="message-layout">
  <div class="message-layout-content">
    <ModalSection>
      {#if type === "success"}
        <MessageLayoutSuccess {title} {icon} />
      {:else}
        <MessageLayoutError {title} {icon} {message} />
      {/if}
    </ModalSection>
  </div>
  <div class="message-layout-footer">
    <ModalFooter>
      <Button onclick={handleClick} type="submit" {brandingAppearance}
        >{closeButtonTitle}</Button
      >
    </ModalFooter>
  </div>
</div>

<style>
  .message-layout {
    display: flex;
    flex-direction: column;
  }

  .message-layout-content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  @container layout-query-container (width < 768px) {
    .message-layout {
      flex-grow: 1;
      gap: var(--rc-spacing-gapXXLarge-mobile);
    }
  }

  @container layout-query-container (width >= 768px) {
    .message-layout {
      min-height: 354px;
      gap: var(--rc-spacing-gapXXLarge-desktop);
    }
    .message-layout-content {
      justify-content: flex-start;
      flex-grow: 1;
    }
  }
</style>
