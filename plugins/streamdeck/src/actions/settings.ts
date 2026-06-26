export interface StreamSlateActionSettings {
  page?: unknown;
  zoom?: unknown;
}

export const normalizePage = (value: unknown): number => {
  const page = typeof value === "number" ? value : Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

export const normalizeZoom = (value: unknown): number => {
  const zoom = typeof value === "number" ? value : Number(value);
  return Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
};
