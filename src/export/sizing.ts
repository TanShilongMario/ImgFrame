import type { LoadedMedia } from "./canvasUtils";

/** 默认导出长边目标（2K） */
export const EXPORT_LONG_EDGE = 2048;

export function resolveExportLongEdge(media: LoadedMedia): number {
  const sourceLongEdge = Math.max(media.width, media.height, 1);
  return Math.min(EXPORT_LONG_EDGE, sourceLongEdge);
}

export function resolveExportDimensions(
  ratioNumber: number,
  media: LoadedMedia,
  scale = 1
): { width: number; height: number } {
  const longEdge = resolveExportLongEdge(media) * scale;
  let width: number;
  let height: number;

  if (ratioNumber >= 1) {
    width = longEdge;
    height = Math.round(longEdge / ratioNumber);
  } else {
    height = longEdge;
    width = Math.round(longEdge * ratioNumber);
  }

  return { width, height };
}
