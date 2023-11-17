import { ServerResponse } from "./types";

export interface SubscribeResponse {
  nextAction: string;
  data: {
    clientSecret?: string;
  };
}

export const toSubscribeResponse = (raw: ServerResponse): SubscribeResponse => {
  return {
    nextAction: raw.next_action,
    data: {
      clientSecret: raw.data?.client_secret ?? undefined,
    },
  } as SubscribeResponse;
};
