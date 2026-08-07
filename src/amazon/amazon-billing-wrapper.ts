import {
  productsForProductDataResponse,
  purchasesErrorForProductDataResponse,
} from "./conversions/product-data-response-conversions";
import {
  type AmazonVegaSdk,
  loadAmazonVegaSdk,
} from "./amazon-vega-sdk-loader";
import type { BillingWrapper } from "src/helpers/billing-wrapper";
import type { ProductsResponse } from "src/networking/responses/products-response";

/**
 * Amazon billing wrapper. Handles processing of various functions for the Amazon Store
 * when running on the Vega OS.
 * @internal
 */
export class AmazonBillingWrapper implements BillingWrapper {
  constructor(
    private readonly loadSdk: () => Promise<AmazonVegaSdk> = loadAmazonVegaSdk,
  ) {}

  public async getProducts(
    _appUserId: string,
    productIds: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _currency?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _discountCode?: string,
  ): Promise<ProductsResponse> {
    const sdk = await this.loadSdk();
    const response = await sdk.PurchasingService.getProductData({
      skus: productIds,
    });
    console.log(
      `PurchaseService.getProductData() response tree\n${JSON.stringify(
        response,
        (_key, value) => {
          if (value instanceof Map) {
            return Object.fromEntries(value);
          }

          if (typeof value === "bigint") {
            return value.toString();
          }

          return value;
        },
        2,
      )}`,
    );

    const purchasesError = purchasesErrorForProductDataResponse(
      response,
      sdk.ProductDataResponseCode,
    );
    if (purchasesError) {
      throw purchasesError;
    }

    return {
      product_details: productsForProductDataResponse(
        response,
        sdk.ProductType,
      ),
    };
  }
}
