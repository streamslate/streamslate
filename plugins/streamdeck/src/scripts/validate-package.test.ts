import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const testDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(testDir, "../..");
const scriptPath = path.join(pluginRoot, "scripts", "validate-package.mjs");

describe("validate-package CLI", () => {
  it("accepts the packaged plugin layout and .sdignore guard", async () => {
    const { stdout } = await execFileAsync(process.execPath, [scriptPath], {
      cwd: pluginRoot,
      env: { ...process.env, FORCE_COLOR: "0" },
      timeout: 10_000,
    });

    expect(stdout).toContain("Stream Deck package validation passed.");
  });
});
