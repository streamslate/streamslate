import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { WebSocketServer } from "ws";

const execFileAsync = promisify(execFile);
const testDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(testDir, "../..");
const scriptPath = path.join(pluginRoot, "scripts", "capture-validation.mjs");

const tempDirs: string[] = [];

async function runCapture(args: string[] = []) {
  return execFileAsync(process.execPath, [scriptPath, ...args], {
    cwd: pluginRoot,
    env: { ...process.env, FORCE_COLOR: "0" },
    timeout: 10_000,
  });
}

async function makeTempDir() {
  const dir = await mkdtemp(path.join(tmpdir(), "streamslate-capture-"));
  tempDirs.push(dir);
  return dir;
}

describe("capture-validation CLI", () => {
  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))
    );
  });

  it("prints help for validation capture options", async () => {
    const { stdout } = await runCapture(["--help"]);

    expect(stdout).toContain("Usage: npm run capture:validation -- [options]");
    expect(stdout).toContain("--probe");
    expect(stdout).toContain("--target <target>");
    expect(stdout).toContain("--result <result>");
    expect(stdout).toContain("--evidence-link <link>");
    expect(stdout).toContain("-o, --output <file>");
  });

  it("renders a markdown evidence scaffold without probing StreamSlate", async () => {
    const { stdout } = await runCapture([
      "--tester",
      "QA User",
      "--target",
      "Stream Deck Mobile",
    ]);

    expect(stdout).toContain("# Stream Deck Validation Capture");
    expect(stdout).toContain("- Tester: QA User");
    expect(stdout).toContain("- Validation target: Stream Deck Mobile");
    expect(stdout).toContain("- Plugin package version: 0.1.0");
    expect(stdout).toContain("- Probe requested: no");
    expect(stdout).toContain("- Endpoint: not probed");
    expect(stdout).toContain(
      "it does not mark hardware or Stream\nDeck Mobile validation complete"
    );
  });

  it("writes the evidence scaffold to an output file", async () => {
    const dir = await makeTempDir();
    const outputPath = path.join(dir, "validation-capture.md");

    const { stdout } = await runCapture([
      "--tester",
      "Package QA",
      "--output",
      outputPath,
    ]);
    const report = await readFile(outputPath, "utf8");

    expect(stdout).toContain("Wrote ");
    expect(stdout).toContain("validation-capture.md");
    expect(report).toContain("- Tester: Package QA");
    expect(report).toContain("## Manual Action Results");
  });

  it("prefills result and evidence links", async () => {
    const { stdout } = await runCapture([
      "--result",
      "partial",
      "--evidence-link",
      "validation-capture.md",
      "--evidence-link",
      "https://example.test/evidence",
    ]);

    expect(stdout).toContain("- Result: partial");
    expect(stdout).toContain("- Evidence links:\n  - validation-capture.md");
    expect(stdout).toContain("  - https://example.test/evidence");
  });

  it("rejects invalid numeric arguments", async () => {
    await expect(runCapture(["--port", "0"])).rejects.toMatchObject({
      stderr: expect.stringContaining("--port must be a positive integer"),
    });
  });

  it("rejects invalid result values", async () => {
    await expect(runCapture(["--result", "unknown"])).rejects.toMatchObject({
      stderr: expect.stringContaining(
        "--result must be one of: pass, fail, partial"
      ),
    });
  });

  it("rejects empty evidence links", async () => {
    await expect(runCapture(["--evidence-link", ""])).rejects.toMatchObject({
      stderr: expect.stringContaining(
        "--evidence-link must be a non-empty value"
      ),
    });
  });

  it("captures loopback API probe evidence", async () => {
    const server = new WebSocketServer({ host: "127.0.0.1", port: 0 });
    await new Promise<void>((resolve) => server.once("listening", resolve));

    server.on("connection", (socket) => {
      socket.on("message", (data) => {
        const command = JSON.parse(data.toString("utf8")) as {
          type: string;
          request_id?: string;
        };

        if (command.type === "GET_CAPABILITIES") {
          socket.send(
            JSON.stringify({
              type: "CAPABILITIES",
              request_id: command.request_id,
              supported_commands: ["NEXT_PAGE", "PING"],
              supported_events: ["STATE", "PONG"],
            })
          );
        } else if (command.type === "GET_STATE") {
          socket.send(
            JSON.stringify({
              type: "STATE",
              request_id: command.request_id,
              page: 1,
              total_pages: 3,
              zoom: 1,
              pdf_loaded: true,
              presenter_active: false,
            })
          );
        } else if (command.type === "PING") {
          socket.send(
            JSON.stringify({ type: "PONG", request_id: command.request_id })
          );
        }
      });
    });

    try {
      const address = server.address();
      const port =
        typeof address === "object" && address !== null ? address.port : 0;
      const { stdout } = await runCapture([
        "--probe",
        "--port",
        String(port),
        "--timeout-ms",
        "1000",
      ]);

      expect(stdout).toContain("- Probe requested: yes");
      expect(stdout).toContain(`- Endpoint: ws://127.0.0.1:${port}`);
      expect(stdout).toContain("- Connected: yes");
      expect(stdout).toContain(
        "- Observed event types: CAPABILITIES, STATE, PONG"
      );
      expect(stdout).toContain("- Supported commands: NEXT_PAGE, PING");
      expect(stdout).toContain("- Supported events: STATE, PONG");
      expect(stdout).toContain("- Current state received: yes");
      expect(stdout).toContain("- Pong received: yes");
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
