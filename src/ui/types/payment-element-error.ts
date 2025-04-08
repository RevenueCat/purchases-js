export enum PaymentElementErrorCode {
  ErrorLoadingStripe = 0,
  HandledFormSubmissionError = 1,
  UnhandledFormSubmissionError = 2,
}

export type PaymentElementError = {
  code: PaymentElementErrorCode;
  gatewayErrorCode: string | undefined;
  message: string | undefined;
};
