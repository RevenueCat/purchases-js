<script lang="ts">
  import { Button } from "@revenuecat/purchases-ui-js";
  import ModalFooter from "./modal-footer.svelte";
  import ModalSection from "./modal-section.svelte";
  import MessageLayoutError from "./message-layout-error.svelte";
  import MessageLayoutSuccess from "./message-layout-success.svelte";
  import { getContext } from "svelte";
  import { brandingContextKey } from "../constants";
  import type { BrandingAppearance } from "../../entities/branding";
  import type { Snippet } from "svelte";

  let {
    onDismiss,
    title = null,
    type,
    closeButtonTitle = "Go back to app",
    icon = null,
    message = null,
    fullWidth = false,
  }: {
    onDismiss: () => void;
    title?: string | null;
    type: "success" | "error";
    closeButtonTitle?: string;
    icon?: Snippet | null;
    message?: Snippet | null;
    fullWidth?: boolean;
  } = $props();

  const brandingAppearance = getContext<BrandingAppearance>(brandingContextKey);

  function handleClick() {
    onDismiss();
  }
</script>

<div class="message-layout" class:message-layout-full-width={fullWidth}>
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

  .message-layout-full-width {
    width: 100%;
  }

  @media (min-width: 768px) {
    .message-layout-full-width {
      width: 544px;
    }
  }
</style>
