import { describe, expect, test } from "vitest";
import type {
  VirtualCurrenciesResponse,
  VirtualCurrencyResponse,
} from "../../networking/responses/virtual-currencies-response";
import type {
  VirtualCurrencies} from "../../entities/virtual-currencies";
import {
  toVirtualCurrencies
} from "../../entities/virtual-currencies";

describe("virtual currencies parsing", () => {
  test("virtual currencies with no currencies is parsed correctly", () => {
    const virtualCurrenciesResponse: VirtualCurrenciesResponse = {
      virtual_currencies: {},
    };

    const expectedVirtualCurrencies: VirtualCurrencies = {
      all: {},
    };

    const virtualCurrencies = toVirtualCurrencies(virtualCurrenciesResponse);
    expect(virtualCurrencies).toEqual(expectedVirtualCurrencies);
  });

  test("virtual currencies with one currency is parsed correctly", () => {
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

    const virtualCurrenciesResponse: VirtualCurrenciesResponse = {
      virtual_currencies: {
        [code]: virtualCurrencyResponse,
      },
    };

    const expectedVirtualCurrencies: VirtualCurrencies = {
      all: {
        [code]: {
          balance: balance,
          code: code,
          name: name,
          serverDescription: description,
        },
      },
    };

    const virtualCurrencies = toVirtualCurrencies(virtualCurrenciesResponse);
    expect(virtualCurrencies).toEqual(expectedVirtualCurrencies);
  });

  test("virtual currencies with two currencies is parsed correctly", () => {
    const balance = 100;
    const code = "GLD";
    const name = "Gold";
    const description = "It's gold";

    const balance2 = 200;
    const code2 = "SLV";
    const name2 = "Silver";
    const description2 = null;

    const virtualCurrencyResponse: VirtualCurrencyResponse = {
      balance: balance,
      code: code,
      name: name,
      description: description,
    };

    const virtualCurrencyResponse2: VirtualCurrencyResponse = {
      balance: balance2,
      code: code2,
      name: name2,
      description: description2,
    };

    const virtualCurrenciesResponse: VirtualCurrenciesResponse = {
      virtual_currencies: {
        [code]: virtualCurrencyResponse,
        [code2]: virtualCurrencyResponse2,
      },
    };

    const expectedVirtualCurrencies: VirtualCurrencies = {
      all: {
        [code]: {
          balance: balance,
          code: code,
          name: name,
          serverDescription: description,
        },
        [code2]: {
          balance: balance2,
          code: code2,
          name: name2,
          serverDescription: description2,
        },
      },
    };

    const virtualCurrencies = toVirtualCurrencies(virtualCurrenciesResponse);
    expect(virtualCurrencies).toEqual(expectedVirtualCurrencies);
  });

  test("virtual currencies with one currency with a negative balance is parsed correctly", () => {
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

    const virtualCurrenciesResponse: VirtualCurrenciesResponse = {
      virtual_currencies: {
        [code]: virtualCurrencyResponse,
      },
    };

    const expectedVirtualCurrencies: VirtualCurrencies = {
      all: {
        [code]: {
          balance: balance,
          code: code,
          name: name,
          serverDescription: description,
        },
      },
    };

    const virtualCurrencies = toVirtualCurrencies(virtualCurrenciesResponse);
    expect(virtualCurrencies).toEqual(expectedVirtualCurrencies);
  });

  test("virtual currencies with one currency with a null description is parsed correctly", () => {
    const balance = 0;
    const code = "GLD";
    const name = "Gold";
    const description = null;

    const virtualCurrencyResponse: VirtualCurrencyResponse = {
      balance: balance,
      code: code,
      name: name,
      description: description,
    };

    const virtualCurrenciesResponse: VirtualCurrenciesResponse = {
      virtual_currencies: {
        [code]: virtualCurrencyResponse,
      },
    };

    const expectedVirtualCurrencies: VirtualCurrencies = {
      all: {
        [code]: {
          balance: balance,
          code: code,
          name: name,
          serverDescription: null,
        },
      },
    };

    const virtualCurrencies = toVirtualCurrencies(virtualCurrenciesResponse);
    expect(virtualCurrencies).toEqual(expectedVirtualCurrencies);
  });
});
