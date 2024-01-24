import { Backend } from "../networking/backend";
import { SubscribeResponse } from "../networking/responses/subscribe-response";

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
): Promise<SubscribeResponse> {
  return await backend.postSubscribe(appUserId, productId, email);
}
