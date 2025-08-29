#!/usr/bin/env node

/*
 GPL-3.0-or-later Stub
 StreamSlate is dual-licensed (GPL-3.0 or commercial). This file is provided under the GPL-3.0-or-later license unless a separate commercial agreement applies.
*/

// Normalize semver for Windows MSI (WiX) builds.
// WiX requires numeric-only optional pre-release mapped to the 4th version field
// and not greater than 65535. Example: 0.0.2-beta.2 -> 0.0.2-2

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PKG_PATH = path.join(__dirname, "..", "package.json");

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function normalize(version) {
  // Capture: major.minor.patch -prerelease?
  const m = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
  if (!m) return version;
  const [, maj, min, pat, pre = ""] = m;

  if (!pre) return version; // already plain x.y.z

  // Try to extract the last numeric token from prerelease (e.g., beta.3 -> 3)
  const tokens = pre.split(/[.-]/).filter(Boolean);
  let num = 0;
  for (let i = tokens.length - 1; i >= 0; i--) {
    const v = Number(tokens[i]);
    if (Number.isInteger(v)) {
      num = v;
      break;
    }
  }

  // Clamp to WiX range
  num = clamp(num, 0, 65535);

  return `${maj}.${min}.${pat}-${num}`;
}

function main() {
  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, "utf8"));
  const current = pkg.version;
  const normalized = normalize(current);

  if (current === normalized) {
    console.log(`Windows MSI version already normalized: ${current}`);
    return;
  }

  pkg.version = normalized;
  fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + "\n", "utf8");
  console.log(`Normalized Windows MSI version: ${current} -> ${normalized}`);
}

main();
