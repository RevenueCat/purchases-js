export type ServerResponse = any; // eslint-disable-line

export type PaymentProvider = "stripe"; // | 'another-one' | 'one-more' in the future

export type PaymentProviderConfigModels = {
  stripe?: {
    publishableKey: string;
    accountId: string;
  };
};

export type PaymentProviderSettings = Record<
  PaymentProvider,
  PaymentProviderConfigModels[PaymentProvider]
>;
