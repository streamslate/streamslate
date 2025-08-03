#!/usr/bin/env node

/* eslint-env node */

/**
 * Auto-fix TypeScript errors where possible
 * This script attempts to fix common TypeScript errors automatically
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Run TypeScript compiler and capture output
function runTypeScriptCheck() {
  try {
    execSync("npx tsc --noEmit", { encoding: "utf8" });
    return { success: true, output: "" };
  } catch (error) {
    return { success: false, output: error.stdout || error.message };
  }
}

// Parse TypeScript errors from output
function parseTypeScriptErrors(output) {
  const errors = [];
  const lines = output.split("\n");

  for (const line of lines) {
    // Match TypeScript error format: file.ts(line,col): error TS2307: message
    const match = line.match(
      /^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/
    );
    if (match) {
      errors.push({
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        code: match[4],
        message: match[5],
      });
    }
  }

  return errors;
}

// Fix unused variable by prefixing with underscore
function fixUnusedVariable(filePath, variableName, lineNumber) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  if (lineNumber <= lines.length) {
    const line = lines[lineNumber - 1];

    // Handle different declaration patterns
    const patterns = [
      // const/let/var declarations
      new RegExp(`\\b(const|let|var)\\s+${variableName}\\b`, "g"),
      // Function parameters
      new RegExp(`\\b${variableName}\\s*(?=[,)])`, "g"),
      // Destructuring
      new RegExp(`\\b${variableName}\\s*(?=[,}])`, "g"),
      // Import statements
      new RegExp(`\\b${variableName}\\s*(?=[,}]|\\s+from)`, "g"),
    ];

    let fixed = false;
    for (const pattern of patterns) {
      if (pattern.test(line)) {
        lines[lineNumber - 1] = line.replace(pattern, (match) => {
          return match.replace(variableName, `_${variableName}`);
        });
        fixed = true;
        break;
      }
    }

    if (fixed) {
      fs.writeFileSync(filePath, lines.join("\n"));
      return true;
    }
  }

  return false;
}

// Remove unused import
function removeUnusedImport(filePath, importName) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is an import line containing the unused import
    if (line.includes("import") && line.includes(importName)) {
      // Handle named imports: import { a, b, c } from 'module'
      const namedImportRegex = new RegExp(`\\b${importName}\\s*,?\\s*`, "g");
      const newLine = line.replace(namedImportRegex, "");

      // Clean up any remaining commas
      const cleanedLine = newLine
        .replace(/,\s*}/, "}")
        .replace(/{\s*,/, "{")
        .replace(/,\s*,/, ",");

      // If the import is now empty, remove the entire line
      if (cleanedLine.match(/import\s*{\s*}\s*from/)) {
        lines.splice(i, 1);
        i--;
      } else {
        lines[i] = cleanedLine;
      }

      fs.writeFileSync(filePath, lines.join("\n"));
      return true;
    }
  }

  return false;
}

// Main function
async function main() {
  console.log("🔧 Running TypeScript auto-fix...\n");

  const { success, output } = runTypeScriptCheck();

  if (success) {
    console.log("✅ No TypeScript errors found!");
    process.exit(0);
  }

  console.log("Found TypeScript errors. Attempting to fix...\n");

  const errors = parseTypeScriptErrors(output);
  let fixedCount = 0;

  for (const error of errors) {
    // Handle unused variable errors (TS6133)
    if (
      error.code === "TS6133" &&
      error.message.includes("is declared but its value is never read")
    ) {
      const variableMatch = error.message.match(/'(.+?)'/);
      if (variableMatch) {
        const variableName = variableMatch[1];
        console.log(
          `Fixing unused variable '${variableName}' in ${error.file}:${error.line}`
        );

        if (fixUnusedVariable(error.file, variableName, error.line)) {
          fixedCount++;
        }
      }
    }

    // Handle unused imports (TS6192)
    if (
      error.code === "TS6192" &&
      error.message.includes("is defined but never used")
    ) {
      const importMatch = error.message.match(/'(.+?)'/);
      if (importMatch) {
        const importName = importMatch[1];
        console.log(`Removing unused import '${importName}' in ${error.file}`);

        if (removeUnusedImport(error.file, importName)) {
          fixedCount++;
        }
      }
    }
  }

  if (fixedCount > 0) {
    console.log(
      `\n🔧 Fixed ${fixedCount} errors. Re-running TypeScript check...\n`
    );

    // Run TypeScript check again
    const { success: recheckSuccess } = runTypeScriptCheck();

    if (recheckSuccess) {
      console.log("✅ All TypeScript errors fixed!");
      process.exit(0);
    } else {
      console.log("⚠️  Some errors remain. Please fix them manually.");
      process.exit(1);
    }
  } else {
    console.log(
      "⚠️  No auto-fixable errors found. Please fix remaining errors manually."
    );
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
}

module.exports = {
  fixUnusedVariable,
  removeUnusedImport,
  parseTypeScriptErrors,
};
