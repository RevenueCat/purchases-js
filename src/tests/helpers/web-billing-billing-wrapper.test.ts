import { beforeEach, describe, expect, test, vi } from "vitest";
import { WebBillingBillingWrapper } from "../../helpers/web-billing-billing-wrapper";
import type { Backend } from "../../networking/backend";
import type { ProductsResponse } from "../../networking/responses/products-response";

describe("WebBillingBillingWrapper", () => {
  let getProducts: ReturnType<typeof vi.fn>;
  let wrapper: WebBillingBillingWrapper;

  beforeEach(() => {
    getProducts = vi.fn();
    wrapper = new WebBillingBillingWrapper({
      getProducts,
    } as unknown as Backend);
  });

  test("forwards product requests with the optional currency and discount code", async () => {
    const response: ProductsResponse = { product_details: [] };
    getProducts.mockResolvedValue(response);

    const result = await wrapper.getProducts(
      "app-user-id",
      ["monthly", "annual"],
      "EUR",
      "WELCOME10",
    );

    expect(getProducts).toHaveBeenCalledExactlyOnceWith(
      "app-user-id",
      ["monthly", "annual"],
      "EUR",
      "WELCOME10",
    );
    expect(result).toBe(response);
  });

  test("forwards omitted optional parameters and empty product lists", async () => {
    const response: ProductsResponse = { product_details: [] };
    getProducts.mockResolvedValue(response);

    await expect(wrapper.getProducts("app-user-id", [])).resolves.toBe(
      response,
    );

    expect(getProducts).toHaveBeenCalledExactlyOnceWith(
      "app-user-id",
      [],
      undefined,
      undefined,
    );
  });

  test("propagates backend errors unchanged", async () => {
    const backendError = new Error("Unable to load products");
    getProducts.mockRejectedValue(backendError);

    await expect(
      wrapper.getProducts("app-user-id", ["monthly"], "USD", "SALE"),
    ).rejects.toBe(backendError);
  });
});
