import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  IntegrationMessageType,
  IntegrationSource,
} from "../../types/integration.types";
import type { IntegrationEvent } from "../../types/integration.types";
import { toRecord, readNumber, readBoolean, readString } from "./payload";
import { HANDLER_MAP, getStatusMessage } from "./handlers";
import type { EventActions, EventDocument } from "./handlers";
import { processUnhandledEvents } from "./dispatcher";
import {
  WS_MESSAGE_MAP,
  WS_MESSAGE_TYPES,
  registerWebSocketHandlers,
} from "./message-map";

// ── Helpers ────────────────────────────────────────────────────────────

function makeEvent(
  overrides: Partial<IntegrationEvent> = {}
): IntegrationEvent {
  return {
    id: `evt-${Math.random().toString(16).slice(2)}`,
    type: IntegrationMessageType.PAGE_CHANGED,
    source: IntegrationSource.STREAMSLATE,
    timestamp: new Date(),
    data: {},
    handled: false,
    ...overrides,
  };
}

function makeActions(overrides: Partial<EventActions> = {}): EventActions {
  return {
    setCurrentPage: vi.fn(),
    setZoom: vi.fn(),
    setPresenterMode: vi.fn(),
    setDocument: vi.fn(),
    setPageAnnotations: vi.fn(),
    clearAnnotations: vi.fn(),
    getCurrentDocument: () => null,
    ...overrides,
  };
}

// ── payload.ts ─────────────────────────────────────────────────────────

describe("payload helpers", () => {
  describe("toRecord", () => {
    it("returns null for non-objects", () => {
      expect(toRecord(null)).toBe(null);
      expect(toRecord(undefined)).toBe(null);
      expect(toRecord(42)).toBe(null);
      expect(toRecord("str")).toBe(null);
    });

    it("returns record for objects", () => {
      expect(toRecord({ a: 1 })).toEqual({ a: 1 });
    });
  });

  describe("readNumber", () => {
    it("returns null for null payload", () => {
      expect(readNumber(null, ["x"])).toBe(null);
    });

    it("reads first matching key", () => {
      expect(readNumber({ a: "x", b: 42 }, ["a", "b"])).toBe(42);
    });

    it("rejects NaN / Infinity", () => {
      expect(readNumber({ a: NaN }, ["a"])).toBe(null);
      expect(readNumber({ a: Infinity }, ["a"])).toBe(null);
    });
  });

  describe("readBoolean", () => {
    it("returns null for null payload", () => {
      expect(readBoolean(null, ["x"])).toBe(null);
    });

    it("reads boolean value", () => {
      expect(readBoolean({ active: true }, ["active"])).toBe(true);
      expect(readBoolean({ active: false }, ["active"])).toBe(false);
    });

    it("skips non-boolean values", () => {
      expect(readBoolean({ active: 1 }, ["active"])).toBe(null);
    });
  });

  describe("readString", () => {
    it("returns null for null payload", () => {
      expect(readString(null, ["x"])).toBe(null);
    });

    it("reads non-empty string", () => {
      expect(readString({ name: "hello" }, ["name"])).toBe("hello");
    });

    it("rejects empty string", () => {
      expect(readString({ name: "" }, ["name"])).toBe(null);
    });
  });
});

// ── handlers.ts (HANDLER_MAP) ──────────────────────────────────────────

