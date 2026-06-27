import { createHash } from "node:crypto";
import { access, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const pluginDir = path.join(root, "ai.flexinfer.streamslate.sdPlugin");
const manifestPath = path.join(pluginDir, "manifest.json");
const packagePath = path.join(root, "package.json");
const packageIgnorePath = path.join(pluginDir, ".sdignore");

const requiredManifestFields = [
  "Actions",
  "Author",
  "Category",
  "CodePath",
  "Description",
  "Icon",
  "Name",
  "Nodejs",
  "OS",
  "SDKVersion",
  "Software",
  "UUID",
  "Version",
];

const errors = [];
const checkedFiles = [];
const requiredIgnorePatterns = [
  "*.map",
  "logs/",
  "*.log",
  "*.streamDeckPlugin",
  "validation-*.md",
  "validation-*.json",
];

function parseArgs(argv) {
  const parsed = {
    auditOutput: "",
    help: false,
    jsonOutput: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      return argv[index] ?? "";
    };

    if (arg === "--help" || arg === "-h") parsed.help = true;
    else if (arg === "--audit-output") parsed.auditOutput = next();
    else if (arg === "--json-output") parsed.jsonOutput = next();
    else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (parsed.auditOutput.trim() === "") parsed.auditOutput = "";
  if (parsed.jsonOutput.trim() === "") parsed.jsonOutput = "";

  return parsed;
}

function printHelp() {
  console.log(`Usage: node scripts/validate-package.mjs [options]

Validate the local Stream Deck plugin package layout.

Options:
  --audit-output <file>  Write a Markdown package audit report
  --json-output <file>   Write package audit metadata as JSON
  -h, --help             Show this help text`);
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    errors.push(
      `Could not parse ${path.relative(root, file)}: ${error.message}`
    );
    return null;
  }
}

async function requireFile(relativePath, { nonEmpty = false } = {}) {
  const absolutePath = path.join(pluginDir, relativePath);

  try {
    await access(absolutePath);
  } catch {
    errors.push(`Missing package file: ${relativePath}`);
    return;
  }

  const details = await stat(absolutePath);
  if (details.size === 0) {
    errors.push(`Package file is empty: ${relativePath}`);
  }

  const checked = {
    path: normalizePackagePath(relativePath),
    size: details.size,
  };

  if (nonEmpty) {
    const contents = await readFile(absolutePath);
    checked.sha256 = createHash("sha256").update(contents).digest("hex");
  }

  checkedFiles.push(checked);
}

async function requireImageSet(basePath) {
  await requireFile(`${basePath}.png`, { nonEmpty: true });
  await requireFile(`${basePath}@2x.png`, { nonEmpty: true });
}

