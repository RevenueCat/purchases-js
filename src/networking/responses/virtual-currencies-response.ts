export interface VirtualCurrencyResponse {
  balance: number;
  code: string;
  description: string | null;
  name: string;
}

export interface VirtualCurrenciesResponse {
  virtual_currencies: { [currencyCode: string]: VirtualCurrencyResponse };
}
