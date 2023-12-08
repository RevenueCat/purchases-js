import { StatusCodes } from "http-status-codes";

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
