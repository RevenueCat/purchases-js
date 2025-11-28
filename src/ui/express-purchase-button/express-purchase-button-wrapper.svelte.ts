import { mount } from "svelte";
import ExpressPurchaseButton from "./express-purchase-button.svelte";
import type { ExpressPurchaseButtonProps } from "./express-purchase-button-props";
import type { ExpressPurchaseButtonUpdater } from "../../entities/present-express-purchase-button-params";
import type { Package } from "../../entities/offerings";

export class ExpressPurchaseButtonWrapper {
  protected button = null;
  private state: { props: ExpressPurchaseButtonProps | null };

  static build(
    htmlTarget: HTMLElement,
    onButtonReady: (updater: ExpressPurchaseButtonUpdater) => void,
    props: ExpressPurchaseButtonProps,
  ) {
    return new ExpressPurchaseButtonWrapper().setProps(
      htmlTarget,
      onButtonReady,
      props,
    );
  }

  constructor() {
    this.state = $state({
      props: null,
    });
  }

  setProps(
    htmlTarget: HTMLElement,
    onButtonReady: (updater: ExpressPurchaseButtonUpdater) => void,
    props: ExpressPurchaseButtonProps,
  ) {
    this.state.props = { ...props };
    if (!this.state.props) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    this.button = mount(ExpressPurchaseButton, {
      target: htmlTarget,
      props: this.state.props,
    });
    const updatePurchase = (pkg: Package) => {
      this.setPackage(pkg);
    };
    const updater: ExpressPurchaseButtonUpdater = {
      updatePurchase: updatePurchase,
    };
    onButtonReady(updater);
  }

  setPackage(pkg: Package) {
    if (!this.state.props) {
      return;
    }
    this.state.props.rcPackage = pkg;
    this.state.props.purchaseOption =
      pkg.webBillingProduct.defaultPurchaseOption;
  }
}
