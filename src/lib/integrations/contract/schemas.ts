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
  "PAGE_CHANGED",
  "ZOOM_CHANGED",
  "PRESENTER_CHANGED",
  "ANNOTATION_ADDED",
  "ANNOTATIONS_CLEARED",
  "STATE",
  "PONG",
  "ERROR",
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
  code: LocalControlErrorCode;
  message: string;
  command?: LocalControlCommandName;
  details?: Record<string, unknown>;
}

export interface LocalControlCapability {
  feature: LocalControlFeatureName;
  supported: boolean;
  commands: LocalControlCommandName[];
  events: LocalControlEventName[];
}

export interface LocalControlCapabilitiesPayload {
  protocolVersion: LocalControlProtocolVersion;
  transport: typeof localControlTransport;
  features: LocalControlFeatureName[];
  capabilities: LocalControlCapability[];
}

export interface AddAnnotationPayload {
  annotation: {
    id: string;
    page: number;
    type: "highlight" | "note" | "drawing";
    color?: string;
    text?: string;
    points?: Array<{ x: number; y: number }>;
  };
}

export interface LocalControlCommandPayloadMap {
  NEXT_PAGE: undefined;
  PREVIOUS_PAGE: undefined;
  GO_TO_PAGE: { page: number };
  GET_STATE: undefined;
  SET_ZOOM: { zoom: number };
  TOGGLE_PRESENTER: { active?: boolean };
  PING: { nonce?: string } | undefined;
  ADD_ANNOTATION: AddAnnotationPayload;
  CLEAR_ANNOTATIONS: { page?: number } | undefined;
  GET_CAPABILITIES: undefined;
}

export interface LocalControlEventPayloadMap {
  PAGE_CHANGED: { page: number; total_pages: number };
  ZOOM_CHANGED: { zoom: number };
  PRESENTER_CHANGED: { presenter_active: boolean };
  ANNOTATION_ADDED: AddAnnotationPayload;
  ANNOTATIONS_CLEARED: { page?: number; cleared: true };
  STATE: LocalControlStateSnapshot;
  PONG: { nonce?: string; ok: true };
  ERROR: LocalControlErrorPayload;
  CAPABILITIES: LocalControlCapabilitiesPayload;
}

export type LocalControlCommand<
  TCommand extends LocalControlCommandName = LocalControlCommandName,
> = TCommand extends LocalControlCommandName
  ? {
      protocolVersion: LocalControlProtocolVersion;
      id: string;
      type: "command";
      command: TCommand;
      payload?: LocalControlCommandPayloadMap[TCommand];
    }
  : never;

export type LocalControlEvent<
  TEvent extends LocalControlEventName = LocalControlEventName,
> = TEvent extends LocalControlEventName
  ? {
      protocolVersion: LocalControlProtocolVersion;
      id: string;
      type: "event";
      event: TEvent;
      payload: LocalControlEventPayloadMap[TEvent];
      correlationId?: string;
    }
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
  transport: localControlTransport,
  features: [...localControlFeatures],
  capabilities: [
    {
      feature: "presenter",
      supported: true,
      commands: ["TOGGLE_PRESENTER"],
      events: ["PRESENTER_CHANGED", "STATE"],
    },
    {
      feature: "annotations",
      supported: true,
      commands: ["ADD_ANNOTATION", "CLEAR_ANNOTATIONS"],
      events: ["ANNOTATION_ADDED", "ANNOTATIONS_CLEARED", "STATE"],
    },
    {
      feature: "pdf_state",
      supported: true,
      commands: [
        "NEXT_PAGE",
        "PREVIOUS_PAGE",
        "GO_TO_PAGE",
        "GET_STATE",
        "SET_ZOOM",
      ],
      events: ["PAGE_CHANGED", "ZOOM_CHANGED", "STATE"],
    },
    {
      feature: "websocket_control",
      supported: true,
      commands: ["PING", "GET_CAPABILITIES"],
      events: ["PONG", "ERROR", "CAPABILITIES"],
    },
  ],
};

const hasOwn = <TKey extends PropertyKey>(
  value: object,
  key: TKey
): value is object & Record<TKey, unknown> =>
  Object.prototype.hasOwnProperty.call(value, key);

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
  value.protocolVersion === localControlProtocolVersion &&
  value.type === "command" &&
  typeof value.id === "string" &&
  isCommandName(value.command);

export const isLocalControlEvent = (
  value: unknown
): value is LocalControlEvent =>
  isRecord(value) &&
  value.protocolVersion === localControlProtocolVersion &&
  value.type === "event" &&
  typeof value.id === "string" &&
  isEventName(value.event) &&
  hasOwn(value, "payload");

export const isLocalControlErrorPayload = (
  value: unknown
): value is LocalControlErrorPayload =>
  isRecord(value) &&
  typeof value.code === "string" &&
  typeof value.message === "string" &&
  (!hasOwn(value, "command") || isCommandName(value.command));

export const isLocalControlCapabilitiesPayload = (
  value: unknown
): value is LocalControlCapabilitiesPayload =>
  isRecord(value) &&
  value.protocolVersion === localControlProtocolVersion &&
  isRecord(value.transport) &&
  value.transport.name === localControlTransport.name &&
  Array.isArray(value.features) &&
  value.features.every(isFeatureName) &&
  Array.isArray(value.capabilities) &&
  value.capabilities.every(
    (capability) =>
      isRecord(capability) &&
      isFeatureName(capability.feature) &&
      typeof capability.supported === "boolean" &&
      Array.isArray(capability.commands) &&
      capability.commands.every(isCommandName) &&
      Array.isArray(capability.events) &&
      capability.events.every(isEventName)
  );
