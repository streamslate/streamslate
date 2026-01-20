/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

describe("Settings Panel", () => {
  beforeEach(() => {
    cy.visit("/");
    // Navigate to Settings panel
    cy.contains("Settings").click();
  });

  it("displays settings options", () => {
    // Should show main settings categories
    cy.contains("Dark Mode").should("be.visible");
    cy.contains("Transparent").should("be.visible");
    cy.contains("Borderless").should("be.visible");
  });

  it("can toggle dark mode", () => {
    // Find dark mode toggle and click it
    cy.get('input[type="checkbox"]').first().as("darkModeToggle");

    // Toggle dark mode
    cy.get("@darkModeToggle").click();

    // The body/app should reflect the theme change
    // Note: Actual visual verification may need different assertions
    cy.get("@darkModeToggle").should("be.checked");
  });
});
