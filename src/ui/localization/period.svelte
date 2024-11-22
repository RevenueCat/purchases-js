<script lang="ts">

  import { getPeriodLabel } from "../../helpers/price-labels";

  export interface Props {
    isoPeriod: string;
    selectedLocale: string;
  }

  let { isoPeriod, selectedLocale }: Props = $props();
  let translatedPeriod: string | undefined = $derived(getPeriodLabel(isoPeriod, selectedLocale));
</script>

{translatedPeriod}