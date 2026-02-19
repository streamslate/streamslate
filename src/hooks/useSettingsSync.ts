import { useCallback, useRef } from "react";

/**
 * Versioned settings bundle for export/import.
 *
 * Intentionally excludes security-sensitive data (OBS passwords, API keys)
 * and ephemeral session state (current page, zoom level).
 */
export interface SettingsBundle {
  version: 1;
  exportedAt: string;
  settings: {
    theme: string | null;
    layout: {
      sidebarOpen: string | null;
      activePanel: string | null;
    };
    viewMode: {
      transparentBg: string | null;
      borderlessMode: string | null;
    };
    annotationProfiles: string | null;
    annotationDocumentProfileMap: string | null;
  };
}

const SETTINGS_KEYS = {
  theme: "theme",
  sidebarOpen: "layout.sidebarOpen",
  activePanel: "layout.activePanel",
  transparentBg: "viewMode.transparentBg",
  borderlessMode: "viewMode.borderlessMode",
  annotationProfiles: "streamslate.annotation-template-profiles.v1",
  annotationDocumentProfileMap:
    "streamslate.annotation-document-profile-map.v1",
} as const;

function collectSettings(): SettingsBundle {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: {
      theme: localStorage.getItem(SETTINGS_KEYS.theme),
      layout: {
        sidebarOpen: localStorage.getItem(SETTINGS_KEYS.sidebarOpen),
        activePanel: localStorage.getItem(SETTINGS_KEYS.activePanel),
      },
      viewMode: {
        transparentBg: localStorage.getItem(SETTINGS_KEYS.transparentBg),
        borderlessMode: localStorage.getItem(SETTINGS_KEYS.borderlessMode),
      },
      annotationProfiles: localStorage.getItem(
        SETTINGS_KEYS.annotationProfiles
      ),
      annotationDocumentProfileMap: localStorage.getItem(
        SETTINGS_KEYS.annotationDocumentProfileMap
      ),
    },
  };
}

function applySettings(bundle: SettingsBundle): void {
  const s = bundle.settings;

  if (s.theme !== null) {
    localStorage.setItem(SETTINGS_KEYS.theme, s.theme);
  }
  if (s.layout.sidebarOpen !== null) {
    localStorage.setItem(SETTINGS_KEYS.sidebarOpen, s.layout.sidebarOpen);
  }
  if (s.layout.activePanel !== null) {
    localStorage.setItem(SETTINGS_KEYS.activePanel, s.layout.activePanel);
  }
  if (s.viewMode.transparentBg !== null) {
    localStorage.setItem(SETTINGS_KEYS.transparentBg, s.viewMode.transparentBg);
  }
  if (s.viewMode.borderlessMode !== null) {
    localStorage.setItem(
      SETTINGS_KEYS.borderlessMode,
      s.viewMode.borderlessMode
    );
  }
  if (s.annotationProfiles !== null) {
    localStorage.setItem(
      SETTINGS_KEYS.annotationProfiles,
      s.annotationProfiles
    );
  }
  if (s.annotationDocumentProfileMap !== null) {
    localStorage.setItem(
      SETTINGS_KEYS.annotationDocumentProfileMap,
      s.annotationDocumentProfileMap
    );
  }
}

function validateBundle(data: unknown): data is SettingsBundle {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (obj.version !== 1) return false;
  if (typeof obj.settings !== "object" || obj.settings === null) return false;
  return true;
}

/**
 * Hook for exporting and importing all user settings as a JSON file.
 *
 * This is the foundation for cloud sync — settings are serialized to a
 * portable JSON format that can be transferred between machines.
 */
export const useSettingsSync = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const exportSettings = useCallback(() => {
    const bundle = collectSettings();
    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `streamslate-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importSettings = useCallback(
    (file: File): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (!validateBundle(data)) {
              resolve({
                success: false,
                error: "Invalid settings file format",
              });
              return;
            }
            applySettings(data);
            resolve({ success: true });
          } catch {
            resolve({ success: false, error: "Failed to parse settings file" });
          }
        };
        reader.onerror = () => {
          resolve({ success: false, error: "Failed to read file" });
        };
        reader.readAsText(file);
      });
    },
    []
  );

  const triggerImport = useCallback(() => {
    if (!fileInputRef.current) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.style.display = "none";
      document.body.appendChild(input);
      fileInputRef.current = input;
    }

    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      const input = fileInputRef.current!;
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve({ success: false, error: "No file selected" });
          return;
        }
        const result = await importSettings(file);
        input.value = "";
        resolve(result);
      };
      input.click();
    });
  }, [importSettings]);

  return { exportSettings, importSettings, triggerImport };
};
