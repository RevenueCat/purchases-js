import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const FORBIDDEN = [
  "extractPaywallLayout",
  "installExtractor",
  "__rcExtractPaywallLayout__",
];
const FILES = ["dist/Purchases.es.js", "dist/Purchases.umd.js"];

let failed = false;
for (const file of FILES) {
  let content;
  try {
    content = await readFile(resolve(process.cwd(), file), "utf8");
  } catch (err) {
    console.error(`Could not read ${file}: ${err.message}`);
    process.exit(2);
  }
  for (const symbol of FORBIDDEN) {
    if (content.includes(symbol)) {
      console.error(
        `FAIL: ${file} contains "${symbol}" — the extractor was not stripped.`,
      );
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log("OK: production bundle does not contain extractor symbols.");
