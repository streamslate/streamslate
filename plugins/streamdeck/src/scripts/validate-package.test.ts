import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
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

  it("writes marketplace package audit artifacts", async () => {
    const outputDir = await mkdtemp(path.join(tmpdir(), "streamslate-audit-"));

    try {
      const { stdout } = await execFileAsync(
        process.execPath,
        [
          scriptPath,
          "--audit-output",
          "package-audit.md",
          "--json-output",
          "package-audit.json",
        ],
        {
          cwd: outputDir,
          env: { ...process.env, FORCE_COLOR: "0" },
          timeout: 10_000,
        }
      );

      const markdown = await readFile(
        path.join(outputDir, "package-audit.md"),
        "utf8"
      );
      const json = JSON.parse(
        await readFile(path.join(outputDir, "package-audit.json"), "utf8")
      );

      expect(stdout).toContain("Wrote package-audit.md");
      expect(stdout).toContain("Wrote package-audit.json");
      expect(stdout).toContain("Stream Deck package validation passed.");
      expect(markdown).toContain("# Stream Deck Package Audit");
      expect(markdown).toContain("`ai.flexinfer.streamslate`");
      expect(json.validationStatus).toBe("passed");
      expect(json.manifest.uuid).toBe("ai.flexinfer.streamslate");
      expect(
        json.actions.map((action: { name: string }) => action.name)
      ).toContain("Next Page");
      expect(
        json.checkedFiles.some(
          (file: { path: string; sha256?: string }) =>
            file.path === "bin/plugin.js" && typeof file.sha256 === "string"
        )
      ).toBe(true);
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });
});
