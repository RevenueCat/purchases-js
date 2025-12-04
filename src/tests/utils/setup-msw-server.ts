import type { HttpHandler } from "msw";
import { setupServer, type SetupServerApi } from "msw/node";
import { afterAll, afterEach, beforeAll } from "vitest";

export function setupMswServer(
  ...handlers: HttpHandler[]
): Omit<SetupServerApi, "listen" | "close" | "resetHandlers"> {
  const server = setupServer(...handlers);

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  return server;
}
