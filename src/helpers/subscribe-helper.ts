import {
  SubscribeProcessedResponse,
  toSubscribeProcessedResponse,
} from "../entities/subscribe-response";
import { Backend } from "../networking/backend";

export type SubscribeRequestBody = {
  app_user_id: string;
  product_id: string;
  email: string;
};

export async function subscribe(
  backend: Backend,
  appUserId: string,
  productId: string,
  email: string,
): Promise<SubscribeProcessedResponse> {
  const subscribeResponse = await backend.postSubscribe(
    appUserId,
    productId,
    email,
  );
  return toSubscribeProcessedResponse(subscribeResponse);
}
