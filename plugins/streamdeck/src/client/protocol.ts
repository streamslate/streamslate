export const STREAMSLATE_HOST = "127.0.0.1";
export const STREAMSLATE_PORT = 11451;
export const STREAMSLATE_PROTOCOL_VERSION = "2.0";

export const streamSlateCommands = [
  "NEXT_PAGE",
  "PREVIOUS_PAGE",
  "GO_TO_PAGE",
  "GET_STATE",
  "SET_ZOOM",
  "TOGGLE_PRESENTER",
  "PING",
  "GET_CAPABILITIES",
] as const;

export const streamSlateEvents = [
  "CONNECTED",
  "CAPABILITIES",
  "STATE",
  "PAGE_CHANGED",
  "PRESENTER_CHANGED",
  "ZOOM_CHANGED",
  "PDF_OPENED",
  "PDF_CLOSED",
  "ERROR",
  "PONG",
] as const;

export type StreamSlateCommandName = (typeof streamSlateCommands)[number];
export type StreamSlateEventName = (typeof streamSlateEvents)[number];

export interface StreamSlateState {
  page: number;
  total_pages: number;
  zoom: number;
  pdf_loaded: boolean;
  pdf_path: string | null;
  pdf_title: string | null;
  presenter_active: boolean;
}

export interface StreamSlateCapabilities {
  protocolVersion: typeof STREAMSLATE_PROTOCOL_VERSION;
  supported_commands: StreamSlateCommandName[];
  supported_events: StreamSlateEventName[];
  features: string[];
}

export interface StreamSlateCommandPayloads {
  NEXT_PAGE: Record<string, never>;
  PREVIOUS_PAGE: Record<string, never>;
  GO_TO_PAGE: { page: number };
  GET_STATE: Record<string, never>;
  SET_ZOOM: { zoom: number };
  TOGGLE_PRESENTER: Record<string, never>;
  PING: Record<string, never>;
  GET_CAPABILITIES: Record<string, never>;
}

export type StreamSlateCommand<
  TCommand extends StreamSlateCommandName = StreamSlateCommandName,
> = TCommand extends StreamSlateCommandName
  ? {
      type: TCommand;
      protocolVersion: typeof STREAMSLATE_PROTOCOL_VERSION;
      request_id: string;
    } & StreamSlateCommandPayloads[TCommand]
  : never;

export type StreamSlateEvent =
  | ({ type: "CONNECTED"; version?: string; protocolVersion?: string } & {
      request_id?: string;
    })
  | ({ type: "CAPABILITIES"; request_id?: string } & StreamSlateCapabilities)
  | ({ type: "STATE"; request_id?: string } & StreamSlateState)
  | {
      type: "PAGE_CHANGED";
      page: number;
      total_pages: number;
      request_id?: string;
    }
  | { type: "PRESENTER_CHANGED"; active: boolean; request_id?: string }
  | { type: "ZOOM_CHANGED"; zoom: number; request_id?: string }
  | {
      type: "PDF_OPENED";
      path?: string;
      title?: string | null;
      page_count: number;
      request_id?: string;
    }
  | { type: "PDF_CLOSED"; request_id?: string }
  | {
      type: "ERROR";
      message: string;
      code?: string;
      recoverable?: boolean;
      details?: Record<string, unknown>;
      request_id?: string;
    }
  | { type: "PONG"; request_id?: string };

export type StreamSlateConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export const defaultStreamSlateState = (): StreamSlateState => ({
  page: 0,
  total_pages: 0,
  zoom: 1,
  pdf_loaded: false,
  pdf_path: null,
  pdf_title: null,
  presenter_active: false,
});

export const streamSlateUrl = (
  host: string = STREAMSLATE_HOST,
  port: number = STREAMSLATE_PORT
): string => `ws://${host}:${port}`;

export const isStreamSlateCommandName = (
  value: unknown
): value is StreamSlateCommandName =>
  typeof value === "string" &&
  streamSlateCommands.includes(value as StreamSlateCommandName);

export const isStreamSlateEventName = (
  value: unknown
): value is StreamSlateEventName =>
  typeof value === "string" &&
  streamSlateEvents.includes(value as StreamSlateEventName);

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const buildStreamSlateCommand = <
  TCommand extends StreamSlateCommandName,
>(
  type: TCommand,
  payload: StreamSlateCommandPayloads[TCommand],
  requestId: string
): StreamSlateCommand<TCommand> =>
  ({
    type,
    protocolVersion: STREAMSLATE_PROTOCOL_VERSION,
    request_id: requestId,
    ...payload,
  }) as StreamSlateCommand<TCommand>;
