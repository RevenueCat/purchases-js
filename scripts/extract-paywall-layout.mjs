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
  for (const required of ["input", "locale", "width", "height", "out"]) {
    if (out[required] == null)
      throw new Error(`Missing required --${required}`);
  }
  requirePositiveNumber(out.width, "width");
  requirePositiveNumber(out.height, "height");
  if (out.scale !== undefined) requirePositiveNumber(out.scale, "scale");
  return out;
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
  const inputPayload = await readJson(args.input);
  const offering = args.offering ? await readJson(args.offering) : undefined;

  const extractInput = {
    paywallData: inputPayload.paywallData,
    uiConfig: inputPayload.uiConfig,
    offering,
    locale: args.locale,
    darkMode: args.darkMode,
    viewport: {
      width: args.width,
      height: args.height,
      scale: args.scale ?? 1,
    },
    customVariables: inputPayload.customVariables,
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
    const result = await page.evaluate(
      (input) => window.__rcExtractPaywallLayout__(input),
      extractInput,
    );

    await mkdir(dirname(resolve(args.out)), { recursive: true });
    await writeFile(
      resolve(args.out),
      JSON.stringify(result, null, 2) + "\n",
      "utf8",
    );
    console.log(`Wrote ${args.out}`);
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
