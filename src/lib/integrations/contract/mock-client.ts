import {
  localControlCapabilities,
  localControlProtocolVersion,
  type AddAnnotationPayload,
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
  private eventCount = 1;

  constructor(options: LocalControlMockClientOptions = {}) {
    this.state = { ...(options.state ?? loadedPdfStateFixture) };
  }

  getState(): LocalControlStateSnapshot {
    return { ...this.state };
  }

  process(command: LocalControlCommand): LocalControlEvent {
    switch (command.command) {
      case "NEXT_PAGE":
        return this.moveToPage(command, this.state.page + 1);
      case "PREVIOUS_PAGE":
        return this.moveToPage(command, this.state.page - 1);
      case "GO_TO_PAGE":
        return this.moveToPage(command, command.payload?.page);
      case "GET_STATE":
        return this.event("STATE", this.getState(), command.id);
      case "SET_ZOOM":
        if (!command.payload || typeof command.payload.zoom !== "number") {
          return this.invalidPayload(command, "SET_ZOOM requires zoom.");
        }
        this.state = { ...this.state, zoom: command.payload.zoom };
        return this.event(
          "ZOOM_CHANGED",
          { zoom: this.state.zoom },
          command.id
        );
      case "TOGGLE_PRESENTER": {
        const requested = command.payload?.active;
        const presenterActive =
          typeof requested === "boolean"
            ? requested
            : !this.state.presenter_active;
        this.state = { ...this.state, presenter_active: presenterActive };
        return this.event(
          "PRESENTER_CHANGED",
          { presenter_active: presenterActive },
          command.id
        );
      }
      case "PING":
        return this.event(
          "PONG",
          { nonce: command.payload?.nonce, ok: true },
          command.id
        );
      case "ADD_ANNOTATION":
        if (!isAddAnnotationPayload(command.payload)) {
          return this.invalidPayload(
            command,
            "ADD_ANNOTATION requires an annotation."
          );
        }
        return this.event("ANNOTATION_ADDED", command.payload, command.id);
      case "CLEAR_ANNOTATIONS":
        return this.event(
          "ANNOTATIONS_CLEARED",
          { page: command.payload?.page, cleared: true },
          command.id
        );
      case "GET_CAPABILITIES":
        return this.event("CAPABILITIES", localControlCapabilities, command.id);
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
          command: command.command,
        },
        command.id
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
          command: command.command,
          details: {
            requested_page: page,
            total_pages: this.state.total_pages,
          },
        },
        command.id
      );
    }

    this.state = { ...this.state, page };
    return this.event(
      "PAGE_CHANGED",
      { page, total_pages: this.state.total_pages },
      command.id
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
        command: command.command,
      },
      command.id
    );
  }

  private event<TEvent extends LocalControlEventName>(
    eventName: TEvent,
    payload: LocalControlEventPayloadMap[TEvent],
    correlationId: string
  ): LocalControlEvent<TEvent> {
    const id = `mock-event-${this.eventCount}`;
    this.eventCount += 1;

    return {
      protocolVersion: localControlProtocolVersion,
      id,
      type: "event",
      event: eventName,
      payload,
      correlationId,
    } as LocalControlEvent<TEvent>;
  }
}

const isAddAnnotationPayload = (
  payload: unknown
): payload is AddAnnotationPayload =>
  typeof payload === "object" &&
  payload !== null &&
  "annotation" in payload &&
  typeof payload.annotation === "object" &&
  payload.annotation !== null &&
  "id" in payload.annotation &&
  typeof payload.annotation.id === "string";
