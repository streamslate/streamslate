import { describe, it, expect } from "vitest";
import { AnnotationType } from "../../types/pdf.types";
import {
  sanitizeConfig,
  sanitizePreset,
  sanitizeProfile,
  isAnnotationType,
  makeUniqueProfileName,
  pickPresetForProfile,
  parseImportProfiles,
  exportProfiles,
  TOOLS,
  BUILT_IN_PRESETS,
  BUILT_IN_PROFILE,
  USE_CASE_TEMPLATES,
  type TemplateProfile,
} from "./presets";

describe("isAnnotationType", () => {
  it("returns true for valid AnnotationType values", () => {
    expect(isAnnotationType("highlight")).toBe(true);
    expect(isAnnotationType("rectangle")).toBe(true);
    expect(isAnnotationType("free_draw")).toBe(true);
  });

  it("returns false for invalid values", () => {
    expect(isAnnotationType("invalid")).toBe(false);
    expect(isAnnotationType(42)).toBe(false);
    expect(isAnnotationType(null)).toBe(false);
  });
});

describe("sanitizeConfig", () => {
  it("returns empty object for null/undefined", () => {
    expect(sanitizeConfig(null)).toEqual({});
    expect(sanitizeConfig(undefined)).toEqual({});
  });

  it("normalizes valid properties", () => {
    const result = sanitizeConfig({
      color: "#ff0000",
      opacity: 0.5,
      strokeWidth: 3,
      fontSize: 16,
    });
    expect(result.color).toBe("#ff0000");
    expect(result.opacity).toBe(0.5);
    expect(result.strokeWidth).toBe(3);
    expect(result.fontSize).toBe(16);
  });

  it("clamps opacity to [0.05, 1]", () => {
    expect(sanitizeConfig({ opacity: 0 })?.opacity).toBe(0.05);
    expect(sanitizeConfig({ opacity: 2 })?.opacity).toBe(1);
  });

  it("clamps strokeWidth to [1, 12]", () => {
    expect(sanitizeConfig({ strokeWidth: 0 })?.strokeWidth).toBe(1);
    expect(sanitizeConfig({ strokeWidth: 20 })?.strokeWidth).toBe(12);
  });

  it("clamps fontSize to [8, 96]", () => {
    expect(sanitizeConfig({ fontSize: 2 })?.fontSize).toBe(8);
    expect(sanitizeConfig({ fontSize: 200 })?.fontSize).toBe(96);
  });

  it("ignores NaN/Infinity for numeric fields", () => {
    const result = sanitizeConfig({
      opacity: NaN,
      strokeWidth: Infinity,
      fontSize: -Infinity,
    });
    expect(result.opacity).toBeUndefined();
    expect(result.strokeWidth).toBeUndefined();
    expect(result.fontSize).toBeUndefined();
  });
});

describe("sanitizePreset", () => {
  it("returns null for invalid input", () => {
    expect(sanitizePreset(null)).toBe(null);
    expect(sanitizePreset({})).toBe(null);
    expect(sanitizePreset({ tool: "invalid", name: "test" })).toBe(null);
    expect(sanitizePreset({ tool: "highlight", name: "" })).toBe(null);
  });

  it("returns valid preset for valid input", () => {
    const result = sanitizePreset({
      id: "test-1",
      name: "My Preset",
      tool: "highlight",
      config: { color: "#ff0000", opacity: 0.5 },
    });
    expect(result).not.toBeNull();
    expect(result!.id).toBe("test-1");
    expect(result!.name).toBe("My Preset");
    expect(result!.tool).toBe(AnnotationType.HIGHLIGHT);
  });

  it("generates id if missing", () => {
    const result = sanitizePreset({
      name: "Test",
      tool: "rectangle",
      config: {},
    });
    expect(result).not.toBeNull();
    expect(result!.id).toBeTruthy();
  });

  it("truncates name to 32 characters", () => {
    const result = sanitizePreset({
      name: "A".repeat(50),
      tool: "highlight",
      config: {},
    });
    expect(result!.name.length).toBeLessThanOrEqual(32);
  });
});

