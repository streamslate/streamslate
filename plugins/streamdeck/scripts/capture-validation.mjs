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

  const report = renderReport({
    date: new Date().toISOString(),
    tester: args.tester,
    target: args.target,
    pkg,
    rootPkg,
    manifest,
    gitCommit,
    streamdeckCli,
    probe,
  });

  if (args.output) {
    const outputPath = path.resolve(process.cwd(), args.output);
    await writeFile(outputPath, report, "utf8");
    console.log(`Wrote ${path.relative(process.cwd(), outputPath)}`);
    return;
  }

  process.stdout.write(report);
}

function parseArgs(argv) {
  const parsed = {
    help: false,
    host: "127.0.0.1",
    output: "",
    port: 11451,
    probe: false,
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
    else if (arg === "--output" || arg === "-o") parsed.output = next();
    else if (arg === "--tester") parsed.tester = next();
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

function renderReport({
  date,
  tester,
  target,
  pkg,
  rootPkg,
  manifest,
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

  return `# Stream Deck Validation Capture

Generated by \`npm run capture:validation\`. Use this as supporting evidence for
\`docs/streamdeck-validation-report.md\`; it does not mark hardware or Stream
Deck Mobile validation complete by itself.

## Summary

- Date: ${date}
- Tester: ${tester || ""}
- Result: pass | fail | partial
- StreamSlate commit: ${gitCommit}
- StreamSlate version: ${rootPkg.version}
- Plugin package version: ${pkg.version}
- Plugin manifest version: ${manifest.Version}
- Validation target: ${target || "hardware | Stream Deck Mobile"}
- Evidence links:

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
  -o, --output <file>     Write markdown to a file instead of stdout.
  -h, --help              Show this help.
`);
}
