import type { SubscriberResponse } from "./subscriber-response";

/**
 * Response from the identify endpoint.
 * Note: The backend returns a standard SubscriberResponse without a was_created field.
 * The was_created field is derived client-side from the HTTP status code:
 * - 201: User was created (was_created = true)
 * - 200: User already existed (was_created = false)
 */
export interface IdentifyResponse extends SubscriberResponse {
  was_created: boolean;
}
