import WebSocket, { type RawData } from "ws";

import {
  buildStreamSlateCommand,
  defaultStreamSlateState,
  isRecord,
  isStreamSlateEventName,
  STREAMSLATE_HOST,
  STREAMSLATE_PORT,
  streamSlateUrl,
  type StreamSlateCapabilities,
  type StreamSlateCommand,
  type StreamSlateCommandName,
  type StreamSlateCommandPayloads,
  type StreamSlateConnectionStatus,
  type StreamSlateEvent,
  type StreamSlateState,
} from "./protocol.js";

type SocketEvent = "open" | "message" | "close" | "error";

export interface SocketLike {
  readyState: number;
  on(event: "open", listener: () => void): this;
  on(event: "message", listener: (data: RawData | string) => void): this;
  on(event: "close", listener: () => void): this;
  on(event: "error", listener: (error: Error) => void): this;
  send(data: string): void;
  close(): void;
}

export interface StreamSlateClientOptions {
  host?: string;
  port?: number;
  reconnectDelayMs?: number;
  autoReconnect?: boolean;
  socketFactory?: (url: string) => SocketLike;
}

export interface SendResult<
  TCommand extends StreamSlateCommandName = StreamSlateCommandName,
> {
  command: StreamSlateCommand<TCommand>;
  sent: boolean;
}

interface ClientEvents {
  status: StreamSlateConnectionStatus;
  state: StreamSlateState;
  capabilities: StreamSlateCapabilities;
  event: StreamSlateEvent;
  error: Error;
}

type Listener<T> = (value: T) => void;

const OPEN_READY_STATE = 1;

const defaultSocketFactory = (url: string): SocketLike =>
  new WebSocket(url) as SocketLike;

export class StreamSlateClient {
  readonly url: string;

  private readonly autoReconnect: boolean;
  private readonly reconnectDelayMs: number;
  private readonly socketFactory: (url: string) => SocketLike;
  private readonly listeners = new Map<
    keyof ClientEvents,
    Set<Listener<any>>
  >();
  private socket: SocketLike | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private requestCounter = 0;
  private status: StreamSlateConnectionStatus = "idle";
  private intentionalClose = false;
  private currentState = defaultStreamSlateState();
  private currentCapabilities: StreamSlateCapabilities | null = null;

  constructor(options: StreamSlateClientOptions = {}) {
    this.url = streamSlateUrl(
      options.host ?? STREAMSLATE_HOST,
      options.port ?? STREAMSLATE_PORT
    );
    this.autoReconnect = options.autoReconnect ?? true;
    this.reconnectDelayMs = options.reconnectDelayMs ?? 3000;
    this.socketFactory = options.socketFactory ?? defaultSocketFactory;
  }

  get connectionStatus(): StreamSlateConnectionStatus {
    return this.status;
  }

  get state(): StreamSlateState {
    return { ...this.currentState };
  }

  get capabilities(): StreamSlateCapabilities | null {
    return this.currentCapabilities === null
      ? null
      : {
          ...this.currentCapabilities,
          supported_commands: [...this.currentCapabilities.supported_commands],
          supported_events: [...this.currentCapabilities.supported_events],
          features: [...this.currentCapabilities.features],
        };
  }

