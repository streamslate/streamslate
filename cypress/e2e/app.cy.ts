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

describe("StreamSlate App", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("displays the app title", () => {
    cy.contains("h1", "StreamSlate");
  });

  it("has a header with main controls", () => {
    // Check for header element
    cy.get("header").should("be.visible");

    // Check for open PDF button
    cy.contains("button", "Open PDF").should("be.visible");
  });

  it("has main layout structure", () => {
    // Check for the main app container
    cy.get("div.h-screen").should("exist");

    // Check for header
    cy.get("header").should("be.visible");

    // Check for main content area
    cy.get("main").should("be.visible");
  });
});
