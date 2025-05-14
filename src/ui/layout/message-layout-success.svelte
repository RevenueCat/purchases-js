<script lang="ts">
  import ColLayout from "./col-layout.svelte";
  import Typography from "../atoms/typography.svelte";

  const { title = null, icon = null } = $props();
</script>

<div class="rcb-modal-message" data-type="success" data-has-title={!!title}>
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

<style>
  .rcb-modal-message-icon {
    height: 54px;
    width: 54px;
    margin: 0 auto;
  }

  .rcb-modal-message[data-has-title="false"] {
    margin-top: var(--rc-spacing-gapXXLarge-mobile);
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

  @container layout-query-container (width >= 768px) {
    .rcb-modal-message[data-has-title="false"] {
      margin-top: var(--rc-spacing-gapXXLarge-desktop);
    }
  }
</style>
