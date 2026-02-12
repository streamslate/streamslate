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

import { useState, useEffect } from "react";

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

  // Handle ESC key to exit presenter mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && presenterMode) {
        setPresenterMode(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [presenterMode]);

  useEffect(() => {
    localStorage.setItem(TRANSPARENT_BG_KEY, String(transparentBg));
  }, [transparentBg]);

  useEffect(() => {
    localStorage.setItem(BORDERLESS_MODE_KEY, String(borderlessMode));
  }, [borderlessMode]);

  return {
    presenterMode,
    setPresenterMode,
    transparentBg,
    setTransparentBg,
    borderlessMode,
    setBorderlessMode,
  };
};
