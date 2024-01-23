import { beforeAll, expect, test } from "vitest";
import { subscribe } from "../../helpers/subscribe-helper";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { Purchases } from "../../main";

const STRIPE_TEST_DATA = {
  stripe: { accountId: "acct_123", publishableKey: "pk_123" },
} as const;

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
  const billing = new Purchases("test_api_key", STRIPE_TEST_DATA);
  const subscribeResponse = await subscribe(
    billing,
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