describe("sanitizeProfile", () => {
  it("returns null for invalid input", () => {
    expect(sanitizeProfile(null)).toBe(null);
    expect(sanitizeProfile({ name: "" })).toBe(null);
  });

  it("returns valid profile with sanitized presets", () => {
    const result = sanitizeProfile({
      name: "Test Profile",
      presets: [
        { name: "P1", tool: "highlight", config: {} },
        { name: "", tool: "highlight", config: {} }, // invalid - filtered out
      ],
    });
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Test Profile");
    expect(result!.presets.length).toBe(1);
    expect(result!.builtIn).toBe(false);
  });
});

describe("makeUniqueProfileName", () => {
  it("returns candidate if not taken", () => {
    expect(makeUniqueProfileName("New Pack", ["Existing"])).toBe("New Pack");
  });

  it("appends suffix if name exists", () => {
    expect(makeUniqueProfileName("Pack", ["Pack", "Pack 2"])).toBe("Pack 3");
  });

  it("is case-insensitive", () => {
    expect(makeUniqueProfileName("pack", ["Pack"])).toBe("pack 2");
  });

  it("uses default name for empty input", () => {
    expect(makeUniqueProfileName("", [])).toBe("Template Pack");
  });
});

describe("pickPresetForProfile", () => {
  it("returns first preset when no active tool", () => {
    const preset = pickPresetForProfile(BUILT_IN_PROFILE);
    expect(preset).toBe(BUILT_IN_PRESETS[0]);
  });

  it("returns matching tool preset", () => {
    const preset = pickPresetForProfile(BUILT_IN_PROFILE, AnnotationType.ARROW);
    expect(preset!.tool).toBe(AnnotationType.ARROW);
  });

  it("falls back to first preset if no tool match", () => {
    const preset = pickPresetForProfile(
      BUILT_IN_PROFILE,
      AnnotationType.CIRCLE
    );
    expect(preset).toBe(BUILT_IN_PRESETS[0]);
  });

  it("returns null for empty profile", () => {
    const empty: TemplateProfile = {
      ...BUILT_IN_PROFILE,
      presets: [],
    };
    expect(pickPresetForProfile(empty)).toBe(null);
  });
});

describe("parseImportProfiles", () => {
  it("parses array of profiles", () => {
    const json = JSON.stringify([{ name: "Imported", presets: [] }]);
    const result = parseImportProfiles(json);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe("Imported");
  });

  it("parses export wrapper format", () => {
    const json = JSON.stringify({
      version: 1,
      profiles: [{ name: "Wrapped", presets: [] }],
    });
    const result = parseImportProfiles(json);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe("Wrapped");
  });

  it("parses single profile object", () => {
    const json = JSON.stringify({ name: "Single", presets: [] });
    const result = parseImportProfiles(json);
    expect(result.length).toBe(1);
  });

  it("filters invalid profiles", () => {
    const json = JSON.stringify([
      { name: "Valid", presets: [] },
      { name: "", presets: [] },
    ]);
    const result = parseImportProfiles(json);
    expect(result.length).toBe(1);
  });
});

describe("exportProfiles", () => {
  it("wraps profiles in export envelope", () => {
    const profiles: TemplateProfile[] = [
      {
        id: "test",
        name: "Test",
        presets: [],
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
        builtIn: true,
      },
    ];
    const result = exportProfiles(profiles);
    expect(result.version).toBe(1);
    expect(result.exportedAt).toBeTruthy();
    expect(result.profiles[0].builtIn).toBe(false); // always false on export
  });
});

describe("constants", () => {
  it("TOOLS has 6 tools", () => {
    expect(TOOLS.length).toBe(6);
  });

  it("BUILT_IN_PRESETS has 4 presets", () => {
    expect(BUILT_IN_PRESETS.length).toBe(4);
  });

  it("USE_CASE_TEMPLATES has 4 templates", () => {
    expect(USE_CASE_TEMPLATES.length).toBe(4);
  });

  it("BUILT_IN_PROFILE is marked builtIn", () => {
    expect(BUILT_IN_PROFILE.builtIn).toBe(true);
  });
});
