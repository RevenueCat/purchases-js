<script lang="ts">

  import { getTranslatedPeriodLength } from "../../helpers/price-labels";

  export interface Props {
    isoPeriod: string;
    selectedLocale: string;
  }

  let { isoPeriod, selectedLocale }: Props = $props();
  let translatedPeriod: string | undefined = $derived(getTranslatedPeriodLength(isoPeriod, selectedLocale));
</script>

{translatedPeriod}