import { describe, expect, it } from "vitest";
import {
  LocalControlMockClient,
  isLocalControlCapabilitiesPayload,
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

  it("covers next page, previous page, and go to page fixtures", () => {
    const client = new LocalControlMockClient();

    const next = client.process(localControlCommandFixtures.nextPage);
    expect(next).toMatchObject({
      protocolVersion: "2.0",
      type: "event",
      event: "PAGE_CHANGED",
      correlationId: "cmd-next-page",
      payload: { page: 4, total_pages: 12 },
    });

    const previous = client.process(localControlCommandFixtures.previousPage);
    expect(previous).toMatchObject({
      event: "PAGE_CHANGED",
      correlationId: "cmd-previous-page",
      payload: { page: 3, total_pages: 12 },
    });

    const goToPage = client.process(localControlCommandFixtures.goToPage);
    expect(goToPage).toMatchObject({
      event: "PAGE_CHANGED",
      correlationId: "cmd-go-to-page",
      payload: { page: 6, total_pages: 12 },
    });
  });

  it("covers presenter toggle and clear annotations fixtures", () => {
    const client = new LocalControlMockClient();

    const presenter = client.process(
      localControlCommandFixtures.togglePresenter
    );
    expect(presenter).toMatchObject({
      event: "PRESENTER_CHANGED",
      payload: { presenter_active: true },
    });

    const clearAnnotations = client.process(
      localControlCommandFixtures.clearAnnotations
    );
    expect(clearAnnotations).toMatchObject({
      event: "ANNOTATIONS_CLEARED",
      correlationId: "cmd-clear-annotations",
      payload: { cleared: true },
    });
  });

  it("covers get state and ping/pong fixtures", () => {
    const client = new LocalControlMockClient();

    const state = client.process(localControlCommandFixtures.getState);
    expect(state).toMatchObject({
      event: "STATE",
      correlationId: "cmd-get-state",
      payload: loadedPdfStateFixture,
    });
    expect(isLocalControlStateSnapshot(state.payload)).toBe(true);

    const pong = client.process(localControlCommandFixtures.ping);
    expect(pong).toMatchObject({
      event: "PONG",
      correlationId: "cmd-ping",
      payload: { nonce: "fixture-nonce", ok: true },
    });
  });

  it("covers error and capabilities payload fixtures", () => {
    expect(isLocalControlEvent(localControlEventFixtures.error)).toBe(true);
    expect(
      isLocalControlErrorPayload(localControlEventFixtures.error.payload)
    ).toBe(true);

    expect(isLocalControlEvent(localControlEventFixtures.capabilities)).toBe(
      true
    );
    expect(
      isLocalControlCapabilitiesPayload(
        localControlEventFixtures.capabilities.payload
      )
    ).toBe(true);
    expect(localControlFixtures.capabilities.features).toContain(
      "websocket_control"
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

    expect(events.map((event) => event.event)).toEqual([
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
      id: "cmd-go-to-page-invalid",
      payload: { page: 99 },
    });

    expect(error).toMatchObject({
      event: "ERROR",
      correlationId: "cmd-go-to-page-invalid",
      payload: {
        code: "PAGE_OUT_OF_RANGE",
        command: "GO_TO_PAGE",
      },
    });
    expect(isLocalControlErrorPayload(error.payload)).toBe(true);
  });
});
