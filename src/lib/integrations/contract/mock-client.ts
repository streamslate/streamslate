import {
  localControlCapabilities,
  localControlProtocolVersion,
  type LocalControlCommand,
  type LocalControlEvent,
  type LocalControlEventName,
  type LocalControlEventPayloadMap,
  type LocalControlStateSnapshot,
} from "./schemas";
import { loadedPdfStateFixture } from "./fixtures";

export interface LocalControlMockClientOptions {
  state?: LocalControlStateSnapshot;
}

export class LocalControlMockClient {
  private state: LocalControlStateSnapshot;

  constructor(options: LocalControlMockClientOptions = {}) {
    this.state = { ...(options.state ?? loadedPdfStateFixture) };
  }

  getState(): LocalControlStateSnapshot {
    return { ...this.state };
  }

  process(command: LocalControlCommand): LocalControlEvent {
    switch (command.type) {
      case "NEXT_PAGE":
        return this.moveToPage(command, this.state.page + 1);
      case "PREVIOUS_PAGE":
        return this.moveToPage(command, this.state.page - 1);
      case "GO_TO_PAGE":
        return this.moveToPage(command, command.page);
      case "GET_STATE":
        return this.event("STATE", this.getState(), command.request_id);
      case "SET_ZOOM":
        if (typeof command.zoom !== "number") {
          return this.invalidPayload(command, "SET_ZOOM requires zoom.");
        }
        this.state = { ...this.state, zoom: command.zoom };
        return this.event(
          "ZOOM_CHANGED",
          { zoom: this.state.zoom },
          command.request_id
        );
      case "TOGGLE_PRESENTER": {
        const active = !this.state.presenter_active;
        this.state = { ...this.state, presenter_active: active };
        return this.event("PRESENTER_CHANGED", { active }, command.request_id);
      }
      case "PING":
        return this.event("PONG", {}, command.request_id);
      case "ADD_ANNOTATION":
        if (!isAddAnnotationPayload(command)) {
          return this.invalidPayload(
            command,
            "ADD_ANNOTATION requires a page and annotation."
          );
        }
        return this.event(
          "ANNOTATIONS_UPDATED",
          { annotations: {} },
          command.request_id
        );
      case "CLEAR_ANNOTATIONS":
        return this.event("ANNOTATIONS_CLEARED", {}, command.request_id);
      case "GET_CAPABILITIES":
        return this.event(
          "CAPABILITIES",
          localControlCapabilities,
          command.request_id
        );
    }
  }

  processAll(commands: readonly LocalControlCommand[]): LocalControlEvent[] {
    return commands.map((item) => this.process(item));
  }

  private moveToPage(
    command: LocalControlCommand,
    page: number | undefined
  ): LocalControlEvent {
    if (!this.state.pdf_loaded) {
      return this.event(
        "ERROR",
        {
          code: "PDF_NOT_LOADED",
          message: "No PDF is currently loaded.",
          command: command.type,
        },
        command.request_id
      );
    }

    if (
      typeof page !== "number" ||
      !Number.isInteger(page) ||
      page < 1 ||
      page > this.state.total_pages
    ) {
      return this.event(
        "ERROR",
        {
          code: "PAGE_OUT_OF_RANGE",
          message: `Page ${String(page)} is outside the loaded document range.`,
          command: command.type,
          details: {
            requested_page: page,
            total_pages: this.state.total_pages,
          },
        },
        command.request_id
      );
    }

    this.state = { ...this.state, page };
    return this.event(
      "PAGE_CHANGED",
      { page, total_pages: this.state.total_pages },
      command.request_id
    );
  }

  private invalidPayload(
    command: LocalControlCommand,
    message: string
  ): LocalControlEvent {
    return this.event(
      "ERROR",
      {
        code: "INVALID_PAYLOAD",
        message,
        command: command.type,
      },
      command.request_id
    );
  }

  private event<TEvent extends LocalControlEventName>(
    eventName: TEvent,
    payload: LocalControlEventPayloadMap[TEvent],
    requestId: string | undefined
  ): LocalControlEvent<TEvent> {
    return {
      protocolVersion: localControlProtocolVersion,
      ...(requestId === undefined ? {} : { request_id: requestId }),
      type: eventName,
      ...payload,
    } as LocalControlEvent<TEvent>;
  }
}

const isAddAnnotationPayload = (
  command: LocalControlCommand
): command is LocalControlCommand<"ADD_ANNOTATION"> =>
  command.type === "ADD_ANNOTATION" &&
  typeof command.page === "number" &&
  typeof command.annotation === "object" &&
  command.annotation !== null;
