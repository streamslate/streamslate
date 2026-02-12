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
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-border-primary bg-surface-primary/95 px-4 py-3 text-text-primary shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </span>
          <div>
            <span className="font-medium">
              StreamSlate {updateInfo.version} is available!
            </span>
            {updateInfo.body && (
              <p className="mt-0.5 line-clamp-1 text-sm text-text-secondary">
                {updateInfo.body}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {error && <span className="text-sm text-red-500">{error}</span>}
          <button
            onClick={handleDismiss}
            className="rounded-md px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            disabled={isInstalling}
          >
            Later
          </button>
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="rounded-md bg-primary px-4 py-1.5 font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isInstalling ? "Installing..." : "Install Update"}
          </button>
        </div>
      </div>
    </div>
  );
}
