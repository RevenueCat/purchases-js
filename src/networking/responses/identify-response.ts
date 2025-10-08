import type { SubscriberResponse } from "./subscriber-response";

export interface IdentifyResponse extends SubscriberResponse {
  was_created: boolean;
}
