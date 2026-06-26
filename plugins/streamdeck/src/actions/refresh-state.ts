import { action, type KeyAction } from "@elgato/streamdeck";

import type { StreamSlateClient } from "../client/streamslate-client.js";
import { ACTION_UUIDS } from "./ids.js";
import type { StreamSlateActionRegistry } from "./registry.js";
import { StreamSlateKeyAction } from "./base.js";

@action({ UUID: ACTION_UUIDS.refreshState })
export class RefreshStateAction extends StreamSlateKeyAction {
  protected readonly uuid = ACTION_UUIDS.refreshState;

  constructor(client: StreamSlateClient, registry: StreamSlateActionRegistry) {
    super(client, registry);
  }

  protected override async afterSuccessfulSend(
    action: KeyAction
  ): Promise<void> {
    await action.showOk();
  }
}
