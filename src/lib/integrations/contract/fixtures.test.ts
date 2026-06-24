import { describe, expect, it } from "vitest";
import {
  LocalControlMockClient,
  isLocalControlCapabilitiesPayload,
  isLocalControlCommand,
  isLocalControlErrorPayload,
  isLocalControlEvent,
  isLocalControlStateSnapshot,
  loadedPdfStateFixture,
  localControlCommandFixtures,
  localControlEventFixtures,
  localControlFixtures,
  localControlProtocolVersion,
  localControlSchemas,
} from ".";

describe("local-control V2 contract fixtures", () => {
  it("exports the V2 protocol and loopback transport schema", () => {
    expect(localControlProtocolVersion).toBe("2.0");
    expect(localControlSchemas.transport.name).toBe("websocket_json_loopback");
    expect(localControlSchemas.commands).toContain("NEXT_PAGE");
    expect(localControlSchemas.commands).toContain("CLEAR_ANNOTATIONS");
    expect(localControlSchemas.commands).toContain("GET_CAPABILITIES");
    expect(localControlSchemas.features).toEqual([
      "presenter",
      "annotations",
      "pdf_state",
      "websocket_control",
    ]);
  });

  it("preserves the current wire command shape", () => {
    expect(localControlCommandFixtures.goToPage).toMatchObject({
      protocolVersion: "2.0",
      request_id: "cmd-go-to-page",
      type: "GO_TO_PAGE",
      page: 6,
    });
    expect(isLocalControlCommand(localControlCommandFixtures.goToPage)).toBe(
      true
    );
  });

  it("covers next page, previous page, and go to page fixtures", () => {
    const client = new LocalControlMockClient();

    const next = client.process(localControlCommandFixtures.nextPage);
    expect(next).toMatchObject({
      protocolVersion: "2.0",
      type: "PAGE_CHANGED",
      request_id: "cmd-next-page",
      page: 4,
      total_pages: 12,
    });

    const previous = client.process(localControlCommandFixtures.previousPage);
    expect(previous).toMatchObject({
      type: "PAGE_CHANGED",
      request_id: "cmd-previous-page",
      page: 3,
      total_pages: 12,
    });

    const goToPage = client.process(localControlCommandFixtures.goToPage);
    expect(goToPage).toMatchObject({
      type: "PAGE_CHANGED",
      request_id: "cmd-go-to-page",
      page: 6,
      total_pages: 12,
    });
  });

  it("covers presenter toggle and clear annotations fixtures", () => {
    const client = new LocalControlMockClient();

    const presenter = client.process(
      localControlCommandFixtures.togglePresenter
    );
    expect(presenter).toMatchObject({
      type: "PRESENTER_CHANGED",
      active: true,
    });

    const clearAnnotations = client.process(
      localControlCommandFixtures.clearAnnotations
    );
    expect(clearAnnotations).toMatchObject({
      type: "ANNOTATIONS_CLEARED",
      request_id: "cmd-clear-annotations",
    });
  });

  it("covers get state and ping/pong fixtures", () => {
    const client = new LocalControlMockClient();

    const state = client.process(localControlCommandFixtures.getState);
    expect(state).toMatchObject({
      type: "STATE",
      request_id: "cmd-get-state",
      ...loadedPdfStateFixture,
    });
    expect(isLocalControlStateSnapshot(state)).toBe(true);

    const pong = client.process(localControlCommandFixtures.ping);
    expect(pong).toMatchObject({
      type: "PONG",
      request_id: "cmd-ping",
    });
  });

  it("covers error and capabilities payload fixtures", () => {
    expect(isLocalControlEvent(localControlEventFixtures.error)).toBe(true);
    expect(isLocalControlErrorPayload(localControlEventFixtures.error)).toBe(
      true
    );

    expect(isLocalControlEvent(localControlEventFixtures.capabilities)).toBe(
      true
    );
    expect(
      isLocalControlCapabilitiesPayload(localControlEventFixtures.capabilities)
    ).toBe(true);
    expect(localControlFixtures.capabilities.features).toContain(
      "websocket_control"
    );
    expect(localControlEventFixtures.capabilities.supported_commands).toContain(
      "GET_CAPABILITIES"
    );
  });

  it("lets the mock client process fixture batches without app state imports", () => {
    const client = new LocalControlMockClient();
    const events = client.processAll([
      localControlCommandFixtures.nextPage,
      localControlCommandFixtures.togglePresenter,
      localControlCommandFixtures.getCapabilities,
      localControlCommandFixtures.ping,
    ]);

    expect(events.map((event) => event.type)).toEqual([
      "PAGE_CHANGED",
      "PRESENTER_CHANGED",
      "CAPABILITIES",
      "PONG",
    ]);
    expect(events.every(isLocalControlEvent)).toBe(true);
  });

  it("returns an error payload for invalid page commands", () => {
    const client = new LocalControlMockClient();
    const error = client.process({
      ...localControlCommandFixtures.goToPage,
      request_id: "cmd-go-to-page-invalid",
      page: 99,
    });

    expect(error).toMatchObject({
      type: "ERROR",
      request_id: "cmd-go-to-page-invalid",
      code: "PAGE_OUT_OF_RANGE",
      command: "GO_TO_PAGE",
    });
    expect(isLocalControlErrorPayload(error)).toBe(true);
  });
});
