import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { createServer } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = { darkMode: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) {
        throw new Error(`${a} requires a value`);
      }
      return argv[++i];
    };
    switch (a) {
      case "--input":
        out.input = next();
        break;
      case "--offerings":
        out.offerings = next();
        break;
      case "--offering-id":
        out.offeringId = next();
        break;
      case "--offering":
        out.offering = next();
        break;
      case "--locale":
        out.locale = next();
        break;
      case "--dark-mode":
        out.darkMode = true;
        break;
      case "--width":
        out.width = Number(next());
        break;
      case "--height":
        out.height = Number(next());
        break;
      case "--scale":
        out.scale = Number(next());
        break;
      case "--out":
        out.out = next();
        break;
      default:
        throw new Error(`Unknown arg: ${a}`);
    }
  }
  if (out.input == null && out.offerings == null) {
    throw new Error("Missing required --input or --offerings");
  }
  for (const required of ["locale", "width", "height", "out"]) {
    if (out[required] == null)
      throw new Error(`Missing required --${required}`);
  }
  requirePositiveNumber(out.width, "width");
  requirePositiveNumber(out.height, "height");
  if (out.scale !== undefined) requirePositiveNumber(out.scale, "scale");
  return out;
}

/**
 * Normalize an RC `/offerings`-shaped JSON into an ExtractInput-friendly
 * `{ paywallData, uiConfig }` pair. The API response uses snake_case keys and
 * may omit `id`, `default_locale`, or `ui_config` entirely; we synthesize
 * sensible fallbacks.
 */
function normalizeOfferingsPayload(payload, offeringIdArg) {
  if (!payload || !Array.isArray(payload.offerings)) {
    throw new Error(
      "--offerings file must be a JSON object with an `offerings` array (RC /offerings response shape).",
    );
  }
  const wantedId = offeringIdArg ?? payload.current_offering_id ?? null;
  const offering =
    (wantedId && payload.offerings.find((o) => o.identifier === wantedId)) ||
    payload.offerings[0];
  if (!offering) {
    throw new Error("`offerings` array is empty.");
  }
  const pw = offering.paywall_components;
  if (!pw) {
    throw new Error(
      `Offering "${offering.identifier ?? "(unknown)"}" has no paywall_components.`,
    );
  }
  const localeKeys = Object.keys(pw.components_localizations ?? {});
  const paywallData = {
    ...pw,
    id: pw.id ?? offering.identifier ?? "paywall",
    default_locale: pw.default_locale ?? localeKeys[0] ?? "en_US",
  };
  const uiConfig = offering.ui_config ??
    payload.ui_config ?? {
      app: { fonts: {}, colors: {} },
    };
  return {
    paywallData,
    uiConfig,
    offeringIdentifier: offering.identifier ?? null,
  };
}

