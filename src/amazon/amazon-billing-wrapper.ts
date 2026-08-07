import type { BillingWrapper } from "src/helpers/billing-wrapper";
import type { ProductsResponse } from "src/networking/responses/products-response";
import {
  type AmazonVegaImplementation,
  loadAmazonVegaImplementation,
} from "./amazon-vega-implementation";

/**
 * Amazon billing wrapper. Defers loading the Vega-only implementation until it
 * is needed, so importing the core SDK remains safe in web environments.
 * @internal
 */
export class AmazonBillingWrapper implements BillingWrapper {
  private implementationPromise: Promise<AmazonVegaImplementation> | undefined;

  public async getProducts(
    _appUserId: string,
    productIds: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _currency?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _discountCode?: string,
  ): Promise<ProductsResponse> {
    return await (await this.getImplementation()).getProducts(productIds);
  }

  private getImplementation(): Promise<AmazonVegaImplementation> {
    return (this.implementationPromise ??= loadAmazonVegaImplementation());
  }
}
