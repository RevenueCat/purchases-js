import { v4 as uuidv4 } from "uuid";

/**
 * Generates a random anonymous user ID in the format "$RCAnonymousID:{uuid without dashes}".
 * @internal
 */
export function generateAnonymousAppUserId(): string {
  return `$RCAnonymousID:${uuidv4().replace(/-/g, "")}`;
}