describe("event handlers", () => {
  let actions: ReturnType<typeof makeActions>;

  beforeEach(() => {
    actions = makeActions();
  });

  it("PAGE_CHANGED calls setCurrentPage", () => {
    const handler = HANDLER_MAP.get(IntegrationMessageType.PAGE_CHANGED)!;
    handler(makeEvent({ data: { page: 5 } }), actions);
    expect(actions.setCurrentPage).toHaveBeenCalledWith(5);
  });

  it("PAGE_CHANGED ignores page < 1", () => {
    const handler = HANDLER_MAP.get(IntegrationMessageType.PAGE_CHANGED)!;
    handler(makeEvent({ data: { page: 0 } }), actions);
    expect(actions.setCurrentPage).not.toHaveBeenCalled();
  });

  it("ZOOM_CHANGED calls setCurrentPage and setZoom", () => {
    const handler = HANDLER_MAP.get(IntegrationMessageType.ZOOM_CHANGED)!;
    handler(makeEvent({ data: { page: 3, zoom: 1.5 } }), actions);
    expect(actions.setCurrentPage).toHaveBeenCalledWith(3);
    expect(actions.setZoom).toHaveBeenCalledWith(1.5);
  });

  it("ZOOM_CHANGED ignores invalid zoom", () => {
    const handler = HANDLER_MAP.get(IntegrationMessageType.ZOOM_CHANGED)!;
    handler(makeEvent({ data: { zoom: -1 } }), actions);
    expect(actions.setZoom).not.toHaveBeenCalled();
  });

  it("PRESENTER_MODE_TOGGLED calls setPresenterMode", () => {
    const handler = HANDLER_MAP.get(
      IntegrationMessageType.PRESENTER_MODE_TOGGLED
    )!;
    handler(makeEvent({ data: { active: true } }), actions);
    expect(actions.setPresenterMode).toHaveBeenCalledWith(true);
  });

  it("PRESENTER_MODE_TOGGLED reads presenter_active fallback key", () => {
    const handler = HANDLER_MAP.get(
      IntegrationMessageType.PRESENTER_MODE_TOGGLED
    )!;
    handler(makeEvent({ data: { presenter_active: false } }), actions);
    expect(actions.setPresenterMode).toHaveBeenCalledWith(false);
  });

  it("CONNECTION_STATUS syncs page, zoom, presenter, and document", () => {
    const handler = HANDLER_MAP.get(IntegrationMessageType.CONNECTION_STATUS)!;
    handler(
      makeEvent({
        data: {
          page: 2,
          zoom: 1.25,
          active: true,
          pdf_loaded: true,
          pdf_path: "/test.pdf",
          total_pages: 10,
        },
      }),
      actions
    );
    expect(actions.setCurrentPage).toHaveBeenCalledWith(2);
    expect(actions.setZoom).toHaveBeenCalledWith(1.25);
    expect(actions.setPresenterMode).toHaveBeenCalledWith(true);
    expect(actions.setDocument).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/test.pdf", pageCount: 10 })
    );
  });

  it("CONNECTION_STATUS skips document when not loaded", () => {
    const handler = HANDLER_MAP.get(IntegrationMessageType.CONNECTION_STATUS)!;
    handler(makeEvent({ data: { pdf_loaded: false } }), actions);
    expect(actions.setDocument).not.toHaveBeenCalled();
  });

  it("CONNECTION_STATUS skips document when path matches current", () => {
    const existing: EventDocument = {
      id: "existing",
      path: "/test.pdf",
      pageCount: 10,
      fileSize: 0,
      isLoaded: true,
    };
    actions = makeActions({ getCurrentDocument: () => existing });
    const handler = HANDLER_MAP.get(IntegrationMessageType.CONNECTION_STATUS)!;
    handler(
      makeEvent({
        data: {
          pdf_loaded: true,
          pdf_path: "/test.pdf",
          total_pages: 10,
        },
      }),
      actions
    );
    expect(actions.setDocument).not.toHaveBeenCalled();
  });

  it("PDF_OPENED sets document and resets page", () => {
    const handler = HANDLER_MAP.get(IntegrationMessageType.PDF_OPENED)!;
    handler(makeEvent({ data: { path: "/new.pdf", page_count: 5 } }), actions);
    expect(actions.setDocument).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/new.pdf", pageCount: 5 })
    );
    expect(actions.setCurrentPage).toHaveBeenCalledWith(1);
  });

  it("PDF_OPENED ignores missing path", () => {
    const handler = HANDLER_MAP.get(IntegrationMessageType.PDF_OPENED)!;
    handler(makeEvent({ data: { page_count: 5 } }), actions);
    expect(actions.setDocument).not.toHaveBeenCalled();
  });

  it("PDF_CLOSED clears document and annotations", () => {
    const handler = HANDLER_MAP.get(IntegrationMessageType.PDF_CLOSED)!;
    handler(makeEvent(), actions);
    expect(actions.setDocument).toHaveBeenCalledWith(null);
    expect(actions.clearAnnotations).toHaveBeenCalled();
    expect(actions.setCurrentPage).toHaveBeenCalledWith(1);
  });

  it("ANNOTATIONS_UPDATED parses and sets page annotations", () => {
    const handler = HANDLER_MAP.get(
      IntegrationMessageType.ANNOTATIONS_UPDATED
    )!;
    handler(
      makeEvent({
        data: {
          annotations: {
            "1": [
              {
                id: "a1",
                type: "highlight",
                pageNumber: 1,
                x: 0,
                y: 0,
                width: 100,
                height: 50,
                content: "",
                color: "#ff0",
                opacity: 1,
                created: "2026-01-01T00:00:00.000Z",
                modified: "2026-01-01T00:00:00.000Z",
                visible: true,
              },
            ],
          },
        },
      }),
      actions
    );
    expect(actions.setPageAnnotations).toHaveBeenCalledWith(
      1,
      expect.arrayContaining([expect.objectContaining({ id: "a1" })])
    );
  });

  it("ANNOTATIONS_UPDATED skips invalid page keys", () => {
    const handler = HANDLER_MAP.get(
      IntegrationMessageType.ANNOTATIONS_UPDATED
    )!;
    handler(makeEvent({ data: { annotations: { abc: [] } } }), actions);
    expect(actions.setPageAnnotations).not.toHaveBeenCalled();
  });

  it("ANNOTATIONS_CLEARED clears annotations", () => {
    const handler = HANDLER_MAP.get(
      IntegrationMessageType.ANNOTATIONS_CLEARED
    )!;
    handler(makeEvent(), actions);
    expect(actions.clearAnnotations).toHaveBeenCalled();
  });
});

