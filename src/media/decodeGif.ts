import { parseGIF, decompressFrames, type ParsedFrame } from "gifuct-js";
import type { MediaAsset } from "../types";

export type DecodedGifFrame = {
  /** 完整合成后的画布（已处理 disposal） */
  canvas: HTMLCanvasElement;
  /** 帧延迟（毫秒） */
  delayMs: number;
};

export type DecodedGif = {
  width: number;
  height: number;
  frames: DecodedGifFrame[];
  durationMs: number;
};

export function isGifMedia(asset: Pick<MediaAsset, "mimeType" | "name">): boolean {
  if (asset.mimeType === "image/gif") {
    return true;
  }

  return /\.gif$/i.test(asset.name);
}

export async function isAnimatedGifBlob(blob: Blob): Promise<boolean> {
  if (blob.type && blob.type !== "image/gif" && !blob.type.includes("gif")) {
    // 部分环境 MIME 为空，继续尝试解析
    if (blob.type.startsWith("image/") && blob.type !== "image/gif") {
      return false;
    }
  }

  try {
    const buffer = await blob.arrayBuffer();
    const parsed = parseGIF(buffer);
    const frames = decompressFrames(parsed, true);
    return frames.length > 1;
  } catch {
    return false;
  }
}

export async function decodeGifBlob(blob: Blob): Promise<DecodedGif> {
  const buffer = await blob.arrayBuffer();
  const parsed = parseGIF(buffer);
  const rawFrames = decompressFrames(parsed, true);
  if (rawFrames.length === 0) {
    throw new Error("无法解析 GIF 帧。");
  }

  const width = parsed.lsd.width;
  const height = parsed.lsd.height;
  const frames = compositeGifFrames(rawFrames, width, height);
  const durationMs = frames.reduce((sum, frame) => sum + frame.delayMs, 0);

  return { width, height, frames, durationMs };
}

function compositeGifFrames(rawFrames: ParsedFrame[], width: number, height: number): DecodedGifFrame[] {
  const fullCanvas = document.createElement("canvas");
  fullCanvas.width = width;
  fullCanvas.height = height;
  const fullContext = fullCanvas.getContext("2d");
  if (!fullContext) {
    throw new Error("无法创建 GIF 合成画布。");
  }

  const patchCanvas = document.createElement("canvas");
  const patchContext = patchCanvas.getContext("2d");
  if (!patchContext) {
    throw new Error("无法创建 GIF 补丁画布。");
  }

  const frames: DecodedGifFrame[] = [];
  let previousImageData: ImageData | null = null;

  for (const frame of rawFrames) {
    const { left, top, width: frameWidth, height: frameHeight } = frame.dims;
    const delayMs = Math.max(20, frame.delay || 100);

    if (frame.disposalType === 3) {
      previousImageData = fullContext.getImageData(0, 0, width, height);
    }

    patchCanvas.width = frameWidth;
    patchCanvas.height = frameHeight;
    const patchData = patchContext.createImageData(frameWidth, frameHeight);
    patchData.data.set(frame.patch);
    patchContext.putImageData(patchData, 0, 0);
    fullContext.drawImage(patchCanvas, left, top);

    const snapshot = document.createElement("canvas");
    snapshot.width = width;
    snapshot.height = height;
    const snapshotContext = snapshot.getContext("2d");
    if (!snapshotContext) {
      throw new Error("无法创建 GIF 帧快照。");
    }
    snapshotContext.drawImage(fullCanvas, 0, 0);
    frames.push({ canvas: snapshot, delayMs });

    if (frame.disposalType === 2) {
      fullContext.clearRect(left, top, frameWidth, frameHeight);
    } else if (frame.disposalType === 3 && previousImageData) {
      fullContext.putImageData(previousImageData, 0, 0);
      previousImageData = null;
    }
  }

  return frames;
}
