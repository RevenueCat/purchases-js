<script lang="ts">
  import { Button } from "@revenuecat/purchases-ui-js";
  import ModalFooter from "./modal-footer.svelte";
  import ModalSection from "./modal-section.svelte";
  import MessageLayoutError from "./message-layout-error.svelte";
  import MessageLayoutSuccess from "./message-layout-success.svelte";
  import Typography from "../atoms/typography.svelte";
  const {
    onDismiss,
    title = null,
    type,
    closeButtonTitle = "Go back to app",
    icon = null,
    message = null,
  } = $props();

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
      <Button onclick={handleClick} type="submit"
        ><Typography size="body-small">{closeButtonTitle}</Typography></Button
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
    }
  }

  @container layout-query-container (width >= 768px) {
    .message-layout {
      min-height: 354px;
    }
    .message-layout-content {
      justify-content: flex-start;
      flex-grow: 1;
    }

    .message-layout-footer {
      margin-top: var(--rc-spacing-gapXXLarge-desktop);
    }
  }
</style>