// ── dispatcher.ts ──────────────────────────────────────────────────────

describe("processUnhandledEvents", () => {
  it("dispatches unhandled events and marks them handled", () => {
    const actions = makeActions();
    const markHandled = vi.fn();
    const events = [
      makeEvent({ id: "e1", data: { page: 3 } }),
      makeEvent({
        id: "e2",
        type: IntegrationMessageType.PDF_CLOSED,
      }),
    ];

    processUnhandledEvents(events, actions, markHandled);

    expect(actions.setCurrentPage).toHaveBeenCalledWith(3);
    expect(actions.setDocument).toHaveBeenCalledWith(null);
    expect(markHandled).toHaveBeenCalledWith("e1");
    expect(markHandled).toHaveBeenCalledWith("e2");
  });

  it("skips already handled events", () => {
    const actions = makeActions();
    const markHandled = vi.fn();
    const events = [makeEvent({ id: "e1", handled: true, data: { page: 3 } })];

    processUnhandledEvents(events, actions, markHandled);

    expect(actions.setCurrentPage).not.toHaveBeenCalled();
    expect(markHandled).not.toHaveBeenCalled();
  });

  it("marks events with no registered handler as handled", () => {
    const actions = makeActions();
    const markHandled = vi.fn();
    const events = [makeEvent({ id: "e1", type: IntegrationMessageType.PONG })];

    processUnhandledEvents(events, actions, markHandled);

    expect(markHandled).toHaveBeenCalledWith("e1");
  });
});

// ── getStatusMessage ───────────────────────────────────────────────────

