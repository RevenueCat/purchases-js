import { describe, expect, test } from "vitest";
import type { VirtualCurrencyResponse } from "../../networking/responses/virtual-currencies-response";
import type { VirtualCurrency } from "../../entities/virtual-currency";
import { toVirtualCurrency } from "../../entities/virtual-currency";

describe("virtual currency parsing", () => {
  test("virtual currency with a description is parsed correctly", () => {
    const balance = 100;
    const code = "GLD";
    const name = "Gold";
    const description = "It's gold";

    const virtualCurrencyResponse: VirtualCurrencyResponse = {
      balance: balance,
      code: code,
      name: name,
      description: description,
    };

    const expectedVirtualCurrency: VirtualCurrency = {
      balance: balance,
      code: code,
      name: name,
      serverDescription: description,
    };

    const virtualCurrency = toVirtualCurrency(virtualCurrencyResponse);
    expect(virtualCurrency).toEqual(expectedVirtualCurrency);
  });

  test("virtual currency with no description is parsed correctly", () => {
    const balance = 100;
    const code = "GLD";
    const name = "Gold";

    const virtualCurrencyResponse: VirtualCurrencyResponse = {
      balance: balance,
      code: code,
      name: name,
      description: null,
    };

    const expectedVirtualCurrency: VirtualCurrency = {
      balance: balance,
      code: code,
      name: name,
      serverDescription: null,
    };

    const virtualCurrency = toVirtualCurrency(virtualCurrencyResponse);
    expect(virtualCurrency).toEqual(expectedVirtualCurrency);
  });

  test("virtual currency with negative balance is parsed correctly", () => {
    const balance = -100;
    const code = "GLD";
    const name = "Gold";
    const description = "It's gold";

    const virtualCurrencyResponse: VirtualCurrencyResponse = {
      balance: balance,
      code: code,
      name: name,
      description: description,
    };

    const expectedVirtualCurrency: VirtualCurrency = {
      balance: balance,
      code: code,
      name: name,
      serverDescription: description,
    };

    const virtualCurrency = toVirtualCurrency(virtualCurrencyResponse);
    expect(virtualCurrency).toEqual(expectedVirtualCurrency);
  });
});
