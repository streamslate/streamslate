/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

describe("Sidebar Functionality", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("sidebar is visible by default", () => {
    // Sidebar should be open on initial load
    cy.get("[data-testid='sidebar']").should("be.visible");
  });

  it("sidebar can be toggled via header button", () => {
    // Find and click the sidebar toggle button
    cy.get("[data-testid='toggle-sidebar']").click();

    // Sidebar collapses to w-0 with overflow-hidden (CSS transition)
    cy.get("[data-testid='sidebar']").should("have.class", "w-0");

    // Toggle again to show
    cy.get("[data-testid='toggle-sidebar']").click();
    cy.get("[data-testid='sidebar']").should("have.class", "w-72");
  });

  it("has navigation tabs", () => {
    // Check for Files, Annotations, and Settings tabs
    cy.contains("Files").should("be.visible");
    cy.contains("Annotations").should("be.visible");
    cy.contains("Settings").should("be.visible");
  });

  it("can switch between panels", () => {
    // Click on Settings tab
    cy.contains("Settings").click();

    // Settings panel content should be visible
    cy.contains("Dark Theme").should("be.visible");
  });
});