describe("getStatusMessage", () => {
  it("returns 'Ready' for empty events", () => {
    expect(getStatusMessage([])).toBe("Ready");
  });

  it("returns page message for PAGE_CHANGED", () => {
    const events = [makeEvent({ data: { page: 7 } })];
    expect(getStatusMessage(events)).toBe("Remote page 7");
  });

  it("returns zoom message for ZOOM_CHANGED", () => {
    const events = [
      makeEvent({
        type: IntegrationMessageType.ZOOM_CHANGED,
        data: { zoom: 1.5 },
      }),
    ];
    expect(getStatusMessage(events)).toBe("Remote zoom 150%");
  });

  it("returns presenter message for PRESENTER_MODE_TOGGLED", () => {
    const events = [
      makeEvent({
        type: IntegrationMessageType.PRESENTER_MODE_TOGGLED,
        data: { active: true },
      }),
    ];
    expect(getStatusMessage(events)).toBe("Presenter mode enabled remotely");
  });

  it("returns message for ANNOTATIONS_UPDATED", () => {
    const events = [
      makeEvent({ type: IntegrationMessageType.ANNOTATIONS_UPDATED }),
    ];
    expect(getStatusMessage(events)).toBe("Remote annotations updated");
  });

  it("returns message for PDF_OPENED", () => {
    const events = [makeEvent({ type: IntegrationMessageType.PDF_OPENED })];
    expect(getStatusMessage(events)).toBe("Remote PDF opened");
  });

  it("returns error message for ERROR", () => {
    const events = [
      makeEvent({
        type: IntegrationMessageType.ERROR,
        data: { message: "connection lost" },
      }),
    ];
    expect(getStatusMessage(events)).toBe("Remote error: connection lost");
  });

  it("uses most recent event (last in array)", () => {
    const events = [
      makeEvent({ data: { page: 1 } }),
      makeEvent({
        type: IntegrationMessageType.PDF_OPENED,
        data: { path: "/x.pdf" },
      }),
    ];
    expect(getStatusMessage(events)).toBe("Remote PDF opened");
  });
});

// ── message-map.ts ─────────────────────────────────────────────────────

describe("message-map", () => {
  it("WS_MESSAGE_MAP has 11 entries", () => {
    expect(WS_MESSAGE_MAP.length).toBe(11);
  });

  it("WS_MESSAGE_TYPES matches map keys", () => {
    expect(WS_MESSAGE_TYPES).toEqual(WS_MESSAGE_MAP.map(([t]) => t));
  });

  it("registerWebSocketHandlers registers all message types", () => {
    const onMessageCalls: [string, (data: unknown) => void][] = [];
    const offMessageCalls: string[] = [];
    const mockClient = {
      onMessage: (type: string, handler: (data: unknown) => void) => {
        onMessageCalls.push([type, handler]);
      },
      offMessage: (type: string) => {
        offMessageCalls.push(type);
      },
    };

    const addEvent = vi.fn();
    registerWebSocketHandlers(
      mockClient as unknown as Parameters<typeof registerWebSocketHandlers>[0],
      addEvent
    );

    // Should clean up all old handlers first
    expect(offMessageCalls.length).toBe(11);
    // Should register all 11 handlers
    expect(onMessageCalls.length).toBe(11);
  });

  it("registerWebSocketHandlers calls addEvent on message", () => {
    const handlers = new Map<string, (data: unknown) => void>();
    const mockClient = {
      onMessage: (type: string, handler: (data: unknown) => void) => {
        handlers.set(type, handler);
      },
      offMessage: () => {},
    };

    const addEvent = vi.fn();
    registerWebSocketHandlers(
      mockClient as unknown as Parameters<typeof registerWebSocketHandlers>[0],
      addEvent
    );

    // Trigger a non-ERROR message
    handlers.get("PAGE_CHANGED")!({ page: 5 });
    expect(addEvent).toHaveBeenCalledTimes(1);
    expect(addEvent.mock.calls[0][0]).toMatchObject({
      type: IntegrationMessageType.PAGE_CHANGED,
      data: { page: 5 },
    });
  });

  it("registerWebSocketHandlers calls onError for ERROR messages", () => {
    const handlers = new Map<string, (data: unknown) => void>();
    const mockClient = {
      onMessage: (type: string, handler: (data: unknown) => void) => {
        handlers.set(type, handler);
      },
      offMessage: () => {},
    };

    const addEvent = vi.fn();
    const onError = vi.fn();
    registerWebSocketHandlers(
      mockClient as unknown as Parameters<typeof registerWebSocketHandlers>[0],
      addEvent,
      onError
    );

    handlers.get("ERROR")!({ message: "test failure" });
    expect(onError).toHaveBeenCalledWith("test failure");
    expect(addEvent).toHaveBeenCalledTimes(1);
  });
});