function requiredString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${label} must be a non-empty string`);
  }
}

function majorFromEngine(engine) {
  const match = String(engine ?? "").match(/\d+/);
  return match ? match[0] : "";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const manifest = await readJson(manifestPath);
  const pkg = await readJson(packagePath);

  if (!manifest || !pkg) return await finish({ args, manifest, pkg });

  for (const field of requiredManifestFields) {
    if (!(field in manifest)) {
      errors.push(`Manifest is missing required field: ${field}`);
    }
  }

  if (!Array.isArray(manifest.Actions) || manifest.Actions.length === 0) {
    errors.push("Manifest Actions must contain at least one action");
  }

  requiredString(manifest.UUID, "Manifest UUID");
  requiredString(manifest.Version, "Manifest Version");
  requiredString(manifest.CodePath, "Manifest CodePath");
  requiredString(manifest.Icon, "Manifest Icon");

  if (manifest.SDKVersion !== 2) {
    errors.push(`Manifest SDKVersion must be 2, got ${manifest.SDKVersion}`);
  }

  const manifestNodeVersion = String(manifest.Nodejs?.Version ?? "");
  const packageNodeMajor = majorFromEngine(pkg.engines?.node);
  if (manifestNodeVersion !== packageNodeMajor) {
    errors.push(
      `Manifest Nodejs.Version ${manifestNodeVersion || "<missing>"} does not match package engines.node ${pkg.engines?.node ?? "<missing>"}`
    );
  }

  if (
    typeof manifest.Version !== "string" ||
    (manifest.Version !== pkg.version &&
      !manifest.Version.startsWith(`${pkg.version}.`))
  ) {
    errors.push(
      `Manifest Version ${manifest.Version} must match package version ${pkg.version} or use it as a prefix`
    );
  }

  if (!manifest.Software?.MinimumVersion) {
    errors.push("Manifest Software.MinimumVersion is required");
  }

  const ignorePatterns = await validatePackageIgnore();
  await requireFile(manifest.CodePath, { nonEmpty: true });

  const bundle = await readFile(
    path.join(pluginDir, manifest.CodePath),
    "utf8"
  ).catch(() => "");
  const sourceMapMatch = bundle.match(/sourceMappingURL=(.+)$/m);
  if (sourceMapMatch?.[1]) {
    await requireFile(
      path.join(path.dirname(manifest.CodePath), sourceMapMatch[1]),
      {
        nonEmpty: true,
      }
    );
  }

  await requireImageSet(manifest.Icon);

  const actionIds = new Set();
  for (const [index, action] of (manifest.Actions ?? []).entries()) {
    const label = `Action ${index + 1}`;
    requiredString(action.UUID, `${label} UUID`);
    requiredString(action.Name, `${label} Name`);

    if (action.UUID && actionIds.has(action.UUID)) {
      errors.push(`Duplicate action UUID: ${action.UUID}`);
    }
    actionIds.add(action.UUID);

    if (action.UUID && !action.UUID.startsWith(`${manifest.UUID}.`)) {
      errors.push(
        `${label} UUID must be under ${manifest.UUID}: ${action.UUID}`
      );
    }

    if (action.Icon) {
      await requireImageSet(action.Icon);
    }

    for (const [stateIndex, state] of (action.States ?? []).entries()) {
      if (state.Image) {
        await requireImageSet(state.Image);
      } else {
        errors.push(`${label} state ${stateIndex + 1} is missing Image`);
      }
    }
  }

  await finish({ args, manifest, pkg, ignorePatterns });
}

async function validatePackageIgnore() {
  let contents = "";
  try {
    contents = await readFile(packageIgnorePath, "utf8");
  } catch {
    errors.push("Missing package file: .sdignore");
    return [];
  }

  const patterns = new Set(
    contents
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
  );

  for (const pattern of requiredIgnorePatterns) {
    if (!patterns.has(pattern)) {
      errors.push(`.sdignore must exclude ${pattern}`);
    }
  }

  return [...patterns].sort();
}

async function finish({ args, manifest, pkg, ignorePatterns = [] }) {
  if (errors.length > 0) {
    console.error("Stream Deck package validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  const audit = buildAudit({ manifest, pkg, ignorePatterns });

  if (args.auditOutput) {
    await writeOutput(args.auditOutput, renderAuditMarkdown(audit));
  }

  if (args.jsonOutput) {
    await writeOutput(args.jsonOutput, `${JSON.stringify(audit, null, 2)}\n`);
  }

  console.log("Stream Deck package validation passed.");
}

function normalizePackagePath(file) {
  return file.split(path.sep).join("/");
}

function buildAudit({ manifest, pkg, ignorePatterns }) {
  return {
    generatedAt: new Date().toISOString(),
    validationStatus: "passed",
    packageSource: "ai.flexinfer.streamslate.sdPlugin",
    packageVersion: pkg.version,
    manifest: {
      name: manifest.Name,
      uuid: manifest.UUID,
      version: manifest.Version,
      description: manifest.Description,
      sdkVersion: manifest.SDKVersion,
      minimumSoftwareVersion: manifest.Software?.MinimumVersion ?? "",
      nodeVersion: String(manifest.Nodejs?.Version ?? ""),
      os: manifest.OS ?? [],
    },
    actions: (manifest.Actions ?? []).map((action) => ({
      name: action.Name ?? "",
      uuid: action.UUID ?? "",
      tooltip: action.Tooltip ?? "",
      icon: action.Icon ?? "",
      states: (action.States ?? []).map((state) => ({
        title: state.Title ?? "",
        image: state.Image ?? "",
      })),
    })),
    packageGuard: {
      requiredIgnorePatterns,
      presentIgnorePatterns: ignorePatterns,
    },
    checkedFiles: checkedFiles
      .slice()
      .sort((a, b) => a.path.localeCompare(b.path)),
  };
}

function renderAuditMarkdown(audit) {
  const actions = audit.actions
    .map(
      (action) =>
        `| ${action.name} | \`${action.uuid}\` | ${action.states.length} | ${action.tooltip} |`
    )
    .join("\n");
  const files = audit.checkedFiles
    .map((file) => {
      const hash = file.sha256 ? ` | \`${file.sha256}\`` : " |";
      return `| \`${file.path}\` | ${file.size}${hash} |`;
    })
    .join("\n");
  const ignorePatterns = audit.packageGuard.presentIgnorePatterns
    .map((pattern) => `- \`${pattern}\``)
    .join("\n");

  return `# Stream Deck Package Audit

Generated: ${audit.generatedAt}

## Summary

- Validation status: ${audit.validationStatus}
- Package source: \`${audit.packageSource}\`
- Package version: \`${audit.packageVersion}\`
- Manifest version: \`${audit.manifest.version}\`
- Manifest UUID: \`${audit.manifest.uuid}\`
- SDK version: ${audit.manifest.sdkVersion}
- Minimum Stream Deck version: ${audit.manifest.minimumSoftwareVersion}
- Node.js runtime: ${audit.manifest.nodeVersion}

## Actions

| Name | UUID | States | Tooltip |
| ---- | ---- | ------ | ------- |
${actions}

## Package Guard

Required ignore patterns are present in \`.sdignore\`.

${ignorePatterns}

## Checked Files

| Path | Size (bytes) | SHA-256 |
| ---- | ------------ | ------- |
${files}
`;
}

async function writeOutput(file, contents) {
  const outputPath = path.resolve(process.cwd(), file);
  await writeFile(outputPath, contents, "utf8");
  console.log(`Wrote ${path.relative(process.cwd(), outputPath)}`);
}

void main();
