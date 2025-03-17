<script lang="ts">
  import Icon from "../atoms/icon.svelte";
  import Localized from "../localization/localized.svelte";
  import { LocalizationKeys } from "../localization/supportedLanguages";
</script>

<button on:click class="rcb-back-button" data-testid="close-button">
  <Icon name="chevron-left" />
  <Localized key={LocalizationKeys.NavbarBackButton} />
</button>

<style>
  .rcb-back-button {
    border: none;
    cursor: pointer;
    background-color: transparent;
    padding: 0;
    border-radius: 50%;
    color: var(--rc-color-grey-text-dark);
    /* This button is only shown in desktop layout*/
    font: var(--rc-text-body1-desktop);
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
