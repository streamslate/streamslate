import { access, readFile, stat } from "node:fs/promises";
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
const requiredIgnorePatterns = [
  "*.map",
  "logs/",
  "*.log",
  "*.streamDeckPlugin",
  "validation-*.md",
  "validation-*.json",
];

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

  if (!nonEmpty) return;

  const details = await stat(absolutePath);
  if (details.size === 0) {
    errors.push(`Package file is empty: ${relativePath}`);
  }
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
  const manifest = await readJson(manifestPath);
  const pkg = await readJson(packagePath);

  if (!manifest || !pkg) return finish();

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

  await validatePackageIgnore();
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

  finish();
}

async function validatePackageIgnore() {
  let contents = "";
  try {
    contents = await readFile(packageIgnorePath, "utf8");
  } catch {
    errors.push("Missing package file: .sdignore");
    return;
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
}

function finish() {
  if (errors.length > 0) {
    console.error("Stream Deck package validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Stream Deck package validation passed.");
}

void main();
