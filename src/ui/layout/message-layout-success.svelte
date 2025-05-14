<script lang="ts">
  import { Button } from "@revenuecat/purchases-ui-js";
  import ModalFooter from "./modal-footer.svelte";
  import ModalSection from "./modal-section.svelte";
  import ColLayout from "./col-layout.svelte";
  import Typography from "../atoms/typography.svelte";

  export let onDismiss: () => void;
  export let title: string | null = null;
  export let type: string;
  export let closeButtonTitle: string = "Go back to app";
  export let icon: (() => any) | null = null;

  function handleClick() {
    onDismiss();
  }
</script>

<div class="message-layout">
  <div class="message-layout-content">
    <ModalSection>
      <div class="rcb-modal-message" data-type={type} data-has-title={!!title}>
        <ColLayout gap="large" align="center">
          {#if icon}
            <div class="rcb-modal-message-icon">
              {@render icon()}
            </div>
          {/if}
          {#if title}
            <Typography size="heading-md">{title}</Typography>
          {/if}
        </ColLayout>
      </div>
    </ModalSection>
  </div>
  <div class="message-layout-footer">
    <ModalFooter>
      <Button onclick={handleClick} type="submit">{closeButtonTitle}</Button>
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

  .rcb-modal-message {
    width: 100%;
    min-height: 160px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    text-align: center;
  }

  .rcb-modal-message[data-has-title="false"] {
    margin-top: var(--rc-spacing-gapXXLarge-mobile);
  }

  .rcb-modal-message-icon {
    height: 54px;
    width: 54px;
    margin: 0 auto;
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
    .rcb-modal-message[data-has-title="false"] {
      margin-top: var(--rc-spacing-gapXXLarge-desktop);
    }
  }
</style>
