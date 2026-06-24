export const localControlProtocolVersion = "2.0" as const;

export const localControlTransport = {
  name: "websocket_json_loopback",
  description: "WebSocket JSON over loopback",
  defaultPort: 11451,
  loopbackOnly: true,
  preservesCommands: true,
} as const;

export const localControlCommands = [
  "NEXT_PAGE",
  "PREVIOUS_PAGE",
  "GO_TO_PAGE",
  "GET_STATE",
  "SET_ZOOM",
  "TOGGLE_PRESENTER",
  "PING",
  "ADD_ANNOTATION",
  "CLEAR_ANNOTATIONS",
  "GET_CAPABILITIES",
] as const;

export const localControlEvents = [
  "STATE",
  "PAGE_CHANGED",
  "PDF_OPENED",
  "PDF_CLOSED",
  "ZOOM_CHANGED",
  "PRESENTER_CHANGED",
  "ERROR",
  "PONG",
  "CONNECTED",
  "ANNOTATIONS_UPDATED",
  "ANNOTATIONS_CLEARED",
  "CAPABILITIES",
] as const;

export const localControlFeatures = [
  "presenter",
  "annotations",
  "pdf_state",
  "websocket_control",
] as const;

export type LocalControlProtocolVersion = typeof localControlProtocolVersion;
export type LocalControlCommandName = (typeof localControlCommands)[number];
export type LocalControlEventName = (typeof localControlEvents)[number];
export type LocalControlFeatureName = (typeof localControlFeatures)[number];

export interface LocalControlV2Metadata {
  protocolVersion?: LocalControlProtocolVersion;
  request_id?: string;
}

export interface LocalControlStateSnapshot {
  page: number;
  total_pages: number;
  zoom: number;
  pdf_loaded: boolean;
  pdf_path: string | null;
  pdf_title: string | null;
  presenter_active: boolean;
}

export type LocalControlErrorCode =
  | "INVALID_COMMAND"
  | "INVALID_PAYLOAD"
  | "PDF_NOT_LOADED"
  | "PAGE_OUT_OF_RANGE"
  | "UNSUPPORTED_COMMAND"
  | "INTERNAL_ERROR";

export interface LocalControlErrorPayload {
  message: string;
  code?: LocalControlErrorCode;
  command?: LocalControlCommandName;
  details?: Record<string, unknown>;
}

export interface LocalControlCapabilitiesPayload {
  protocolVersion: LocalControlProtocolVersion;
  supported_commands: LocalControlCommandName[];
  supported_events: LocalControlEventName[];
  features: LocalControlFeatureName[];
}

export interface AddAnnotationPayload {
  page: number;
  annotation: Record<string, unknown>;
}

export interface LocalControlCommandPayloadMap {
  NEXT_PAGE: Record<never, never>;
  PREVIOUS_PAGE: Record<never, never>;
  GO_TO_PAGE: { page: number };
  GET_STATE: Record<never, never>;
  SET_ZOOM: { zoom: number };
  TOGGLE_PRESENTER: Record<never, never>;
  PING: Record<never, never>;
  ADD_ANNOTATION: AddAnnotationPayload;
  CLEAR_ANNOTATIONS: Record<never, never>;
  GET_CAPABILITIES: Record<never, never>;
}

export interface LocalControlEventPayloadMap {
  STATE: LocalControlStateSnapshot;
  PAGE_CHANGED: { page: number; total_pages: number };
  PDF_OPENED: { path: string; title: string | null; page_count: number };
  PDF_CLOSED: Record<string, never>;
  ZOOM_CHANGED: { zoom: number };
  PRESENTER_CHANGED: { active: boolean };
  ERROR: LocalControlErrorPayload;
  PONG: Record<never, never>;
  CONNECTED: { version: string };
  ANNOTATIONS_UPDATED: { annotations: Record<string, unknown[]> };
  ANNOTATIONS_CLEARED: Record<never, never>;
  CAPABILITIES: LocalControlCapabilitiesPayload;
}

