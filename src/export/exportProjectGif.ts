import { GIFEncoder, quantize, applyPalette } from "gifenc";
import type { MediaAsset, Project } from "../types";
import { decodeGifBlob, isAnimatedGifBlob, isGifMedia, type DecodedGifFrame } from "../media/decodeGif";
import { renderProjectFrame } from "./renderProjectFrame";
import type { LoadedMedia } from "./canvasUtils";

export const GIF_MAX_BYTES = 10 * 1024 * 1024;

export type ExportGifOptions = {
  maxBytes?: number;
  onProgress?: (progress: number, label?: string) => void;
};

export type ExportGifResult = {
  blob: Blob;
  mimeType: "image/gif";
  extension: "gif";
  byteSize: number;
  frameCount: number;
  longEdge: number;
  colors: number;
};

type EncodePreset = {
  longEdge: number;
  colors: number;
  maxFrames: number;
};

const ENCODE_PRESETS: EncodePreset[] = [
  { longEdge: 720, colors: 128, maxFrames: 80 },
  { longEdge: 640, colors: 96, maxFrames: 64 },
  { longEdge: 540, colors: 64, maxFrames: 48 },
  { longEdge: 420, colors: 48, maxFrames: 36 },
  { longEdge: 320, colors: 32, maxFrames: 28 }
];

export async function shouldExportAsGif(asset: MediaAsset): Promise<boolean> {
  if (!isGifMedia(asset)) {
    return false;
  }

  return isAnimatedGifBlob(asset.blob);
}

export async function exportProjectGif(
  project: Project,
  mediaAsset: MediaAsset,
  _mediaUrl: string,
  options: ExportGifOptions = {}
): Promise<ExportGifResult> {
  const maxBytes = options.maxBytes ?? GIF_MAX_BYTES;
  const onProgress = options.onProgress;

  if (!(await shouldExportAsGif(mediaAsset))) {
    throw new Error("当前素材不是可导出的动态 GIF。");
  }

  onProgress?.(0.05, "正在解析 GIF 帧...");
  const decoded = await decodeGifBlob(mediaAsset.blob);
  if (decoded.frames.length === 0) {
    throw new Error("GIF 没有可用帧。");
  }

  let lastError: Error | undefined;

  for (let presetIndex = 0; presetIndex < ENCODE_PRESETS.length; presetIndex += 1) {
    const preset = ENCODE_PRESETS[presetIndex];
    const progressBase = 0.1 + (presetIndex / ENCODE_PRESETS.length) * 0.85;
    onProgress?.(progressBase, `正在导出 GIF（${preset.longEdge}px / ${preset.colors}色）...`);

    try {
      const sampled = sampleFrames(decoded.frames, preset.maxFrames);
      const blob = await encodeFramedGif(project, sampled, preset, (ratio) => {
        onProgress?.(progressBase + ratio * (0.85 / ENCODE_PRESETS.length));
      });

      if (blob.size <= maxBytes) {
        onProgress?.(1, "GIF 导出完成");
        return {
          blob,
          mimeType: "image/gif",
          extension: "gif",
          byteSize: blob.size,
          frameCount: sampled.length,
          longEdge: preset.longEdge,
          colors: preset.colors
        };
      }

      lastError = new Error(
        `导出体积 ${(blob.size / (1024 * 1024)).toFixed(1)}MB，超过 ${maxBytes / (1024 * 1024)}MB 限制。`
      );
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("GIF 导出失败。");
    }
  }

  throw lastError ?? new Error("无法将 GIF 控制在 10MB 以内，请尝试更短的动图。");
}

function sampleFrames(frames: DecodedGifFrame[], maxFrames: number): DecodedGifFrame[] {
  if (frames.length <= maxFrames) {
    return frames;
  }

  const sampled: DecodedGifFrame[] = [];
  const step = frames.length / maxFrames;

  for (let index = 0; index < maxFrames; index += 1) {
    const sourceIndex = Math.min(frames.length - 1, Math.floor(index * step));
    const current = frames[sourceIndex];
    const nextSource = Math.min(frames.length - 1, Math.floor((index + 1) * step));
    let delayMs = 0;
    for (let cursor = sourceIndex; cursor < nextSource; cursor += 1) {
      delayMs += frames[cursor].delayMs;
    }
    if (delayMs <= 0) {
      delayMs = current.delayMs;
    }

    sampled.push({
      canvas: current.canvas,
      delayMs: Math.max(20, Math.min(delayMs, 500))
    });
  }

  return sampled;
}

function resolveScaleForLongEdge(probeWidth: number, probeHeight: number, longEdge: number): number {
  const sourceLongEdge = Math.max(probeWidth, probeHeight, 1);
  if (sourceLongEdge <= longEdge) {
    return 1;
  }

  return longEdge / sourceLongEdge;
}

async function encodeFramedGif(
  project: Project,
  frames: DecodedGifFrame[],
  preset: EncodePreset,
  onFrameProgress?: (ratio: number) => void
): Promise<Blob> {
  const firstMedia: LoadedMedia = {
    source: frames[0].canvas,
    width: frames[0].canvas.width,
    height: frames[0].canvas.height
  };
  const probe = renderProjectFrame(project, firstMedia, 1, "png");
  const scale = resolveScaleForLongEdge(probe.width, probe.height, preset.longEdge);

  const gif = GIFEncoder();
  let width = 0;
  let height = 0;

  for (let index = 0; index < frames.length; index += 1) {
    const frame = frames[index];
    const media: LoadedMedia = {
      source: frame.canvas,
      width: frame.canvas.width,
      height: frame.canvas.height
    };
    const rendered = renderProjectFrame(project, media, scale, "png");
    width = rendered.width;
    height = rendered.height;

    const context = rendered.getContext("2d");
    if (!context) {
      throw new Error("无法读取导出帧像素。");
    }

    const imageData = context.getImageData(0, 0, width, height);
    const rgba = new Uint8Array(imageData.data.buffer.slice(0));
    const palette = quantize(rgba, preset.colors);
    const indexPixels = applyPalette(rgba, palette);

    gif.writeFrame(indexPixels, width, height, {
      palette,
      delay: frame.delayMs,
      repeat: index === 0 ? 0 : undefined
    });

    onFrameProgress?.((index + 1) / frames.length);

    // 让出主线程，避免长 GIF 卡死 UI
    if (index % 4 === 3) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  gif.finish();
  const gifBytes = gif.bytes();
  const copy = new Uint8Array(gifBytes.byteLength);
  copy.set(gifBytes);
  return new Blob([copy], { type: "image/gif" });
}
