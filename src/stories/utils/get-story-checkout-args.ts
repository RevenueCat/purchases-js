import { type ComponentProps } from "svelte";
import type RcbUiInner from "src/ui/rcb-ui-inner.svelte";
import { buildCheckoutStartResponse } from "./purchase-response-builder";

export const getArgs = async (): Promise<
  Partial<ComponentProps<RcbUiInner>>
> => {
  return {
    paymentInfoCollectionMetadata: await buildCheckoutStartResponse(),
  };
};
