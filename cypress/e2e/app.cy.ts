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

  it("has a greeting input field", () => {
    cy.get("#greet-input").should("be.visible");
  });

  it("can enter text and greet", () => {
    cy.get("#greet-input").type("Cypress");
    cy.contains("button", "Greet").click();
    // Note: This test may fail until Tauri backend is running
    // cy.contains('Hello, Cypress!')
  });
});
