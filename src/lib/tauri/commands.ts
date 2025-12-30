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

/**
 * TypeScript wrappers for Tauri commands
 * Provides type-safe interfaces to the Rust backend
 */

import { invoke } from "@tauri-apps/api/tauri";

// Types
export interface PdfInfo {
  path: string;
  title?: string;
  author?: string;
  page_count: number;
  file_size: number;
  created?: string;
  modified?: string;
}

export interface PdfPage {
  page_number: number;
  width: number;
  height: number;
  rotation: number;
}

export interface PresenterConfig {
  always_on_top: boolean;
  transparent_background: boolean;
  borderless: boolean;
  position: WindowPosition;
  size: WindowSize;
}

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface PresenterState {
  is_active: boolean;
  current_page: number;
  total_pages: number;
  zoom_level: number;
}

// PDF Commands
export class PDFCommands {
  /**
   * Open a PDF file and return basic information about it
   */
  static async openPdf(path: string): Promise<PdfInfo> {
    return await invoke<PdfInfo>("open_pdf", { path });
  }

  /**
   * Close the currently open PDF
   */
  static async closePdf(): Promise<void> {
    return await invoke<void>("close_pdf");
  }

  /**
   * Get information about a specific page in the PDF
   */
  static async getPdfPageInfo(pageNumber: number): Promise<PdfPage> {
    return await invoke<PdfPage>("get_pdf_page_info", { pageNumber });
  }

  /**
   * Get the total number of pages in the currently open PDF
   */
  static async getPdfPageCount(): Promise<number> {
    return await invoke<number>("get_pdf_page_count");
  }

  /**
   * Check if a PDF is currently open
   */
  static async isPdfOpen(): Promise<boolean> {
    return await invoke<boolean>("is_pdf_open");
  }
}

// Presenter Commands
export class PresenterCommands {
  /**
   * Open the presenter mode window
   */
  static async openPresenterMode(config?: PresenterConfig): Promise<void> {
    return await invoke<void>("open_presenter_mode", { config });
  }

  /**
   * Close the presenter mode window
   */
  static async closePresenterMode(): Promise<void> {
    return await invoke<void>("close_presenter_mode");
  }

  /**
   * Update presenter mode configuration
   */
  static async updatePresenterConfig(config: PresenterConfig): Promise<void> {
    return await invoke<void>("update_presenter_config", { config });
  }

  /**
   * Get current presenter mode state
   */
  static async getPresenterState(): Promise<PresenterState> {
    return await invoke<PresenterState>("get_presenter_state");
  }

  /**
   * Toggle presenter mode on/off
   */
  static async togglePresenterMode(): Promise<boolean> {
    return await invoke<boolean>("toggle_presenter_mode");
  }

  /**
   * Update the current page in presenter mode
   */
  static async setPresenterPage(page: number): Promise<void> {
    return await invoke<void>("set_presenter_page", { page });
  }
}

// Annotation types for Tauri commands
export interface AnnotationDTO {
  id: string;
  type: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  color: string;
  opacity: number;
  created: string;
  modified: string;
  visible: boolean;
  points?: { x: number; y: number }[];
}

// Annotation Commands
export class AnnotationCommands {
  /**
   * Save annotations to a JSON sidecar file
   */
  static async saveAnnotations(
    annotations: Record<number, AnnotationDTO[]>
  ): Promise<void> {
    return await invoke<void>("save_annotations", { annotations });
  }

  /**
   * Load annotations from the JSON sidecar file
   */
  static async loadAnnotations(): Promise<Record<number, AnnotationDTO[]>> {
    return await invoke<Record<number, AnnotationDTO[]>>("load_annotations");
  }

  /**
   * Get annotations for a specific page
   */
  static async getPageAnnotations(
    pageNumber: number
  ): Promise<AnnotationDTO[]> {
    return await invoke<AnnotationDTO[]>("get_page_annotations", {
      pageNumber,
    });
  }

  /**
   * Clear all annotations for the current PDF
   */
  static async clearAnnotations(): Promise<void> {
    return await invoke<void>("clear_annotations");
  }

  /**
   * Check if annotations exist for a PDF
   */
  static async hasAnnotations(pdfPath: string): Promise<boolean> {
    return await invoke<boolean>("has_annotations", { pdfPath });
  }
}

// Legacy greet command for testing
export async function greet(name: string): Promise<string> {
  return await invoke<string>("greet", { name });
}
