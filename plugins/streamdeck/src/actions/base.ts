import {
  type DidReceiveSettingsEvent,
  type KeyAction,
  type KeyDownEvent,
  SingletonAction,
  type WillAppearEvent,
  type WillDisappearEvent,
} from "@elgato/streamdeck";

import type { StreamSlateClient } from "../client/streamslate-client.js";
import { commandForAction } from "./mapping.js";
import type { StreamSlateActionRegistry } from "./registry.js";
import type { StreamSlateActionSettings } from "./settings.js";
import type { StreamSlateActionUuid } from "./ids.js";

export abstract class StreamSlateKeyAction extends SingletonAction {
  protected abstract readonly uuid: StreamSlateActionUuid;

  constructor(
    protected readonly client: StreamSlateClient,
    private readonly registry: StreamSlateActionRegistry
  ) {
    super();
  }

  override onWillAppear(ev: WillAppearEvent): void {
    if (ev.action.isKey()) {
      this.registry.register(
        this.uuid,
        ev.action,
        ev.payload.settings as StreamSlateActionSettings
      );
    }
  }

  override onWillDisappear(ev: WillDisappearEvent): void {
    this.registry.unregister(ev.action.id);
  }

  override onDidReceiveSettings(ev: DidReceiveSettingsEvent): void {
    if (ev.action.isKey()) {
      this.registry.updateSettings(
        ev.action,
        ev.payload.settings as StreamSlateActionSettings
      );
    }
  }

  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    const binding = commandForAction(
      this.uuid,
      ev.payload.settings as StreamSlateActionSettings
    );
    const result = this.client.send(binding.type, binding.payload);

    if (result.sent) {
      await this.afterSuccessfulSend(ev.action);
      return;
    }

    await ev.action.showAlert();
  }

  protected async afterSuccessfulSend(action: KeyAction): Promise<void> {
    await action.showOk();
    this.client.refreshState();
  }
}
