import { StatusCodes } from "http-status-codes";

export enum ErrorCode {
  UnknownError = 0,
  UserCancelledError = 1,
}

export class PurchasesError extends Error {
  constructor(
    public readonly errorCode: ErrorCode,
    message?: string,
  ) {
    super(message);
  }
}

export class ServerError extends Error {
  constructor(
    public readonly statusCode: number,
    message?: string | undefined,
  ) {
    super(message);
  }
}

export class UnknownServerError extends ServerError {
  constructor() {
    super(StatusCodes.INTERNAL_SERVER_ERROR, "An unknown error occurred.");
  }
}

export class InvalidInputDataError extends ServerError {}

export class AlreadySubscribedError extends ServerError {}

export class PaymentGatewayError extends ServerError {}

export class ConcurrentSubscriberAttributeUpdateError extends ServerError {}
