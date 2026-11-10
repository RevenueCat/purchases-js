import { describe, expect, test } from "vitest";
import {
  deserializeSession,
  InvalidIamTokenError,
  serializeSession,
  sessionFromTokens,
  sessionFromTokensResponse,
} from "../../iam/iam-session";
import { makeAccessToken, makeTokensResponse } from "./iam-test-helpers";

describe("sessionFromTokens", () => {
  test("reads the app user ID from the access token", () => {
    const session = sessionFromTokens({
      accessToken: makeAccessToken("user-ü-1"),
    });

    expect(session.appUserId).toBe("user-ü-1");
    expect(session.refreshToken).toBeNull();
    expect(session.idToken).toBeNull();
  });

  test.each([
    { amr: ["anonymous"], expected: true },
    { amr: ["anonymous", "anonymous"], expected: true },
    { amr: ["anonymous", "oidc"], expected: false },
    { amr: ["firebase"], expected: false },
    { amr: [], expected: false },
  ])("isAnonymous is $expected for amr $amr", ({ amr, expected }) => {
    const session = sessionFromTokens({
      accessToken: makeAccessToken("user", { amr }),
    });

    expect(session.isAnonymous).toBe(expected);
  });

  test.each(["not-a-jwt", "a.b.c", "a.bnVsbA.c"])(
    "rejects malformed access token %s",
    (accessToken) => {
      expect(() => sessionFromTokens({ accessToken })).toThrow(
        InvalidIamTokenError,
      );
    },
  );

  test("rejects an access token without an app user ID", () => {
    const accessToken = makeAccessToken("");

    expect(() => sessionFromTokens({ accessToken })).toThrow(
      InvalidIamTokenError,
    );
  });
});

describe("sessionFromTokensResponse", () => {
  test("keeps tokens the response did not reissue", () => {
    const previous = sessionFromTokensResponse(makeTokensResponse("user"));
    const refreshed = sessionFromTokensResponse(
      {
        ...makeTokensResponse("user", { tokenId: "2" }),
        refresh_token: undefined,
        id_token: undefined,
      },
      previous,
    );

    expect(refreshed.accessToken).toBe(
      makeAccessToken("user", { tokenId: "2" }),
    );
    expect(refreshed.refreshToken).toBe(previous.refreshToken);
    expect(refreshed.idToken).toBe(previous.idToken);
  });
});

describe("session serialization", () => {
  test("round-trips a session", () => {
    const session = sessionFromTokensResponse(
      makeTokensResponse("user", { amr: ["oidc"] }),
    );

    expect(deserializeSession(serializeSession(session))).toEqual(session);
  });

  test.each([null, "", "not json", "{}", '{"access_token": 1}', "null"])(
    "returns null for unusable stored value %s",
    (raw) => {
      expect(deserializeSession(raw)).toBeNull();
    },
  );
});
