import { execFile } from "node:child_process";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import assert from "node:assert/strict";

const __dirname = dirname(fileURLToPath(import.meta.url));
const exec = promisify(execFile);

async function main() {
  const workDir = await mkdtemp(join(tmpdir(), "rc-extract-"));
  const outPath = join(workDir, "out.json");

  try {
    await exec(
      "node",
      [
        resolve(__dirname, "extract-paywall-layout.mjs"),
        "--input",
        resolve(__dirname, "fixtures/paywall.json"),
        "--locale",
        "en_US",
        "--width",
        "402",
        "--height",
        "874",
        "--scale",
        "1",
        "--out",
        outPath,
      ],
      { cwd: resolve(__dirname, ".."), env: process.env },
    );

    const result = JSON.parse(await readFile(outPath, "utf8"));

    assert.equal(result.metadata.platform, "web");
    assert.equal(result.metadata.locale, "en_US");
    assert.equal(result.metadata.extractorVersion, "1.0.0");
    assert.deepEqual(result.metadata.viewport, {
      width: 402,
      height: 874,
      scale: 1,
    });

    const requiredIds = ["root-stack", "title", "subtitle"];
    for (const id of requiredIds) {
      assert.ok(result.components[id], `missing component ${id}`);
      assert.equal(result.components[id].componentId, id);
    }

    // The title must render and have a non-zero frame.
    const title = result.components["title"];
    assert.equal(title.rendered, true);
    assert.equal(title.nativeType, "StaticText");
    assert.equal(title.label, "Unlock access");
    assert.ok(
      title.frame.width > 0 && title.frame.height > 0,
      `title has zero frame: ${JSON.stringify(title.frame)}`,
    );

    const subtitle = result.components["subtitle"];
    assert.equal(subtitle.rendered, true);
    assert.equal(subtitle.label, "Buy now");

    console.log("E2E extractor test PASSED");
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
