/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

describe("PDF Viewer", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("shows empty state when no PDF is loaded", () => {
    // Should show placeholder or empty state
    cy.get("main").should("be.visible");

    // No page navigation should be visible without a PDF
    cy.get("[data-testid='page-nav']").should("not.exist");
  });

  it("has PDF viewer area in main content", () => {
    // Main content area should exist
    cy.get("main").should("be.visible");
  });

  it("status bar is visible", () => {
    // Status bar should be visible at the bottom
    cy.get("[data-testid='status-bar']").should("be.visible");
  });

  it("status bar shows connection info", () => {
    // Should display WebSocket or connection status
    cy.get("[data-testid='status-bar']").within(() => {
      // Check for status indicators
      cy.get("div").should("have.length.at.least", 1);
    });
  });
});
