/**
 * Standalone demo token server.
 *
 * Plays the role of the developer's backend in the upgrade PoC: it holds the
 * secret API key and mints short-lived subscriber access tokens via the
 * RevenueCat Developer API `authenticate` endpoint. The browser only ever
 * receives the short-lived token, never the secret key.
 *
 * This is intentionally a separate process from the Vite dev server so the
 * secret key never lives anywhere in the frontend source tree or its env.
 *
 * Usage: copy `.env.example` to `.env`, fill it in, then `npm run token-server`.
 */

import { Buffer } from "node:buffer";
import { createServer } from "node:http";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

config({ path: fileURLToPath(new URL("./.env", import.meta.url)) });

const PORT = Number(process.env.TOKEN_SERVER_PORT ?? 8010);
const RC_API_BASE = process.env.RC_API_BASE ?? "https://api.revenuecat.com";
// Deliberately NOT prefixed with VITE_ so Vite can never bundle it into
// client code.
const RC_SECRET_API_KEY = process.env.RC_SECRET_API_KEY;
const RC_PROJECT_ID = process.env.RC_PROJECT_ID;
const RC_APP_ID = process.env.RC_APP_ID;
const RC_CANARY = process.env.RC_CANARY;

if (!RC_SECRET_API_KEY || !RC_PROJECT_ID || !RC_APP_ID) {
  console.error(
    "Missing configuration. Copy server/.env.example to server/.env and set " +
      "RC_SECRET_API_KEY, RC_PROJECT_ID and RC_APP_ID.",
  );
  process.exit(1);
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/api/upgrade-token") {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  try {
    const { appUserId } = await readJsonBody(req);
    if (!appUserId) {
      sendJson(res, 400, { error: "appUserId is required" });
      return;
    }

    // In a real backend this is where you would check that the request comes
    // from an authenticated session belonging to `appUserId`.
    const headers = {
      Authorization: `Bearer ${RC_SECRET_API_KEY}`,
      "Content-Type": "application/json",
    };
    if (RC_CANARY) {
      headers["X-RC-Canary"] = RC_CANARY;
    }

    const rcResponse = await fetch(
      `${RC_API_BASE}/v2/projects/${RC_PROJECT_ID}/apps/${RC_APP_ID}/authenticate`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ app_user_id: appUserId }),
      },
    );

    const data = await rcResponse.json();

    if (!rcResponse.ok) {
      console.error("authenticate call failed:", rcResponse.status, data);
      sendJson(res, rcResponse.status, data);
      return;
    }

    sendJson(res, 200, {
      access_token: data.access_token,
      expires_at: data.expires_at,
    });
  } catch (error) {
    console.error("Token server error:", error);
    sendJson(res, 500, { error: "Internal error" });
  }
});

server.listen(PORT, () => {
  console.log(`Demo token server listening on http://localhost:${PORT}`);
  console.log(`Minting tokens against ${RC_API_BASE} for app ${RC_APP_ID}`);
  if (RC_CANARY) {
    console.log(`Using canary: ${RC_CANARY}`);
  }
});