export type LocalControlCommand<
  TCommand extends LocalControlCommandName = LocalControlCommandName,
> = TCommand extends LocalControlCommandName
  ? { type: TCommand } & LocalControlV2Metadata &
      LocalControlCommandPayloadMap[TCommand]
  : never;

export type LocalControlEvent<
  TEvent extends LocalControlEventName = LocalControlEventName,
> = TEvent extends LocalControlEventName
  ? { type: TEvent } & LocalControlV2Metadata &
      LocalControlEventPayloadMap[TEvent]
  : never;

export interface LocalControlSchemaShape {
  protocolVersion: LocalControlProtocolVersion;
  transport: typeof localControlTransport;
  commands: typeof localControlCommands;
  events: typeof localControlEvents;
  features: typeof localControlFeatures;
  stateFields: readonly (keyof LocalControlStateSnapshot)[];
}

export const localControlSchemas = {
  protocolVersion: localControlProtocolVersion,
  transport: localControlTransport,
  commands: localControlCommands,
  events: localControlEvents,
  features: localControlFeatures,
  stateFields: [
    "page",
    "total_pages",
    "zoom",
    "pdf_loaded",
    "pdf_path",
    "pdf_title",
    "presenter_active",
  ],
} as const satisfies LocalControlSchemaShape;

export const localControlCapabilities: LocalControlCapabilitiesPayload = {
  protocolVersion: localControlProtocolVersion,
  supported_commands: [...localControlCommands],
  supported_events: [...localControlEvents],
  features: [...localControlFeatures],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isStringOrNull = (value: unknown): value is string | null =>
  typeof value === "string" || value === null;

const isCommandName = (value: unknown): value is LocalControlCommandName =>
  typeof value === "string" &&
  localControlCommands.includes(value as LocalControlCommandName);

const isEventName = (value: unknown): value is LocalControlEventName =>
  typeof value === "string" &&
  localControlEvents.includes(value as LocalControlEventName);

const isFeatureName = (value: unknown): value is LocalControlFeatureName =>
  typeof value === "string" &&
  localControlFeatures.includes(value as LocalControlFeatureName);

export const isLocalControlStateSnapshot = (
  value: unknown
): value is LocalControlStateSnapshot =>
  isRecord(value) &&
  isNumber(value.page) &&
  isNumber(value.total_pages) &&
  isNumber(value.zoom) &&
  typeof value.pdf_loaded === "boolean" &&
  isStringOrNull(value.pdf_path) &&
  isStringOrNull(value.pdf_title) &&
  typeof value.presenter_active === "boolean";

export const isLocalControlCommand = (
  value: unknown
): value is LocalControlCommand =>
  isRecord(value) &&
  isCommandName(value.type) &&
  (value.protocolVersion === undefined ||
    value.protocolVersion === localControlProtocolVersion) &&
  (value.request_id === undefined || typeof value.request_id === "string");

export const isLocalControlEvent = (
  value: unknown
): value is LocalControlEvent =>
  isRecord(value) &&
  isEventName(value.type) &&
  (value.protocolVersion === undefined ||
    value.protocolVersion === localControlProtocolVersion) &&
  (value.request_id === undefined || typeof value.request_id === "string");

export const isLocalControlErrorPayload = (
  value: unknown
): value is LocalControlErrorPayload =>
  isRecord(value) &&
  typeof value.message === "string" &&
  (value.code === undefined || typeof value.code === "string");

export const isLocalControlCapabilitiesPayload = (
  value: unknown
): value is LocalControlCapabilitiesPayload =>
  isRecord(value) &&
  value.protocolVersion === localControlProtocolVersion &&
  Array.isArray(value.supported_commands) &&
  value.supported_commands.every(isCommandName) &&
  Array.isArray(value.supported_events) &&
  value.supported_events.every(isEventName) &&
  Array.isArray(value.features) &&
  value.features.every(isFeatureName);
