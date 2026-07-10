import type { FlutedFrameConfig, RefinedCanvasRatio } from "../types";

export const FLUTED_FRAME_LIMITS = {
  windowMargin: { min: 10, max: 28 },
  innerRadius: { min: 0, max: 64 },
  borderWidth: { min: 2, max: 12 }
} as const;

/** 底层模糊强度（@720 参考宽，不暴露给用户） */
export const FLUTED_BACKGROUND_BLUR = 18;

/** 长虹 Shader 固定参数（约 8–10 条直纹） */
export const FLUTED_SHADER_DEFAULTS = {
  shape: 1 as const,
  size: 0.96,
  distortion: 0.72,
  shadows: 0.3,
  highlights: 0.06,
  angle: 0
};

export const FLUTED_DEFAULTS = {
  windowMargin: 16,
  innerRadius: 20,
  borderWidth: 4,
  seed: 42
};

function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) {
    state += 2147483646;
  }

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function clampFlutedFrame(frame: FlutedFrameConfig): FlutedFrameConfig {
  return {
    ...frame,
    canvasRatio: frame.canvasRatio ?? "auto",
    windowMargin: Math.min(
      Math.max(frame.windowMargin ?? FLUTED_DEFAULTS.windowMargin, FLUTED_FRAME_LIMITS.windowMargin.min),
      FLUTED_FRAME_LIMITS.windowMargin.max
    ),
    innerRadius: Math.min(
      Math.max(frame.innerRadius ?? FLUTED_DEFAULTS.innerRadius, FLUTED_FRAME_LIMITS.innerRadius.min),
      FLUTED_FRAME_LIMITS.innerRadius.max
    ),
    borderWidth: Math.min(
      Math.max(frame.borderWidth ?? FLUTED_DEFAULTS.borderWidth, FLUTED_FRAME_LIMITS.borderWidth.min),
      FLUTED_FRAME_LIMITS.borderWidth.max
    ),
    seed: Math.max(0, Math.round(frame.seed ?? FLUTED_DEFAULTS.seed))
  };
}

export type FlutedLayoutPx = {
  innerX: number;
  innerY: number;
  innerW: number;
  innerH: number;
  innerRadius: number;
};

export function getFlutedLayoutPx(frame: FlutedFrameConfig, canvasWidth: number, canvasHeight: number): FlutedLayoutPx {
  const normalized = clampFlutedFrame(frame);
  const marginX = (canvasWidth * normalized.windowMargin) / 100;
  const marginY = (canvasHeight * normalized.windowMargin) / 100;
  const innerRadius = Math.round(normalized.innerRadius * (canvasWidth / 720));

  return {
    innerX: marginX,
    innerY: marginY,
    innerW: canvasWidth - marginX * 2,
    innerH: canvasHeight - marginY * 2,
    innerRadius
  };
}

import type { FlutedShaderUniforms } from "../webgl/flutedShader";

export function deriveFlutedShaderUniformsFromSeed(seed: number): FlutedShaderUniforms {
  const rand = seededRandom(seed);

  return {
    shape: 1,
    size: 0.82 + rand() * 0.16,
    distortion: 0.52 + rand() * 0.38,
    shadows: 0.18 + rand() * 0.28,
    highlights: 0.03 + rand() * 0.09,
    angle: 0,
    time: 0
  };
}

const ratioNumberMap: Record<RefinedCanvasRatio, number> = {
  "1:1": 1,
  "4:5": 4 / 5,
  "4:3": 4 / 3,
  "3:4": 3 / 4,
  "9:16": 9 / 16,
  "16:9": 16 / 9,
  auto: 3 / 4
};

export function resolveFlutedRatioNumber(frame: FlutedFrameConfig, mediaWidth: number, mediaHeight: number): number {
  if (frame.canvasRatio === "auto") {
    return mediaWidth / mediaHeight;
  }

  return ratioNumberMap[frame.canvasRatio];
}
