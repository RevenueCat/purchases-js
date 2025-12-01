import { mount } from "svelte";
import ExpressPurchaseButton from "./express-purchase-button.svelte";
import type { ExpressPurchaseButtonProps } from "./express-purchase-button-props";
import type { ExpressPurchaseButtonUpdater } from "../../entities/present-express-purchase-button-params";
import type { Package, PurchaseOption } from "../../entities/offerings";

export class ExpressPurchaseButtonWrapper {
  protected button: ReturnType<typeof mount>;
  private state: { props: ExpressPurchaseButtonProps };

  constructor(
    htmlTarget: HTMLElement,
    onButtonReady: (updater: ExpressPurchaseButtonUpdater) => void,
    props: ExpressPurchaseButtonProps,
  ) {
    this.state = $state({
      props: props,
    });

    this.button = mount(ExpressPurchaseButton, {
      target: htmlTarget,
      props: this.state.props,
    });
    const updatePurchase = (pkg: Package, purchaseOption: PurchaseOption) => {
      this.changePackage(pkg, purchaseOption);
    };
    const updater: ExpressPurchaseButtonUpdater = {
      updatePurchase,
    };
    onButtonReady(updater);
  }

  changePackage(pkg: Package, purchaseOption: PurchaseOption) {
    if (!this.state.props) {
      return;
    }
    this.state.props.rcPackage = pkg;
    this.state.props.purchaseOption = purchaseOption;
  }
}
