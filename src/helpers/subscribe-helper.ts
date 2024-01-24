import { Purchases } from "../main";
import { performRequest } from "../networking/http-client";
import { SubscribeEndpoint } from "../networking/endpoints";
import { SubscribeResponse } from "../networking/responses/subscribe-response";
import {
  SubscribeProcessedResponse,
  toSubscribeProcessedResponse,
} from "../entities/subscribe-response";

type SubscribeRequestBody = {
  app_user_id: string;
  product_id: string;
  email: string;
};

export async function subscribe(
  purchases: Purchases,
  appUserId: string,
  productId: string,
  email: string,
): Promise<SubscribeProcessedResponse> {
  const subscribeResponse = await performRequest<
    SubscribeRequestBody,
    SubscribeResponse
  >(new SubscribeEndpoint(), purchases._API_KEY, {
    app_user_id: appUserId,
    product_id: productId,
    email,
  });
  return toSubscribeProcessedResponse(subscribeResponse);
}
