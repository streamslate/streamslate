export const ACTION_UUIDS = {
  nextPage: "ai.flexinfer.streamslate.next-page",
  previousPage: "ai.flexinfer.streamslate.previous-page",
  togglePresenter: "ai.flexinfer.streamslate.toggle-presenter",
  goToPage: "ai.flexinfer.streamslate.go-to-page",
  setZoom: "ai.flexinfer.streamslate.set-zoom",
} as const;

export type StreamSlateActionUuid =
  (typeof ACTION_UUIDS)[keyof typeof ACTION_UUIDS];
