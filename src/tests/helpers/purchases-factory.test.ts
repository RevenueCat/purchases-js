import { afterEach, describe, expect, test } from "vitest";
import {
  getPurchasesFactory,
  registerPurchasesFactory,
  resetPurchasesFactory,
  type PurchasesFactory,
} from "../../helpers/purchases-factory";

const createFactory = (): PurchasesFactory => ({
  validateApiKey: () => {},
  createPurchases: () => ({}) as never,
  createBillingWrapper: () => ({}) as never,
});

describe("purchases factory", () => {
  afterEach(() => resetPurchasesFactory());

  test("is undefined before registration", () => {
    resetPurchasesFactory();
    expect(getPurchasesFactory()).toBeUndefined();
  });

  test("registers and replaces a factory", () => {
    const original = createFactory();
    const replacement = createFactory();

    registerPurchasesFactory(original);
    expect(getPurchasesFactory()).toBe(original);

    registerPurchasesFactory(replacement);
    expect(getPurchasesFactory()).toBe(replacement);
  });
});