function requirePositiveNumber(value, name) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`--${name} must be a positive number (got: ${value})`);
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function main() {
  const args = parseArgs(process.argv);

  let paywallData;
  let uiConfig;
  let customVariables;
  let offeringId;
  const offering = args.offering ? await readJson(args.offering) : undefined;

  if (args.offerings) {
    const payload = await readJson(args.offerings);
    const normalized = normalizeOfferingsPayload(payload, args.offeringId);
    paywallData = normalized.paywallData;
    uiConfig = normalized.uiConfig;
    offeringId = normalized.offeringIdentifier ?? undefined;
  } else {
    const inputPayload = await readJson(args.input);
    paywallData = inputPayload.paywallData;
    uiConfig = inputPayload.uiConfig;
    customVariables = inputPayload.customVariables;
  }

  const extractInput = {
    paywallData,
    uiConfig,
    offering,
    offeringId,
    locale: args.locale,
    darkMode: args.darkMode,
    viewport: {
      width: args.width,
      height: args.height,
      scale: args.scale ?? 1,
    },
    customVariables,
  };

  // Two issues to fix in the dev-server transform pipeline:
  //
  // 1. Vite's `define` only applies at build time (via esbuild full compile).
  //    In dev mode, source files are stripped of types only, so
  //    __RC_PAYWALL_EXTRACTOR__ is left as a bare identifier.  We replace it
  //    with the literal `true` in a transform hook.
  //
  // 2. TC39 stage-3 decorators (`@decorator` before a class method) are not
  //    natively supported by the Chromium build bundled with Playwright 1.59.
  //    Vite's dev-mode transform strips TypeScript types but does not lower
  //    decorators.  We strip them here as a defensive measure; they are never
  //    needed in the extractor execution path.
  const devFixupPlugin = {
    name: "rc-extractor-dev-fixup",
    transform(code) {
      let changed = false;
      if (code.includes("__RC_PAYWALL_EXTRACTOR__")) {
        code = code.replaceAll("__RC_PAYWALL_EXTRACTOR__", "true");
        changed = true;
      }
      // Strip standalone TC39 decorator lines: lines that are exactly
      // `  @identifier` (with any leading whitespace), followed by a newline.
      if (/^\s*@\w/m.test(code)) {
        code = code.replace(/^[ \t]*@\w[^\n]*\n/gm, "");
        changed = true;
      }
      if (changed) return { code };
    },
  };

  const server = await createServer({
    // Use the project's vite.config.js so the Svelte plugin and TypeScript
    // decorator handling are set up correctly.  We then merge our own plugin
    // first so the __RC_PAYWALL_EXTRACTOR__ define is substituted before the
    // rest of the transform pipeline runs.
    configFile: resolve(__dirname, "../vite.config.js"),
    root: resolve(__dirname, "extractor-playground"),
    mode: "development",
    server: { port: 0 },
    logLevel: "error",
    plugins: [devFixupPlugin],
  });
  await server.listen();

  // Vite 6 may return 0 from server.config.server.port when port:0 was requested;
  // fall back to the OS-assigned port from the underlying http.Server.
  let port = server.config.server.port;
  if (!port) {
    port = server.httpServer.address().port;
  }
  const url = `http://localhost:${port}/`;

  console.log("Launching browser...");
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: args.width, height: args.height },
      deviceScaleFactor: args.scale ?? 1,
      colorScheme: args.darkMode ? "dark" : "light",
    });
    const page = await context.newPage();
    await page.goto(url);
    await page.waitForFunction(
      () => typeof window.__rcExtractPaywallLayout__ === "function",
      null,
      { timeout: 10_000 },
    );
    // Pass __skipCleanup so the in-page extractor leaves the paywall mounted
    // after measurement — we need to screenshot it before the browser closes.
    // The browser teardown in `finally` handles all cleanup regardless.
    const result = await page.evaluate(
      (input) => window.__rcExtractPaywallLayout__(input),
      { ...extractInput, __skipCleanup: true },
    );

    await mkdir(dirname(resolve(args.out)), { recursive: true });
    await writeFile(
      resolve(args.out),
      JSON.stringify(result, null, 2) + "\n",
      "utf8",
    );
    console.log(`Wrote ${args.out}`);

    // Take a PNG snapshot of the rendered paywall alongside the JSON. The
    // path mirrors `--out` with the .json extension swapped for .png; if
    // `--out` doesn't end in .json we just append .png.
    const outPath = resolve(args.out);
    const pngPath = outPath.endsWith(".json")
      ? outPath.slice(0, -5) + ".png"
      : outPath + ".png";
    // `fullPage: false` (the default) captures just the viewport, which is
    // exactly the area the extractor sized the container to. The paywall is
    // inside `[data-rc-extractor-root]`; we screenshot that element directly
    // so any framework chrome or background outside the container is excluded.
    const root = page.locator('[data-rc-extractor-root="true"]');
    if ((await root.count()) > 0) {
      await root.first().screenshot({ path: pngPath });
    } else {
      await page.screenshot({ path: pngPath });
    }
    console.log(`Wrote ${pngPath}`);
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
