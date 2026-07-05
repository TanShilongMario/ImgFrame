import { getTemplateById } from "../templates/registry";
import type { MediaAsset, Project } from "../types";
import { canvasToBlob, loadMediaSource } from "./canvasUtils";
import { renderProjectFrame } from "./renderProjectFrame";

export type ExportImageOptions = {
  format?: "png" | "jpeg";
  scale?: number;
  quality?: number;
};

export async function exportProjectImage(
  project: Project,
  mediaAsset: MediaAsset,
  mediaUrl: string,
  options: ExportImageOptions = {}
): Promise<Blob> {
  const { format = "png", scale = 1, quality = 0.92 } = options;
  const media = await loadMediaSource(mediaAsset, mediaUrl);
  const canvas = renderProjectFrame(project, media, scale, format);

  return canvasToBlob(canvas, format, quality);
}
