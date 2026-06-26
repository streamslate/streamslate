import { describe, it, expect, beforeEach, vi } from "vitest";

const obsCommandsMock = vi.hoisted(() => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  getState: vi.fn(),
  listScenes: vi.fn(),
  setCurrentScene: vi.fn(),
  setSourceVisibility: vi.fn(),
  getRecordStatus: vi.fn(),
  startRecord: vi.fn(),
  stopRecord: vi.fn(),
  getStreamStatus: vi.fn(),
  startStream: vi.fn(),
  stopStream: vi.fn(),
}));

vi.mock("../lib/tauri/obs", () => ({
  OBSCommands: obsCommandsMock,
}));

import { useIntegrationStore } from "./integration.store";
import {
  IntegrationMessageType,
  IntegrationSource,
} from "../types/integration.types";
import type { IntegrationEvent } from "../types/integration.types";

function makeEvent(
  overrides: Partial<IntegrationEvent> = {}
): IntegrationEvent {
  return {
    id: `evt-${Math.random().toString(16).slice(2)}`,
    type: IntegrationMessageType.PAGE_CHANGED,
    source: IntegrationSource.STREAMSLATE,
    timestamp: new Date(),
    data: {},
    handled: false,
    ...overrides,
  };
}

describe("integration.store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useIntegrationStore.getState().reset();
  });

  describe("event queue", () => {
    it("addEvent appends to the events list", () => {
      const event = makeEvent();
      useIntegrationStore.getState().addEvent(event);
      expect(useIntegrationStore.getState().events).toHaveLength(1);
      expect(useIntegrationStore.getState().events[0].id).toBe(event.id);
    });

    it("addEvent caps at 100 events", () => {
      for (let i = 0; i < 110; i++) {
        useIntegrationStore.getState().addEvent(makeEvent({ id: `e-${i}` }));
      }
      expect(useIntegrationStore.getState().events.length).toBeLessThanOrEqual(
        100
      );
    });

    it("markEventHandled sets handled = true", () => {
      const event = makeEvent({ id: "target" });
      useIntegrationStore.getState().addEvent(event);
      useIntegrationStore.getState().markEventHandled("target");
      const updated = useIntegrationStore
        .getState()
        .events.find((e) => e.id === "target");
      expect(updated?.handled).toBe(true);
    });

    it("markEventHandled does not affect other events", () => {
      useIntegrationStore.getState().addEvent(makeEvent({ id: "a" }));
      useIntegrationStore.getState().addEvent(makeEvent({ id: "b" }));
      useIntegrationStore.getState().markEventHandled("a");
      const b = useIntegrationStore.getState().events.find((e) => e.id === "b");
      expect(b?.handled).toBe(false);
    });

    it("getUnhandledEvents filters handled events", () => {
      useIntegrationStore.getState().addEvent(makeEvent({ id: "a" }));
      useIntegrationStore.getState().addEvent(makeEvent({ id: "b" }));
      useIntegrationStore.getState().markEventHandled("a");
      const unhandled = useIntegrationStore.getState().getUnhandledEvents();
      expect(unhandled).toHaveLength(1);
      expect(unhandled[0].id).toBe("b");
    });

    it("clearEvents removes all events", () => {
      useIntegrationStore.getState().addEvent(makeEvent());
      useIntegrationStore.getState().addEvent(makeEvent());
      useIntegrationStore.getState().clearEvents();
      expect(useIntegrationStore.getState().events).toHaveLength(0);
    });
  });

  describe("error handling", () => {
    it("addError appends an error", () => {
      useIntegrationStore.getState().addError({
        code: "ERR_1",
        message: "test error",
        source: IntegrationSource.OBS,
        timestamp: new Date(),
      });
      expect(useIntegrationStore.getState().errors).toHaveLength(1);
    });

    it("removeError removes by code", () => {
      useIntegrationStore.getState().addError({
        code: "ERR_1",
        message: "a",
        source: IntegrationSource.OBS,
        timestamp: new Date(),
      });
      useIntegrationStore.getState().addError({
        code: "ERR_2",
        message: "b",
        source: IntegrationSource.NDI,
        timestamp: new Date(),
      });
      useIntegrationStore.getState().removeError("ERR_1");
      expect(useIntegrationStore.getState().errors).toHaveLength(1);
      expect(useIntegrationStore.getState().errors[0].code).toBe("ERR_2");
    });

    it("clearErrors removes all errors", () => {
      useIntegrationStore.getState().addError({
        code: "ERR_1",
        message: "a",
        source: IntegrationSource.OBS,
        timestamp: new Date(),
      });
      useIntegrationStore.getState().clearErrors();
      expect(useIntegrationStore.getState().errors).toHaveLength(0);
    });
  });

  describe("state setters", () => {
    it("setWebSocketState merges partial state", () => {
      useIntegrationStore.getState().setWebSocketState({ connected: true });
      const ws = useIntegrationStore.getState().websocket;
      expect(ws.connected).toBe(true);
      expect(ws.port).toBe(11451); // default preserved
    });

    it("setWebSocketState preserves capability metadata", () => {
      useIntegrationStore.getState().setWebSocketState({
        capabilities: {
          protocolVersion: "2.0",
          supported_commands: ["GET_CAPABILITIES"],
          supported_events: ["CAPABILITIES"],
          features: ["websocket_control"],
        },
        capabilityNegotiated: true,
        legacyFallback: false,
      });

      const ws = useIntegrationStore.getState().websocket;
      expect(ws.capabilityNegotiated).toBe(true);
      expect(ws.legacyFallback).toBe(false);
      expect(ws.capabilities?.supported_commands).toContain("GET_CAPABILITIES");
    });

    it("setWebSocketState records legacy fallback", () => {
      useIntegrationStore.getState().setWebSocketState({
        capabilities: null,
        capabilityNegotiated: true,
        legacyFallback: true,
      });

      const ws = useIntegrationStore.getState().websocket;
      expect(ws.capabilities).toBeNull();
      expect(ws.capabilityNegotiated).toBe(true);
      expect(ws.legacyFallback).toBe(true);
    });

    it("setOBSState merges partial state", () => {
      useIntegrationStore
        .getState()
        .setOBSState({ connected: true, version: "30.0" });
      const obs = useIntegrationStore.getState().obs;
      expect(obs.connected).toBe(true);
      expect(obs.version).toBe("30.0");
      expect(obs.isRecording).toBe(false);
    });

    it("setNDIState merges partial state", () => {
      useIntegrationStore.getState().setNDIState({ outputEnabled: true });
      expect(useIntegrationStore.getState().ndi.outputEnabled).toBe(true);
      expect(useIntegrationStore.getState().ndi.outputName).toBe("StreamSlate");
    });

    it("setSyphonState merges partial state", () => {
      useIntegrationStore.getState().setSyphonState({ enabled: true });
      expect(useIntegrationStore.getState().syphon.enabled).toBe(true);
    });

    it("setStreamDeckState merges partial state", () => {
      useIntegrationStore.getState().setStreamDeckState({ connected: true });
      expect(useIntegrationStore.getState().streamDeck.connected).toBe(true);
    });

    it("updateConfig deep-merges config", () => {
      useIntegrationStore
        .getState()
        .updateConfig({ obs: { enabled: true } as never });
      const config = useIntegrationStore.getState().config;
      expect(config.obs.enabled).toBe(true);
      expect(config.obs.host).toBe("localhost"); // preserved
    });
  });

  describe("OBS integration", () => {
    it("connectOBS uses configured credentials and populates OBS state", async () => {
      obsCommandsMock.connect.mockResolvedValue({
        connected: true,
        version: null,
      });
      obsCommandsMock.getState.mockResolvedValue({
        connection: {
          version: "30.1.2",
        },
        currentScene: "Main",
        stats: null,
      });
      obsCommandsMock.listScenes.mockResolvedValue([
        {
          name: "Main",
          sources: [
            {
              name: "Camera",
              type: "video_capture",
              visible: true,
              settings: {},
            },
          ],
        },
      ]);
      obsCommandsMock.getRecordStatus.mockResolvedValue({
        isRecording: true,
      });
      obsCommandsMock.getStreamStatus.mockResolvedValue({
        isStreaming: false,
      });

      useIntegrationStore.getState().updateConfig({
        obs: {
          enabled: true,
          host: "127.0.0.1",
          port: 4456,
          password: "secret",
          autoConnect: false,
        },
      });

      await useIntegrationStore.getState().connectOBS();

      expect(obsCommandsMock.connect).toHaveBeenCalledWith({
        host: "127.0.0.1",
        port: 4456,
        password: "secret",
      });
      const obs = useIntegrationStore.getState().obs;
      expect(obs.connected).toBe(true);
      expect(obs.version).toBe("30.1.2");
      expect(obs.scenes).toHaveLength(1);
      expect(obs.currentScene).toBe("Main");
      expect(obs.isRecording).toBe(true);
      expect(obs.isStreaming).toBe(false);
    });

    it("connectOBS records OBS_CONNECTION_FAILED on failure", async () => {
      obsCommandsMock.connect.mockRejectedValue(new Error("auth failed"));

      await useIntegrationStore.getState().connectOBS();

      const state = useIntegrationStore.getState();
      expect(state.obs.connected).toBe(false);
      expect(state.obs.version).toBeNull();
      expect(obsCommandsMock.getState).not.toHaveBeenCalled();
      expect(state.errors).toHaveLength(1);
      expect(state.errors[0]).toMatchObject({
        code: "OBS_CONNECTION_FAILED",
        message: "auth failed",
        source: IntegrationSource.OBS,
      });
    });

    it("disconnectOBS invokes backend disconnect when connected and resets state", async () => {
      obsCommandsMock.disconnect.mockResolvedValue(undefined);
      useIntegrationStore.getState().setOBSState({
        connected: true,
        version: "30.1.2",
        currentScene: "Main",
        isRecording: true,
        isStreaming: true,
        scenes: [
          {
            name: "Main",
            sources: [],
          },
        ],
      });

      await useIntegrationStore.getState().disconnectOBS();

      expect(obsCommandsMock.disconnect).toHaveBeenCalledTimes(1);
      expect(useIntegrationStore.getState().obs).toMatchObject({
        connected: false,
        version: null,
        scenes: [],
        currentScene: null,
        isRecording: false,
        isStreaming: false,
        stats: null,
      });
    });

    it("setOBSSourceVisibility invokes OBS and updates the source state", async () => {
      obsCommandsMock.setSourceVisibility.mockResolvedValue(undefined);
      useIntegrationStore.getState().setOBSState({
        connected: true,
        scenes: [
          {
            name: "Main",
            sources: [
              {
                name: "Camera",
                type: "video_capture",
                visible: false,
                settings: {},
              },
            ],
          },
        ],
      });

      await useIntegrationStore
        .getState()
        .setOBSSourceVisibility("Main", "Camera", true);

      expect(obsCommandsMock.setSourceVisibility).toHaveBeenCalledWith({
        sceneName: "Main",
        sourceName: "Camera",
        visible: true,
      });
      const scene = useIntegrationStore.getState().obs.scenes[0];
      expect(scene.sources[0].visible).toBe(true);
      expect(useIntegrationStore.getState().events[0]).toMatchObject({
        type: IntegrationMessageType.OBS_SOURCE_VISIBILITY_CHANGED,
        source: IntegrationSource.OBS,
        data: {
          sceneName: "Main",
          sourceName: "Camera",
          visible: true,
        },
      });
    });
  });

  describe("utility", () => {
    it("isAnyIntegrationConnected returns false initially", () => {
      expect(useIntegrationStore.getState().isAnyIntegrationConnected()).toBe(
        false
      );
    });

    it("isAnyIntegrationConnected returns true when websocket connected", () => {
      useIntegrationStore.getState().setWebSocketState({ connected: true });
      expect(useIntegrationStore.getState().isAnyIntegrationConnected()).toBe(
        true
      );
    });

    it("isAnyIntegrationConnected returns true when NDI output enabled", () => {
      useIntegrationStore.getState().setNDIState({ outputEnabled: true });
      expect(useIntegrationStore.getState().isAnyIntegrationConnected()).toBe(
        true
      );
    });

    it("reset returns to initial state", () => {
      useIntegrationStore.getState().setWebSocketState({ connected: true });
      useIntegrationStore.getState().addEvent(makeEvent());
      useIntegrationStore.getState().addError({
        code: "ERR",
        message: "x",
        source: IntegrationSource.OBS,
        timestamp: new Date(),
      });

      useIntegrationStore.getState().reset();

      const state = useIntegrationStore.getState();
      expect(state.websocket.connected).toBe(false);
      expect(state.events).toHaveLength(0);
      expect(state.errors).toHaveLength(0);
    });
  });
});
