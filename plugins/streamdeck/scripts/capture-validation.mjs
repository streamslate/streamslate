import { execFile } from "node:child_process";
import { hostname, platform, release } from "node:os";
import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const pluginRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const repoRoot = path.resolve(pluginRoot, "../..");
const packagePath = path.join(pluginRoot, "package.json");
const rootPackagePath = path.join(repoRoot, "package.json");
const manifestPath = path.join(
  pluginRoot,
  "ai.flexinfer.streamslate.sdPlugin",
  "manifest.json"
);
const VALID_RESULTS = new Set(["pass", "fail", "partial"]);

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const [pkg, rootPkg, manifest, gitCommit, streamdeckCli] = await Promise.all([
    readJson(packagePath),
    readJson(rootPackagePath),
    readJson(manifestPath),
    commandOrBlank("git", ["rev-parse", "--short", "HEAD"], {
      cwd: repoRoot,
    }),
    commandOrBlank("streamdeck", ["-v"], { cwd: pluginRoot }),
  ]);

  const probe = args.probe
    ? await probeStreamSlate({
        host: args.host,
        port: args.port,
        timeoutMs: args.timeoutMs,
      })
    : null;

  const capture = buildCapture({
    date: new Date().toISOString(),
    evidenceLinks: args.evidenceLinks,
    tester: args.tester,
    result: args.result,
    target: args.target,
    pkg,
    rootPkg,
    manifest,
    gitCommit,
    streamdeckCli,
    probe,
  });
  const report = renderReport(capture);

  if (args.output) {
    const outputPath = path.resolve(process.cwd(), args.output);
    await writeFile(outputPath, report, "utf8");
    console.log(`Wrote ${path.relative(process.cwd(), outputPath)}`);
  }

  if (args.jsonOutput) {
    const jsonOutputPath = path.resolve(process.cwd(), args.jsonOutput);
    await writeFile(
      jsonOutputPath,
      `${JSON.stringify(renderJson(capture), null, 2)}\n`,
      "utf8"
    );
    console.log(`Wrote ${path.relative(process.cwd(), jsonOutputPath)}`);
  }

  if (!args.output) process.stdout.write(report);
}

function parseArgs(argv) {
  const parsed = {
    evidenceLinks: [],
    help: false,
    host: "127.0.0.1",
    jsonOutput: "",
    output: "",
    port: 11451,
    probe: false,
    result: "",
    target: "",
    tester: "",
    timeoutMs: 3000,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      return argv[index] ?? "";
    };

    if (arg === "--help" || arg === "-h") parsed.help = true;
    else if (arg === "--probe") parsed.probe = true;
    else if (arg === "--host") parsed.host = next();
    else if (arg === "--port") parsed.port = Number(next());
    else if (arg === "--timeout-ms") parsed.timeoutMs = Number(next());
    else if (arg === "--json-output") parsed.jsonOutput = next();
    else if (arg === "--output" || arg === "-o") parsed.output = next();
    else if (arg === "--tester") parsed.tester = next();
    else if (arg === "--result") parsed.result = next();
    else if (arg === "--evidence-link") parsed.evidenceLinks.push(next());
    else if (arg === "--target") parsed.target = next();
    else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isInteger(parsed.port) || parsed.port <= 0) {
    throw new Error("--port must be a positive integer");
  }
  if (!Number.isInteger(parsed.timeoutMs) || parsed.timeoutMs <= 0) {
    throw new Error("--timeout-ms must be a positive integer");
  }
  if (parsed.result && !VALID_RESULTS.has(parsed.result)) {
    throw new Error("--result must be one of: pass, fail, partial");
  }
  if (parsed.evidenceLinks.some((link) => link.trim() === "")) {
    throw new Error("--evidence-link must be a non-empty value");
  }

  return parsed;
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function commandOrBlank(command, commandArgs, options = {}) {
  try {
    const { stdout } = await execFileAsync(command, commandArgs, options);
    return stdout.trim();
  } catch {
    return "";
  }
}

async function probeStreamSlate({ host, port, timeoutMs }) {
  const { WebSocket } = await import("ws");
  const url = `ws://${host}:${port}`;
  const observed = [];

  return new Promise((resolve) => {
    const ws = new WebSocket(url);
    const startedAt = Date.now();
    let connected = false;
    let capabilities = null;
    let state = null;
    let pong = null;
    let error = "";
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      ws.close();
      resolve({
        url,
        connected,
        elapsedMs: Date.now() - startedAt,
        capabilities,
        state,
        pong,
        observed,
        error,
      });
    };

    const timer = setTimeout(() => {
      error = connected
        ? "Timed out waiting for responses"
        : "Connection timed out";
      finish();
    }, timeoutMs);

    ws.on("open", () => {
      connected = true;
      send(ws, "GET_CAPABILITIES", "validation-capabilities");
      send(ws, "GET_STATE", "validation-state");
      send(ws, "PING", "validation-ping");
    });

    ws.on("message", (data) => {
      const event = parseEvent(data);
      if (!event) return;

      observed.push(event.type);
      if (event.type === "CAPABILITIES") capabilities = event;
      if (event.type === "STATE") state = event;
      if (event.type === "PONG") pong = event;

      if (capabilities && state && pong) finish();
    });

    ws.on("error", (eventError) => {
      error = eventError.message;
      finish();
    });
  });
}

function send(ws, type, requestId) {
  ws.send(
    JSON.stringify({
      type,
      protocolVersion: "2.0",
      request_id: requestId,
    })
  );
}

