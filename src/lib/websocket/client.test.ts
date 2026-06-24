import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StreamSlateWebSocketClient } from "./client";

type MessageEventLike = { data: string };
type CloseEventLike = { code: number; reason: string; wasClean: boolean };

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly url: string;
  readyState = MockWebSocket.CONNECTING;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEventLike) => void) | null = null;
  onclose: ((event: CloseEventLike) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send(message: string): void {
    this.sent.push(message);
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({
      code: code ?? 1000,
      reason: reason ?? "",
      wasClean: true,
    });
  }

  open(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  receive(message: Record<string, unknown>): void {
    this.onmessage?.({ data: JSON.stringify(message) });
  }
}

describe("StreamSlateWebSocketClient capabilities negotiation", () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal("WebSocket", MockWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends GET_CAPABILITIES after connect and stores CAPABILITIES", async () => {
    const client = new StreamSlateWebSocketClient(12345);
    const states: ReturnType<typeof client.getState>[] = [];
    let stateSeenByHandler: ReturnType<typeof client.getState> | null = null;
    const capabilitiesHandler = vi.fn((payload: unknown) => {
      stateSeenByHandler = client.getState();
      expect(payload).toMatchObject({
        type: "CAPABILITIES",
        protocolVersion: "2.0",
        supported_commands: ["GET_STATE", "GET_CAPABILITIES"],
        supported_events: ["STATE", "CAPABILITIES"],
        features: ["pdf_state", "websocket_control"],
      });
    });
    client.onStateChange((state) => states.push(state));
    client.onMessage("CAPABILITIES", capabilitiesHandler);

    const connectPromise = client.connect();
    const socket = MockWebSocket.instances[0];
    socket.open();
    await connectPromise;

    expect(socket.url).toBe("ws://localhost:12345");
    expect(socket.sent).toHaveLength(1);
    const command = JSON.parse(socket.sent[0]) as Record<string, unknown>;
    expect(command).toMatchObject({
      type: "GET_CAPABILITIES",
      protocolVersion: "2.0",
    });
    expect(typeof command.request_id).toBe("string");

    const capabilitiesMessage = {
      type: "CAPABILITIES",
      protocolVersion: "2.0",
      request_id: command.request_id,
      supported_commands: ["GET_STATE", "GET_CAPABILITIES"],
      supported_events: ["STATE", "CAPABILITIES"],
      features: ["pdf_state", "websocket_control"],
    };

    socket.receive(capabilitiesMessage);

    expect(client.getState()).toMatchObject({
      connected: true,
      capabilityNegotiated: true,
      legacyFallback: false,
      capabilities: {
        protocolVersion: "2.0",
        supported_commands: ["GET_STATE", "GET_CAPABILITIES"],
        supported_events: ["STATE", "CAPABILITIES"],
        features: ["pdf_state", "websocket_control"],
      },
    });
    expect(states[states.length - 1]?.capabilities?.features).toContain(
      "websocket_control"
    );
    expect(capabilitiesHandler).toHaveBeenCalledTimes(1);
    expect(capabilitiesHandler).toHaveBeenCalledWith(capabilitiesMessage);
    expect(stateSeenByHandler).toMatchObject({
      capabilityNegotiated: true,
      legacyFallback: false,
      capabilities: {
        protocolVersion: "2.0",
        supported_commands: ["GET_STATE", "GET_CAPABILITIES"],
        supported_events: ["STATE", "CAPABILITIES"],
        features: ["pdf_state", "websocket_control"],
      },
    });
  });

  it("marks legacy fallback when GET_CAPABILITIES is unsupported", async () => {
    const client = new StreamSlateWebSocketClient();
    const errorHandler = vi.fn();
    client.onMessage("ERROR", errorHandler);

    const connectPromise = client.connect();
    const socket = MockWebSocket.instances[0];
    socket.open();
    await connectPromise;

    const command = JSON.parse(socket.sent[0]) as Record<string, unknown>;
    socket.receive({
      type: "ERROR",
      request_id: command.request_id,
      code: "UNSUPPORTED_COMMAND",
      message: "Unsupported command: GET_CAPABILITIES",
    });

    expect(client.getState()).toMatchObject({
      connected: true,
      capabilities: null,
      capabilityNegotiated: true,
      legacyFallback: true,
      lastError: null,
    });
    expect(errorHandler).not.toHaveBeenCalled();
  });
});
