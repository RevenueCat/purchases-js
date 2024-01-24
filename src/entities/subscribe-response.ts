import { SubscribeResponse } from "../networking/responses/subscribe-response";

export interface SubscribeProcessedResponse {
  nextAction: string;
  data: {
    clientSecret?: string;
  };
}

export const toSubscribeProcessedResponse = (
  raw: SubscribeResponse,
): SubscribeProcessedResponse => {
  return {
    nextAction: raw.next_action,
    data: {
      clientSecret: raw.data?.client_secret ?? undefined,
    },
  };
};
