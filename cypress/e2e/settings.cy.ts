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
    cy.contains("Dark Theme").should("be.visible");
    cy.contains("Transparent Background").should("be.visible");
    cy.contains("Borderless Window").should("be.visible");
  });

  it("can toggle dark mode", () => {
    // Find dark mode toggle by data-testid
    cy.get('[data-testid="dark-mode-toggle"]').as("darkModeToggle");

    // Toggle dark mode on
    cy.get("@darkModeToggle").check({ force: true });

    // The toggle should now be checked
    cy.get("@darkModeToggle").should("be.checked");
  });

  it("can toggle transparent and borderless modes", () => {
    cy.get('[data-testid="transparent-toggle"]').check({ force: true });
    cy.get("div.h-screen").should("have.class", "bg-transparent");

    cy.get('[data-testid="borderless-toggle"]').check({ force: true });
    cy.get("header").should("not.be.visible");
    cy.get('[data-testid="status-bar"]').should("not.be.visible");
    cy.get('button[title="Exit Borderless"]').should("be.visible");

    cy.get('[data-testid="borderless-toggle"]').uncheck({ force: true });
    cy.get("header").should("be.visible");
    cy.get('[data-testid="status-bar"]').should("be.visible");
  });
});
