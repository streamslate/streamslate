import { action } from "@elgato/streamdeck";

import type { StreamSlateClient } from "../client/streamslate-client.js";
import { ACTION_UUIDS } from "./ids.js";
import type { StreamSlateActionRegistry } from "./registry.js";
import { StreamSlateKeyAction } from "./base.js";

@action({ UUID: ACTION_UUIDS.togglePresenter })
export class TogglePresenterAction extends StreamSlateKeyAction {
  protected readonly uuid = ACTION_UUIDS.togglePresenter;

  constructor(client: StreamSlateClient, registry: StreamSlateActionRegistry) {
    super(client, registry);
  }
}
