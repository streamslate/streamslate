import streamDeck from "@elgato/streamdeck";

import { streamSlateClient } from "./client/streamslate-client.js";
import { GoToPageAction } from "./actions/go-to-page.js";
import { HealthCheckAction } from "./actions/health-check.js";
import { NextPageAction } from "./actions/next-page.js";
import { PreviousPageAction } from "./actions/previous-page.js";
import { RefreshStateAction } from "./actions/refresh-state.js";
import { StreamSlateActionRegistry } from "./actions/registry.js";
import { SetZoomAction } from "./actions/set-zoom.js";
import { TogglePresenterAction } from "./actions/toggle-presenter.js";

const registry = new StreamSlateActionRegistry(streamSlateClient);

streamDeck.actions.registerAction(
  new NextPageAction(streamSlateClient, registry)
);
streamDeck.actions.registerAction(
  new PreviousPageAction(streamSlateClient, registry)
);
streamDeck.actions.registerAction(
  new TogglePresenterAction(streamSlateClient, registry)
);
streamDeck.actions.registerAction(
  new GoToPageAction(streamSlateClient, registry)
);
streamDeck.actions.registerAction(
  new SetZoomAction(streamSlateClient, registry)
);
streamDeck.actions.registerAction(
  new RefreshStateAction(streamSlateClient, registry)
);
streamDeck.actions.registerAction(
  new HealthCheckAction(streamSlateClient, registry)
);

streamSlateClient.on("error", (error) => {
  streamDeck.logger.warn(`StreamSlate WebSocket error: ${error.message}`);
});

streamSlateClient.connect();
await streamDeck.connect();
