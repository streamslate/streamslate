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

import React from "react";

interface StatusBarProps {
  transparentBg: boolean;
  presenterMode: boolean;
  borderlessMode: boolean;
  websocketState: { connected: boolean };
}

export const StatusBar: React.FC<StatusBarProps> = ({
  transparentBg,
  presenterMode,
  borderlessMode,
  websocketState,
}) => {
  return (
    <div
      className={`${
        transparentBg
          ? "bg-[rgb(var(--color-surface-primary))]/90 backdrop-blur-sm"
          : "bg-[rgb(var(--color-surface-primary))]"
      } border-t border-[rgb(var(--color-border-primary))] px-6 py-2 flex items-center justify-between text-xs text-[rgb(var(--color-text-tertiary))] ${
        presenterMode || borderlessMode ? "hidden" : ""
      }`}
    >
      <div className="flex items-center space-x-6">
        <span className="flex items-center space-x-2 px-3 py-1 bg-[rgb(var(--color-bg-tertiary))] rounded-full">
          <div
            className={`w-2 h-2 rounded-full ${
              websocketState.connected
                ? "bg-green-500"
                : "bg-red-500 animate-pulse"
            }`}
          ></div>
          <span>
            {websocketState.connected
              ? "WebSocket Connected"
              : "WebSocket Disconnected"}
          </span>
        </span>
        <span>Ready</span>
      </div>
      <div className="flex items-center space-x-6">
        {presenterMode && (
          <span className="flex items-center space-x-2 text-green-600 dark:text-green-400 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Presenter Mode Active</span>
          </span>
        )}
        <span>StreamSlate v0.0.1</span>
      </div>
    </div>
  );
};
