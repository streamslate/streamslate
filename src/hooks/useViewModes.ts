/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { useState, useEffect, useCallback } from "react";
import { PresenterCommands } from "../lib/tauri/commands";
import { logger } from "../lib/logger";

const TRANSPARENT_BG_KEY = "viewMode.transparentBg";
const BORDERLESS_MODE_KEY = "viewMode.borderlessMode";

const getStoredFlag = (key: string, defaultValue = false): boolean => {
  const value = localStorage.getItem(key);
  if (value === null) {
    return defaultValue;
  }
  return value === "true";
};

export const useViewModes = () => {
  const [presenterMode, setPresenterMode] = useState(false);
  const [transparentBg, setTransparentBg] = useState(() =>
    getStoredFlag(TRANSPARENT_BG_KEY)
  );
  const [borderlessMode, setBorderlessMode] = useState(() =>
    getStoredFlag(BORDERLESS_MODE_KEY)
  );

  /**
   * Toggle presenter mode via Tauri commands.
   * Use this for user-initiated actions (button clicks, keyboard shortcuts).
   * For remote-control events (WebSocket), use setPresenterMode directly
   * since the backend already manages the window state.
   */
  const togglePresenterMode = useCallback(async () => {
    const newState = !presenterMode;
    try {
      if (newState) {
        await PresenterCommands.openPresenterMode();
      } else {
        await PresenterCommands.closePresenterMode();
      }
      setPresenterMode(newState);
    } catch (e) {
      // Fallback for non-Tauri environments (dev server in browser)
      logger.warn(
        "Presenter mode Tauri command failed, toggling local state only:",
        e
      );
      setPresenterMode(newState);
    }
  }, [presenterMode]);

  /**
   * Exit presenter mode via Tauri command.
   * Convenience wrapper for the exit button / ESC key.
   */
  const exitPresenterMode = useCallback(async () => {
    try {
      await PresenterCommands.closePresenterMode();
    } catch (e) {
      logger.warn("Close presenter Tauri command failed:", e);
    }
    setPresenterMode(false);
  }, []);

  // Handle ESC key to exit presenter mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && presenterMode) {
        exitPresenterMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [presenterMode, exitPresenterMode]);

  useEffect(() => {
    localStorage.setItem(TRANSPARENT_BG_KEY, String(transparentBg));
  }, [transparentBg]);

  useEffect(() => {
    localStorage.setItem(BORDERLESS_MODE_KEY, String(borderlessMode));
  }, [borderlessMode]);

  return {
    presenterMode,
    setPresenterMode,
    togglePresenterMode,
    exitPresenterMode,
    transparentBg,
    setTransparentBg,
    borderlessMode,
    setBorderlessMode,
  };
};