  on<TKey extends keyof ClientEvents>(
    event: TKey,
    listener: Listener<ClientEvents[TKey]>
  ): () => void {
    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(listener);
    this.listeners.set(event, listeners);

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  connect(): void {
    if (this.status === "connecting" || this.status === "connected") {
      return;
    }

    this.clearReconnectTimer();
    this.intentionalClose = false;
    this.setStatus("connecting");
    this.socket = this.socketFactory(this.url);

    this.socket
      .on("open", () => this.handleOpen())
      .on("message", (data) => this.handleMessage(data))
      .on("close", () => this.handleClose())
      .on("error", (error) => this.handleError(error));
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.clearReconnectTimer();
    this.socket?.close();
    this.socket = null;
    this.setStatus("disconnected");
  }

  isConnected(): boolean {
    return this.socket?.readyState === OPEN_READY_STATE;
  }

  send<TCommand extends StreamSlateCommandName>(
    type: TCommand,
    payload: StreamSlateCommandPayloads[TCommand]
  ): SendResult<TCommand> {
    const command = buildStreamSlateCommand(
      type,
      payload,
      this.nextRequestId(type)
    );

    if (!this.isConnected()) {
      this.emit(
        "error",
        new Error(`Cannot send ${type}: StreamSlate is not connected`)
      );
      return { command, sent: false };
    }

    this.socket?.send(JSON.stringify(command));
    return { command, sent: true };
  }

  refreshState(): SendResult<"GET_STATE"> {
    return this.send("GET_STATE", {});
  }

  private handleOpen(): void {
    this.setStatus("connected");
    this.send("GET_CAPABILITIES", {});
    this.refreshState();
  }

  private handleClose(): void {
    this.socket = null;
    this.setStatus("disconnected");

    if (this.autoReconnect && !this.intentionalClose) {
      this.reconnectTimer = setTimeout(
        () => this.connect(),
        this.reconnectDelayMs
      );
      this.reconnectTimer.unref?.();
    }
  }

  private handleError(error: Error): void {
    this.setStatus("error");
    this.emit("error", error);
  }

  private handleMessage(data: RawData | string): void {
    const event = this.parseEvent(data);
    if (event === null) {
      return;
    }

    this.applyEvent(event);
    this.emit("event", event);
  }

  private parseEvent(data: RawData | string): StreamSlateEvent | null {
    try {
      const value = JSON.parse(this.rawDataToString(data)) as unknown;
      if (!isRecord(value) || !isStreamSlateEventName(value.type)) {
        return null;
      }
      return value as StreamSlateEvent;
    } catch (error) {
      this.emit(
        "error",
        error instanceof Error ? error : new Error("Invalid StreamSlate event")
      );
      return null;
    }
  }

  private rawDataToString(data: RawData | string): string {
    if (typeof data === "string") {
      return data;
    }

    if (Array.isArray(data)) {
      return Buffer.concat(data).toString("utf8");
    }

    if (data instanceof ArrayBuffer) {
      return Buffer.from(data).toString("utf8");
    }

    return data.toString("utf8");
  }

  private applyEvent(event: StreamSlateEvent): void {
    switch (event.type) {
      case "CAPABILITIES":
        this.currentCapabilities = {
          protocolVersion: event.protocolVersion,
          supported_commands: [...event.supported_commands],
          supported_events: [...event.supported_events],
          features: [...event.features],
        };
        this.emit("capabilities", {
          ...this.currentCapabilities,
          supported_commands: [...this.currentCapabilities.supported_commands],
          supported_events: [...this.currentCapabilities.supported_events],
          features: [...this.currentCapabilities.features],
        });
        break;
      case "STATE":
        this.currentState = {
          page: event.page,
          total_pages: event.total_pages,
          zoom: event.zoom,
          pdf_loaded: event.pdf_loaded,
          pdf_path: event.pdf_path,
          pdf_title: event.pdf_title,
          presenter_active: event.presenter_active,
        };
        this.emit("state", this.state);
        break;
      case "PAGE_CHANGED":
        this.currentState = {
          ...this.currentState,
          page: event.page,
          total_pages: event.total_pages,
          pdf_loaded: event.total_pages > 0,
        };
        this.emit("state", this.state);
        break;
      case "PRESENTER_CHANGED":
        this.currentState = {
          ...this.currentState,
          presenter_active: event.active,
        };
        this.emit("state", this.state);
        break;
      case "ZOOM_CHANGED":
        this.currentState = { ...this.currentState, zoom: event.zoom };
        this.emit("state", this.state);
        break;
      case "PDF_OPENED":
        this.currentState = {
          ...this.currentState,
          page: this.currentState.page > 0 ? this.currentState.page : 1,
          total_pages: event.page_count,
          pdf_loaded: true,
          pdf_path: event.path ?? null,
          pdf_title: event.title ?? null,
        };
        this.emit("state", this.state);
        break;
      case "PDF_CLOSED":
        this.currentState = defaultStreamSlateState();
        this.emit("state", this.state);
        break;
      case "ERROR":
        this.emit("error", new Error(event.message));
        break;
      case "CONNECTED":
      case "PONG":
        break;
    }
  }

  private nextRequestId(type: StreamSlateCommandName): string {
    this.requestCounter += 1;
    return `streamdeck-${type.toLowerCase().replaceAll("_", "-")}-${
      this.requestCounter
    }`;
  }

  private setStatus(status: StreamSlateConnectionStatus): void {
    this.status = status;
    this.emit("status", status);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private emit<TKey extends keyof ClientEvents>(
    event: TKey,
    value: ClientEvents[TKey]
  ): void {
    const listeners = this.listeners.get(event);
    if (listeners === undefined) {
      return;
    }

    for (const listener of listeners) {
      listener(value);
    }
  }
}

export const streamSlateClient = new StreamSlateClient();
