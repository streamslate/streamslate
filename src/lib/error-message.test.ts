import { describe, expect, it } from "vitest";
import { getErrorMessage } from "./error-message";

describe("getErrorMessage", () => {
  it("preserves serialized Tauri error strings", () => {
    expect(
      getErrorMessage("I/O error: Operation timed out", "Failed to load PDF")
    ).toBe("I/O error: Operation timed out");
  });

  it("uses Error messages and falls back for unknown values", () => {
    expect(getErrorMessage(new Error("parser failed"), "fallback")).toBe(
      "parser failed"
    );
    expect(getErrorMessage({ code: "UNKNOWN" }, "fallback")).toBe("fallback");
  });
});
