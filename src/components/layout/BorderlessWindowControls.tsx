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

interface BorderlessWindowControlsProps {
  transparentBg: boolean;
}

export const BorderlessWindowControls: React.FC<
  BorderlessWindowControlsProps
> = ({ transparentBg }) => {
  return (
    <div
      className={`flex items-center justify-between ${
        transparentBg
          ? "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
          : "bg-white dark:bg-gray-800"
      } px-3 py-2 border-b border-gray-200 dark:border-gray-700 animate-fade-in`}
    >
      <div className="flex items-center space-x-2">
        <div
          className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600 cursor-pointer transition-colors"
          title="Close"
          onClick={() => window.close()}
        ></div>
        <div
          className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-600 cursor-pointer transition-colors"
          title="Minimize"
        ></div>
        <div
          className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-600 cursor-pointer transition-colors"
          title="Maximize"
        ></div>
      </div>
      <div className="flex-1 text-center text-sm font-medium text-[rgb(var(--color-primary))]">
        StreamSlate
      </div>
    </div>
  );
};
