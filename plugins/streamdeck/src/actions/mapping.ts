import {
  type StreamSlateCommandName,
  type StreamSlateCommandPayloads,
} from "../client/protocol.js";
import { ACTION_UUIDS, type StreamSlateActionUuid } from "./ids.js";
import {
  normalizePage,
  normalizeZoom,
  type StreamSlateActionSettings,
} from "./settings.js";

export type ActionCommandBinding =
  | { type: "NEXT_PAGE"; payload: StreamSlateCommandPayloads["NEXT_PAGE"] }
  | {
      type: "PREVIOUS_PAGE";
      payload: StreamSlateCommandPayloads["PREVIOUS_PAGE"];
    }
  | {
      type: "TOGGLE_PRESENTER";
      payload: StreamSlateCommandPayloads["TOGGLE_PRESENTER"];
    }
  | { type: "GO_TO_PAGE"; payload: StreamSlateCommandPayloads["GO_TO_PAGE"] }
  | { type: "SET_ZOOM"; payload: StreamSlateCommandPayloads["SET_ZOOM"] };

export const commandForAction = (
  actionUuid: StreamSlateActionUuid,
  settings: StreamSlateActionSettings = {},
): ActionCommandBinding => {
  switch (actionUuid) {
    case ACTION_UUIDS.nextPage:
      return { type: "NEXT_PAGE", payload: {} };
    case ACTION_UUIDS.previousPage:
      return { type: "PREVIOUS_PAGE", payload: {} };
    case ACTION_UUIDS.togglePresenter:
      return { type: "TOGGLE_PRESENTER", payload: {} };
    case ACTION_UUIDS.goToPage:
      return {
        type: "GO_TO_PAGE",
        payload: { page: normalizePage(settings.page) },
      };
    case ACTION_UUIDS.setZoom:
      return {
        type: "SET_ZOOM",
        payload: { zoom: normalizeZoom(settings.zoom) },
      };
  }
};

export const titleForAction = (
  actionUuid: StreamSlateActionUuid,
  settings: StreamSlateActionSettings,
  state: {
    page: number;
    total_pages: number;
    zoom: number;
    pdf_loaded: boolean;
    presenter_active: boolean;
  },
  connected: boolean,
): string => {
  if (!connected) {
    return "StreamSlate\nOffline";
  }

  if (!state.pdf_loaded && actionUuid !== ACTION_UUIDS.togglePresenter) {
    return "No PDF";
  }

  switch (actionUuid) {
    case ACTION_UUIDS.nextPage:
      return pageTitle("Next", state.page, state.total_pages);
    case ACTION_UUIDS.previousPage:
      return pageTitle("Prev", state.page, state.total_pages);
    case ACTION_UUIDS.togglePresenter:
      return `Presenter\n${state.presenter_active ? "On" : "Off"}`;
    case ACTION_UUIDS.goToPage:
      return `Page\n${normalizePage(settings.page)}`;
    case ACTION_UUIDS.setZoom:
      return `Zoom\n${Math.round(normalizeZoom(settings.zoom) * 100)}%`;
  }
};

export const streamSlateCommandNamesForManifest = (): StreamSlateCommandName[] =>
  ["NEXT_PAGE", "PREVIOUS_PAGE", "TOGGLE_PRESENTER", "GO_TO_PAGE", "SET_ZOOM"];

const pageTitle = (label: string, page: number, totalPages: number): string =>
  totalPages > 0 ? `${label}\n${page}/${totalPages}` : label;
