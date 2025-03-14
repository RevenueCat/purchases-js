import { type ComponentProps } from "svelte";
import type PurchasesInner from "../../../ui/purchases-ui-inner.svelte";
import { buildCheckoutStartResponse } from "./purchase-response-builder";

export const getArgs = async (): Promise<
  Partial<ComponentProps<PurchasesInner>>
> => {
  return {
    paymentInfoCollectionMetadata: await buildCheckoutStartResponse(),
  };
};
