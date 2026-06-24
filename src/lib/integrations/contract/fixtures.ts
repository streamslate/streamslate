import {
  localControlCapabilities,
  localControlProtocolVersion,
  type LocalControlCommand,
  type LocalControlErrorPayload,
  type LocalControlEvent,
  type LocalControlStateSnapshot,
} from "./schemas";

export const loadedPdfStateFixture: LocalControlStateSnapshot = {
  page: 3,
  total_pages: 12,
  zoom: 1.25,
  pdf_loaded: true,
  pdf_path: "/Users/example/slides/streamslate-demo.pdf",
  pdf_title: "StreamSlate Demo",
  presenter_active: false,
};

export const emptyPdfStateFixture: LocalControlStateSnapshot = {
  page: 0,
  total_pages: 0,
  zoom: 1,
  pdf_loaded: false,
  pdf_path: null,
  pdf_title: null,
  presenter_active: false,
};

const command = <TCommand extends LocalControlCommand["type"]>(
  requestId: string,
  commandName: TCommand,
  payload?: Omit<
    LocalControlCommand<TCommand>,
    "type" | "protocolVersion" | "request_id"
  >
): LocalControlCommand<TCommand> =>
  ({
    protocolVersion: localControlProtocolVersion,
    request_id: requestId,
    type: commandName,
    ...(payload ?? {}),
  }) as LocalControlCommand<TCommand>;

export const localControlCommandFixtures = {
  nextPage: command("cmd-next-page", "NEXT_PAGE"),
  previousPage: command("cmd-previous-page", "PREVIOUS_PAGE"),
  goToPage: command("cmd-go-to-page", "GO_TO_PAGE", { page: 6 }),
  getState: command("cmd-get-state", "GET_STATE"),
  setZoom: command("cmd-set-zoom", "SET_ZOOM", { zoom: 1.5 }),
  togglePresenter: command("cmd-toggle-presenter", "TOGGLE_PRESENTER"),
  ping: command("cmd-ping", "PING"),
  addAnnotation: command("cmd-add-annotation", "ADD_ANNOTATION", {
    page: 3,
    annotation: {
      id: "ann-highlight-1",
      type: "highlight",
      color: "#facc15",
      text: "Key moment",
    },
  }),
  clearAnnotations: command("cmd-clear-annotations", "CLEAR_ANNOTATIONS"),
  getCapabilities: command("cmd-get-capabilities", "GET_CAPABILITIES"),
} as const;

export const localControlErrorFixture: LocalControlErrorPayload = {
  code: "PAGE_OUT_OF_RANGE",
  message: "Page 99 is outside the loaded document range.",
  command: "GO_TO_PAGE",
  details: {
    requested_page: 99,
    total_pages: loadedPdfStateFixture.total_pages,
  },
};

export const localControlEventFixtures = {
  pageChanged: {
    protocolVersion: localControlProtocolVersion,
    request_id: localControlCommandFixtures.nextPage.request_id,
    type: "PAGE_CHANGED",
    page: 4,
    total_pages: loadedPdfStateFixture.total_pages,
  },
  presenterChanged: {
    protocolVersion: localControlProtocolVersion,
    request_id: localControlCommandFixtures.togglePresenter.request_id,
    type: "PRESENTER_CHANGED",
    active: true,
  },
  annotationsCleared: {
    protocolVersion: localControlProtocolVersion,
    request_id: localControlCommandFixtures.clearAnnotations.request_id,
    type: "ANNOTATIONS_CLEARED",
  },
  state: {
    protocolVersion: localControlProtocolVersion,
    request_id: localControlCommandFixtures.getState.request_id,
    type: "STATE",
    ...loadedPdfStateFixture,
  },
  pong: {
    protocolVersion: localControlProtocolVersion,
    request_id: localControlCommandFixtures.ping.request_id,
    type: "PONG",
  },
  error: {
    protocolVersion: localControlProtocolVersion,
    request_id: "cmd-go-to-page-invalid",
    type: "ERROR",
    ...localControlErrorFixture,
  },
  capabilities: {
    type: "CAPABILITIES",
    ...localControlCapabilities,
    request_id: localControlCommandFixtures.getCapabilities.request_id,
  },
} as const satisfies Record<string, LocalControlEvent>;

export const localControlFixtures = {
  state: {
    loadedPdf: loadedPdfStateFixture,
    emptyPdf: emptyPdfStateFixture,
  },
  commands: localControlCommandFixtures,
  events: localControlEventFixtures,
  error: localControlErrorFixture,
  capabilities: localControlCapabilities,
} as const;
