import { mount } from "svelte";
import ExpressPurchaseButton from "./express-purchase-button.svelte";
import type { ExpressPurchaseButtonProps } from "./express-purchase-button-props";
import type { ExpressPurchaseButtonUpdater } from "../../entities/present-express-purchase-button-params";
import type { Package, PurchaseOption } from "../../entities/offerings";

export function renderExpressPurchaseButton(
  htmlTarget: HTMLElement,
  onButtonReady: (updater: ExpressPurchaseButtonUpdater) => void,
  props: ExpressPurchaseButtonProps,
) {
  const state = $state({
    props: props,
  });

  const button = mount(ExpressPurchaseButton, {
    target: htmlTarget,
    props: state.props,
  });

  const updatePurchase: ExpressPurchaseButtonUpdater["updatePurchase"] = (
    pkg: Package,
    purchaseOption?: PurchaseOption,
  ) => {
    if (!state.props) {
      return;
    }
    state.props.rcPackage = pkg;
    state.props.purchaseOption =
      purchaseOption ?? pkg.webBillingProduct.defaultPurchaseOption;
  };

  onButtonReady({ updatePurchase });

  return button;
}
