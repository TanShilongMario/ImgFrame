import type { MediaAsset } from "../types";
import { cssPx } from "../utils/cssPx";

export { cssPx };

export type LoadedMedia = {
  source: CanvasImageSource;
  width: number;
  height: number;
};

function getSourceSize(source: CanvasImageSource): { width: number; height: number } {
  if (source instanceof HTMLVideoElement) {
    return { width: source.videoWidth, height: source.videoHeight };
  }

  if (source instanceof HTMLImageElement) {
    return { width: source.naturalWidth, height: source.naturalHeight };
  }

  if (source instanceof HTMLCanvasElement) {
    return { width: source.width, height: source.height };
  }

  const bitmap = source as ImageBitmap;
  return { width: bitmap.width, height: bitmap.height };
}

export async function loadVideoElement(objectUrl: string): Promise<HTMLVideoElement> {
  const video = document.createElement("video");
  video.playsInline = true;
  video.preload = "auto";
  video.src = objectUrl;

  await new Promise<void>((resolve, reject) => {
    video.onloadeddata = () => resolve();
    video.onerror = () => reject(new Error("无法加载视频。"));
  });

  return video;
}

export function createLoadedMediaFromVideo(video: HTMLVideoElement): LoadedMedia {
  return {
    source: video,
    width: video.videoWidth,
    height: video.videoHeight
  };
}

export function waitForVideoSeek(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve) => {
    video.onseeked = () => resolve();
  });
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("无法加载图片资源。"));
    image.src = url;
  });
}

export async function loadMediaSource(asset: MediaAsset, objectUrl: string): Promise<LoadedMedia> {
  if (asset.type === "image") {
    const image = await loadHtmlImage(objectUrl);
    return {
      source: image,
      width: asset.width ?? image.naturalWidth,
      height: asset.height ?? image.naturalHeight
    };
  }

  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.src = objectUrl;

  await new Promise<void>((resolve, reject) => {
    video.onloadeddata = () => resolve();
    video.onerror = () => reject(new Error("无法读取视频帧。"));
  });

  video.currentTime = 0;
  await new Promise<void>((resolve) => {
    video.onseeked = () => resolve();
  });

  const frameCanvas = document.createElement("canvas");
  frameCanvas.width = video.videoWidth;
  frameCanvas.height = video.videoHeight;
  const frameContext = frameCanvas.getContext("2d");
  if (!frameContext) {
    throw new Error("无法创建导出画布。");
  }

  frameContext.drawImage(video, 0, 0);
  const image = await loadHtmlImage(frameCanvas.toDataURL("image/png"));

  return {
    source: image,
    width: video.videoWidth,
    height: video.videoHeight
  };
}

export function drawCoverImage(
  context: CanvasRenderingContext2D,
  source: CanvasImageSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  focalY = 0.42
) {
  const { width: sourceWidth, height: sourceHeight } = getSourceSize(source);
  const sourceRatio = sourceWidth / sourceHeight;
  const destRatio = dw / dh;

  let cropWidth: number;
  let cropHeight: number;
  let sx: number;
  let sy: number;

  if (sourceRatio > destRatio) {
    cropHeight = sourceHeight;
    cropWidth = cropHeight * destRatio;
    sx = (sourceWidth - cropWidth) / 2;
    sy = Math.max(0, Math.min(sourceHeight - cropHeight, sourceHeight * focalY - cropHeight * focalY));
  } else {
    cropWidth = sourceWidth;
    cropHeight = cropWidth / destRatio;
    sx = (sourceWidth - cropWidth) / 2;
    sy = Math.max(0, Math.min(sourceHeight - cropHeight, sourceHeight * focalY - cropHeight * focalY));
  }

  context.drawImage(source, sx, sy, cropWidth, cropHeight, dx, dy, dw, dh);
}

export function createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("无法创建导出画布。");
  }

  return { canvas, context };
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: "png" | "jpeg",
  quality = 0.92
): Promise<Blob> {
  const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("导出图片失败。"));
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

export function sanitizeFilename(name: string): string {
  return name.trim().replace(/[\\/:*?"<>|]+/g, "-").slice(0, 64) || "frameforge-export";
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
