import { describe, expect, it } from "vitest";

import { ACTION_UUIDS } from "./ids.js";
import {
  commandForAction,
  streamSlateCommandNamesForManifest,
  titleForAction,
} from "./mapping.js";

describe("Stream Deck action mapping", () => {
  it("maps fixed key actions to StreamSlate commands", () => {
    expect(commandForAction(ACTION_UUIDS.nextPage)).toEqual({
      type: "NEXT_PAGE",
      payload: {},
    });
    expect(commandForAction(ACTION_UUIDS.previousPage)).toEqual({
      type: "PREVIOUS_PAGE",
      payload: {},
    });
    expect(commandForAction(ACTION_UUIDS.togglePresenter)).toEqual({
      type: "TOGGLE_PRESENTER",
      payload: {},
    });
    expect(commandForAction(ACTION_UUIDS.refreshState)).toEqual({
      type: "GET_STATE",
      payload: {},
    });
    expect(commandForAction(ACTION_UUIDS.healthCheck)).toEqual({
      type: "PING",
      payload: {},
    });
  });

  it("normalizes configured page and zoom payloads", () => {
    expect(commandForAction(ACTION_UUIDS.goToPage, { page: "12" })).toEqual({
      type: "GO_TO_PAGE",
      payload: { page: 12 },
    });
    expect(commandForAction(ACTION_UUIDS.setZoom, { zoom: "1.5" })).toEqual({
      type: "SET_ZOOM",
      payload: { zoom: 1.5 },
    });
  });

  it("surfaces connection and presenter state in titles", () => {
    const state = {
      page: 4,
      total_pages: 9,
      zoom: 1.25,
      pdf_loaded: true,
      presenter_active: true,
    };

    expect(titleForAction(ACTION_UUIDS.nextPage, {}, state, true)).toBe(
      "Next\n4/9"
    );
    expect(titleForAction(ACTION_UUIDS.togglePresenter, {}, state, true)).toBe(
      "Presenter\nOn"
    );
    expect(
      titleForAction(ACTION_UUIDS.setZoom, { zoom: 1.5 }, state, true)
    ).toBe("Zoom\n150%");
    expect(titleForAction(ACTION_UUIDS.nextPage, {}, state, false)).toBe(
      "StreamSlate\nOffline"
    );
    expect(titleForAction(ACTION_UUIDS.refreshState, {}, state, true)).toBe(
      "Refresh\nState"
    );
    expect(titleForAction(ACTION_UUIDS.healthCheck, {}, state, true)).toBe(
      "Health\nCheck"
    );
  });

  it("keeps manifest command coverage explicit", () => {
    expect(streamSlateCommandNamesForManifest()).toEqual([
      "NEXT_PAGE",
      "PREVIOUS_PAGE",
      "TOGGLE_PRESENTER",
      "GO_TO_PAGE",
      "SET_ZOOM",
      "GET_STATE",
      "PING",
    ]);
  });
});
