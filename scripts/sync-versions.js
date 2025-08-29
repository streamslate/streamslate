#!/usr/bin/env node

/**
 * StreamSlate Version Synchronization Script
 *
 * This script ensures that the version in package.json is synchronized with:
 * - src-tauri/Cargo.toml
 * - src-tauri/tauri.conf.json
 *
 * It should be run automatically as part of the npm version lifecycle.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths relative to project root
const PACKAGE_JSON_PATH = path.join(__dirname, "..", "package.json");
const CARGO_TOML_PATH = path.join(__dirname, "..", "src-tauri", "Cargo.toml");
const TAURI_CONF_PATH = path.join(
  __dirname,
  "..",
  "src-tauri",
  "tauri.conf.json"
);

/**
 * Read and parse package.json to get the current version
 */
function getPackageVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf8"));
    return packageJson.version;
  } catch (error) {
    console.error("Error reading package.json:", error);
    process.exit(1);
  }
}

/**
 * Update version in Cargo.toml
 */
function updateCargoToml(version) {
  try {
    let cargoContent = fs.readFileSync(CARGO_TOML_PATH, "utf8");

    // Update version in [package] section
    // Match version = "x.x.x" pattern
    cargoContent = cargoContent.replace(
      /^version\s*=\s*"[^"]+"/m,
      `version = "${version}"`
    );

    fs.writeFileSync(CARGO_TOML_PATH, cargoContent, "utf8");
    console.log(`✅ Updated Cargo.toml to version ${version}`);
  } catch (error) {
    console.error("Error updating Cargo.toml:", error);
    process.exit(1);
  }
}

/**
 * Update version in tauri.conf.json
 */
function updateTauriConf(version) {
  try {
    const tauriConf = JSON.parse(fs.readFileSync(TAURI_CONF_PATH, "utf8"));

    // Update the version field
    if (tauriConf.version) {
      tauriConf.version = version;
    }

    // Also update package.version if it exists
    if (tauriConf.package && tauriConf.package.version) {
      tauriConf.package.version = version;
    }

    // Write back with 2-space indentation
    fs.writeFileSync(
      TAURI_CONF_PATH,
      JSON.stringify(tauriConf, null, 2) + "\n",
      "utf8"
    );

    console.log(`✅ Updated tauri.conf.json to version ${version}`);
  } catch (error) {
    console.error("Error updating tauri.conf.json:", error);
    process.exit(1);
  }
}

/**
 * Main synchronization function
 */
function syncVersions() {
  console.log("🔄 Synchronizing versions across StreamSlate...\n");

  const version = getPackageVersion();
  console.log(`📦 Package.json version: ${version}\n`);

  // Update all version references
  updateCargoToml(version);
  updateTauriConf(version);

  console.log("\n✨ Version synchronization complete!");
  console.log(`   All components updated to v${version}`);
}

// Run the synchronization
syncVersions();
