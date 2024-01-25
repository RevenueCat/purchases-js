import {
  SubscribeResponse,
  toSubscribeResponse,
} from "../entities/subscribe-response";
import { StatusCodes } from "http-status-codes";
import {
  AlreadySubscribedError,
  ConcurrentSubscriberAttributeUpdateError,
  InvalidInputDataError,
  PaymentGatewayError,
  UnknownServerError,
} from "../entities/errors";
import { BASE_PATH, RC_ENDPOINT } from "./network-configuration";
import { Purchases } from "../main";

export async function subscribe(
  purchases: Purchases,
  appUserId: string,
  productId: string,
  email: string,
): Promise<SubscribeResponse> {
  const response = await fetch(`${RC_ENDPOINT}/${BASE_PATH}/subscribe`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${purchases._API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      app_user_id: appUserId,
      product_id: productId,
      email,
    }),
  });

  if (response.status === StatusCodes.BAD_REQUEST) {
    throw new InvalidInputDataError(response.status);
  }

  if (response.status === StatusCodes.TOO_MANY_REQUESTS) {
    throw new ConcurrentSubscriberAttributeUpdateError(response.status);
  }

  if (response.status === StatusCodes.CONFLICT) {
    throw new AlreadySubscribedError(response.status);
  }

  if (response.status === StatusCodes.INTERNAL_SERVER_ERROR) {
    throw new PaymentGatewayError(response.status);
  }

  if (
    response.status === StatusCodes.OK ||
    response.status === StatusCodes.CREATED
  ) {
    const data = await response.json();
    return toSubscribeResponse(data);
  }

  throw new UnknownServerError();
}
