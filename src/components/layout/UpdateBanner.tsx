/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * Update notification banner component using Tauri's built-in updater.
 */

import { useEffect, useState } from "react";
import {
  checkUpdate,
  installUpdate,
  onUpdaterEvent,
} from "@tauri-apps/api/updater";
import { relaunch } from "@tauri-apps/api/process";

interface UpdateInfo {
  version: string;
  date?: string;
  body?: string;
}

export function UpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for updates on mount
    const checkForUpdates = async () => {
      try {
        const { shouldUpdate, manifest } = await checkUpdate();
        if (shouldUpdate && manifest) {
          setUpdateAvailable(true);
          setUpdateInfo({
            version: manifest.version,
            date: manifest.date,
            body: manifest.body,
          });
        }
      } catch (err) {
        // Silently fail - updater may not be configured in dev mode
        console.debug("Update check failed:", err);
      }
    };

    checkForUpdates();

    // Listen for updater events
    const unlisten = onUpdaterEvent(({ error, status }) => {
      if (error) {
        setError(error);
        setIsInstalling(false);
      }
      console.debug("Updater status:", status);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    setError(null);
    try {
      await installUpdate();
      // Restart the app to apply the update
      await relaunch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
  };

  if (!updateAvailable || !updateInfo) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-lg">🎉</span>
          <div>
            <span className="font-medium">
              StreamSlate {updateInfo.version} is available!
            </span>
            {updateInfo.body && (
              <p className="text-sm text-white/80 mt-0.5 line-clamp-1">
                {updateInfo.body}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {error && <span className="text-sm text-red-200">{error}</span>}
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-sm text-white/80 hover:text-white transition-colors"
            disabled={isInstalling}
          >
            Later
          </button>
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="px-4 py-1.5 bg-white text-indigo-600 font-medium rounded-md hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isInstalling ? "Installing..." : "Install Update"}
          </button>
        </div>
      </div>
    </div>
  );
}
