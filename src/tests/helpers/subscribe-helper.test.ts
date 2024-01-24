import { beforeAll, expect, test } from "vitest";
import { subscribe } from "../../helpers/subscribe-helper";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { Backend } from "../../networking/backend";

const server = setupServer(
  http.post("http://localhost:8000/rcbilling/v1/subscribe", () => {
    return HttpResponse.json(
      {
        next_action: "collect_payment_info",
        data: {
          client_secret: "seti_123",
        },
      },
      { status: 200 },
    );
  }),
);

beforeAll(() => {
  server.listen();
});

test("can post to subscribe", async () => {
  const backend = new Backend("test_api_key");
  const subscribeResponse = await subscribe(
    backend,
    "someAppUserId",
    "product_1",
    "someone@somewhere.com",
  );

  expect(subscribeResponse).toEqual({
    nextAction: "collect_payment_info",
    data: {
      clientSecret: "seti_123",
    },
  });
});
