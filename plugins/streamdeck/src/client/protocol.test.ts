import { describe, expect, it } from "vitest";

import {
  buildStreamSlateCommand,
  STREAMSLATE_PROTOCOL_VERSION,
  streamSlateUrl,
} from "./protocol.js";

describe("StreamSlate protocol helpers", () => {
  it("builds V2 command envelopes with request metadata", () => {
    expect(
      buildStreamSlateCommand("GO_TO_PAGE", { page: 7 }, "deck-page-7"),
    ).toEqual({
      type: "GO_TO_PAGE",
      protocolVersion: STREAMSLATE_PROTOCOL_VERSION,
      request_id: "deck-page-7",
      page: 7,
    });
  });

  it("uses the loopback default endpoint", () => {
    expect(streamSlateUrl()).toBe("ws://127.0.0.1:11451");
  });
});
