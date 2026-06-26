import type { KeyAction } from "@elgato/streamdeck";

import {
  type StreamSlateClient,
} from "../client/streamslate-client.js";
import { ACTION_UUIDS, type StreamSlateActionUuid } from "./ids.js";
import { titleForAction } from "./mapping.js";
import type { StreamSlateActionSettings } from "./settings.js";

interface VisibleAction {
  action: KeyAction;
  uuid: StreamSlateActionUuid;
  settings: StreamSlateActionSettings;
}

export class StreamSlateActionRegistry {
  private readonly visibleActions = new Map<string, VisibleAction>();

  constructor(private readonly client: StreamSlateClient) {
    this.client.on("status", () => void this.refreshAll());
    this.client.on("state", () => void this.refreshAll());
  }

  register(
    uuid: StreamSlateActionUuid,
    action: KeyAction,
    settings: StreamSlateActionSettings,
  ): void {
    this.visibleActions.set(action.id, { action, uuid, settings });
    void this.refresh(action.id);
  }

  updateSettings(action: KeyAction, settings: StreamSlateActionSettings): void {
    const visible = this.visibleActions.get(action.id);
    if (visible === undefined) {
      return;
    }

    visible.settings = settings;
    void this.refresh(action.id);
  }

  unregister(actionId: string): void {
    this.visibleActions.delete(actionId);
  }

  private async refreshAll(): Promise<void> {
    await Promise.all([...this.visibleActions.keys()].map((id) => this.refresh(id)));
  }

  private async refresh(actionId: string): Promise<void> {
    const visible = this.visibleActions.get(actionId);
    if (visible === undefined) {
      return;
    }

    const connected = this.client.connectionStatus === "connected";
    const state = this.client.state;
    await visible.action.setTitle(
      titleForAction(visible.uuid, visible.settings, state, connected),
    );

    if (visible.uuid === ACTION_UUIDS.togglePresenter) {
      await visible.action.setState(state.presenter_active ? 1 : 0);
    }
  }
}
