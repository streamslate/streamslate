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

import { vi } from "vitest";

export const mockTauriInvoke = vi.fn();
export const mockTauriDialog = {
  open: vi.fn(),
  save: vi.fn(),
};

export interface MockPdfInfo {
  path: string;
  title: string | null;
  author: string | null;
  page_count: number;
  file_size: number;
  created: string | null;
  modified: string | null;
}

export const createMockPdfInfo = (
  overrides: Partial<MockPdfInfo> = {}
): MockPdfInfo => ({
  path: "/test/document.pdf",
  title: "Test Document",
  author: "Test Author",
  page_count: 10,
  file_size: 1024000,
  created: null,
  modified: null,
  ...overrides,
});

export const setupTauriMocks = () => {
  vi.mock("@tauri-apps/api/tauri", () => ({
    invoke: mockTauriInvoke,
    convertFileSrc: vi.fn(
      (path: string) => `asset://localhost/${encodeURIComponent(path)}`
    ),
  }));

  vi.mock("@tauri-apps/api/dialog", () => mockTauriDialog);
};

// Mock successful PDF open
export const mockSuccessfulPdfOpen = (pdfInfo = createMockPdfInfo()) => {
  mockTauriInvoke.mockImplementation(
    (cmd: string, _args?: Record<string, unknown>) => {
      switch (cmd) {
        case "open_pdf":
          return Promise.resolve(pdfInfo);
        case "close_pdf":
          return Promise.resolve();
        case "is_pdf_open":
          return Promise.resolve(true);
        case "get_pdf_page_count":
          return Promise.resolve(pdfInfo.page_count);
        case "get_pdf_page_info":
          return Promise.resolve({
            page_number: 1,
            width: 612,
            height: 792,
            rotation: 0,
          });
        default:
          return Promise.reject(new Error(`Unknown command: ${cmd}`));
      }
    }
  );
};

// Mock failed PDF open
export const mockFailedPdfOpen = (error = "Failed to open PDF") => {
  mockTauriInvoke.mockImplementation((cmd: string) => {
    if (cmd === "open_pdf") {
      return Promise.reject(new Error(error));
    }
    return Promise.resolve(null);
  });
};

// Reset all mocks
export const resetTauriMocks = () => {
  mockTauriInvoke.mockReset();
  mockTauriDialog.open.mockReset();
  mockTauriDialog.save.mockReset();
};