function parseEvent(data) {
  try {
    return JSON.parse(data.toString("utf8"));
  } catch {
    return null;
  }
}

function buildCapture({
  date,
  evidenceLinks,
  tester,
  result,
  target,
  pkg,
  rootPkg,
  manifest,
  gitCommit,
  streamdeckCli,
  probe,
}) {
  return {
    date,
    evidenceLinks,
    tester,
    result,
    target,
    packageVersion: pkg.version,
    streamSlateVersion: rootPkg.version,
    manifestVersion: manifest.Version,
    manifestName: manifest.Name,
    manifestUuid: manifest.UUID,
    gitCommit,
    streamdeckCli,
    probe,
  };
}

function renderReport({
  date,
  evidenceLinks,
  tester,
  result,
  target,
  packageVersion,
  streamSlateVersion,
  manifestVersion,
  gitCommit,
  streamdeckCli,
  probe,
}) {
  const capabilities = probe?.capabilities;
  const supportedCommands = Array.isArray(capabilities?.supported_commands)
    ? capabilities.supported_commands.join(", ")
    : "";
  const supportedEvents = Array.isArray(capabilities?.supported_events)
    ? capabilities.supported_events.join(", ")
    : "";
  const evidenceBlock =
    evidenceLinks.length > 0
      ? `\n${evidenceLinks.map((link) => `  - ${link}`).join("\n")}`
      : "";

  return `# Stream Deck Validation Capture

Generated by \`npm run capture:validation\`. Use this as supporting evidence for
\`docs/streamdeck-validation-report.md\`; it does not mark hardware or Stream
Deck Mobile validation complete by itself.

## Summary

- Date: ${date}
- Tester: ${tester || ""}
- Result: ${result || "pass | fail | partial"}
- StreamSlate commit: ${gitCommit}
- StreamSlate version: ${streamSlateVersion}
- Plugin package version: ${packageVersion}
- Plugin manifest version: ${manifestVersion}
- Validation target: ${target || "hardware | Stream Deck Mobile"}
- Evidence links:${evidenceBlock}

## Environment

- Hostname: ${hostname()}
- OS and version: ${platform()} ${release()}
- Stream Deck app version:
- Stream Deck device or mobile version:
- Node.js version: ${process.version}
- Stream Deck CLI version: ${streamdeckCli || "not detected"}
- StreamSlate launch command:
- Plugin install method: link | local package

## Loopback API Probe

- Probe requested: ${probe ? "yes" : "no"}
- Endpoint: ${probe?.url ?? "not probed"}
- Connected: ${probe ? yesNo(probe.connected) : ""}
- Elapsed milliseconds: ${probe?.elapsedMs ?? ""}
- Error: ${probe?.error ?? ""}
- Observed event types: ${probe?.observed.join(", ") ?? ""}
- Supported commands: ${supportedCommands}
- Supported events: ${supportedEvents}
- Current state received: ${probe?.state ? "yes" : "no"}
- Pong received: ${probe?.pong ? "yes" : "no"}

## Manual Action Results

| Action | Expected result | Result | Notes |
| ------ | --------------- | ------ | ----- |
| Next Page | Current page increments | | |
| Previous Page | Current page decrements | | |
| Go To Page | Configured page opens | | |
| Set Zoom | Configured zoom applies | | |
| Toggle Presenter | Presenter mode opens or closes | | |
| Refresh State | Key state/title reflects current PDF | | |
| Health Check | Plugin reports StreamSlate availability | | |

## Resilience

- [ ] Quitting StreamSlate while Stream Deck remains open shows a disconnected or error state without crashing Stream Deck
- [ ] Restarting StreamSlate reconnects the plugin and refreshes state
- [ ] Invalid page or zoom input reports an error without leaving stale key state
- [ ] Removing the active PDF clears page-dependent state

## Notes

`;
}

function renderJson(capture) {
  return {
    schemaVersion: "streamslate.streamdeck.validation-capture.v1",
    generatedAt: capture.date,
    summary: {
      tester: capture.tester || null,
      result: capture.result || null,
      target: capture.target || null,
      evidenceLinks: capture.evidenceLinks,
    },
    streamSlate: {
      commit: capture.gitCommit || null,
      version: capture.streamSlateVersion,
    },
    plugin: {
      packageVersion: capture.packageVersion,
      manifestVersion: capture.manifestVersion,
      manifestName: capture.manifestName,
      manifestUuid: capture.manifestUuid,
    },
    environment: {
      hostname: hostname(),
      os: `${platform()} ${release()}`,
      nodeVersion: process.version,
      streamDeckCliVersion: capture.streamdeckCli || null,
    },
    loopbackApiProbe: capture.probe,
    externalValidationComplete: false,
  };
}

function yesNo(value) {
  return value ? "yes" : "no";
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

function printHelp() {
  console.log(`Usage: npm run capture:validation -- [options]

Options:
  --probe                 Connect to StreamSlate's loopback WebSocket API.
  --host <host>           WebSocket host. Default: 127.0.0.1.
  --port <port>           WebSocket port. Default: 11451.
  --timeout-ms <ms>       Probe timeout. Default: 3000.
  --tester <name>         Tester name to prefill.
  --target <target>       hardware or Stream Deck Mobile.
  --result <result>       Validation result: pass, fail, or partial.
  --evidence-link <link>  Evidence URL/path/note. Can be passed more than once.
  --json-output <file>    Write structured JSON evidence metadata to a file.
  -o, --output <file>     Write markdown to a file instead of stdout.
  -h, --help              Show this help.
`);
}
