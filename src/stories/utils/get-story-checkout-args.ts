import { type ComponentProps } from "svelte";
import { buildPurchaseResponse, SetupMode } from "./purchase-response-builder";
import type RcbUiInner from "src/ui/rcb-ui-inner.svelte";

// TODO: See if this has been overriden in the previous stories
const setupMode: SetupMode = SetupMode.TrialSubscription;

export const getArgs = async (): Promise<
  Partial<ComponentProps<RcbUiInner>>
> => {
  return {
    paymentInfoCollectionMetadata: await buildPurchaseResponse(setupMode),
  };
};
