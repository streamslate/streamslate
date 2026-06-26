import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StreamSlateClient, type SocketLike } from "./streamslate-client.js";

type MockEvent = "open" | "message" | "close" | "error";

class MockSocket implements SocketLike {
  readyState = 0;
  readonly sent: string[] = [];
  private readonly listeners = new Map<
    MockEvent,
    Set<(value?: unknown) => void>
  >();

  on(event: "open", listener: () => void): this;
  on(event: "message", listener: (data: string) => void): this;
  on(event: "close", listener: () => void): this;
  on(event: "error", listener: (error: Error) => void): this;
  on(
    event: MockEvent,
    listener: (() => void) | ((data: string) => void) | ((error: Error) => void)
  ): this {
    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(listener as (value?: unknown) => void);
    this.listeners.set(event, listeners);
    return this;
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = 3;
    this.emit("close");
  }

  open(): void {
    this.readyState = 1;
    this.emit("open");
  }

  message(payload: unknown): void {
    this.emit("message", JSON.stringify(payload));
  }

  fail(error: Error): void {
    this.emit("error", error);
  }

  private emit(event: MockEvent, value?: unknown): void {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(value);
    }
  }
}

describe("StreamSlateClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("requests capabilities and state after connect", () => {
    const sockets: MockSocket[] = [];
    const client = new StreamSlateClient({
      socketFactory: () => {
        const socket = new MockSocket();
        sockets.push(socket);
        return socket;
      },
    });

    client.connect();
    sockets[0].open();

    const sent = sockets[0].sent.map((message) => JSON.parse(message));
    expect(sent).toMatchObject([
      {
        type: "GET_CAPABILITIES",
        protocolVersion: "2.0",
      },
      {
        type: "GET_STATE",
        protocolVersion: "2.0",
      },
    ]);
    expect(sent[0].request_id).toBe("streamdeck-get-capabilities-1");
    expect(sent[1].request_id).toBe("streamdeck-get-state-2");
  });

  it("tracks state events and emits errors without throwing", () => {
    const socket = new MockSocket();
    const errors: string[] = [];
    const states: number[] = [];
    const client = new StreamSlateClient({
      socketFactory: () => socket,
    });

    client.on("error", (error) => errors.push(error.message));
    client.on("state", (state) => states.push(state.page));

    client.connect();
    socket.open();
    socket.message({
      type: "STATE",
      page: 3,
      total_pages: 10,
      zoom: 1.25,
      pdf_loaded: true,
      pdf_path: "/tmp/deck.pdf",
      pdf_title: "Deck",
      presenter_active: false,
    });
    socket.fail(new Error("connection refused"));

    expect(client.state).toMatchObject({
      page: 3,
      total_pages: 10,
      zoom: 1.25,
    });
    expect(states).toContain(3);
    expect(errors).toContain("connection refused");
  });

  it("reconnects after an unexpected close", async () => {
    const sockets: MockSocket[] = [];
    const client = new StreamSlateClient({
      reconnectDelayMs: 25,
      socketFactory: () => {
        const socket = new MockSocket();
        sockets.push(socket);
        return socket;
      },
    });

    client.connect();
    sockets[0].open();
    sockets[0].close();

    await vi.advanceTimersByTimeAsync(25);

    expect(sockets).toHaveLength(2);
    expect(client.connectionStatus).toBe("connecting");
    client.disconnect();
  });
});
