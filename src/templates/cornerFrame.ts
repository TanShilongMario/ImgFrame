import type { BandColorChoice, CornerFrameConfig, CornerTextAnchor, GlassTextTone, RefinedCanvasRatio } from "../types";
import { getGlassTextColors } from "./glassFrame";

export const CORNER_FRAME_LIMITS = {
  outerMargin: { min: 6, max: 18 },
  mediaRadius: { min: 0, max: 48 },
  borderWidth: { min: 0, max: 12 },
  subtitleSize: { min: 10, max: 28 },
  titleSize: { min: 18, max: 48 }
} as const;

export const CORNER_DEFAULTS = {
  outerMargin: 10,
  mediaRadius: 20,
  borderWidth: 4,
  subtitleSize: 14,
  titleSize: 28,
  textCorner: "bottom-left" as CornerTextAnchor,
  textTone: "black" as GlassTextTone,
  backingColor: "sand" as BandColorChoice
};

/** 固定轻微外阴影（不暴露给用户） */
export const CORNER_IMAGE_SHADOW = {
  blur: 28,
  offsetY: 10,
  opacity: 0.14
} as const;

export const CORNER_TEXT_ANCHOR_OPTIONS: { value: CornerTextAnchor; label: string }[] = [
  { value: "top-left", label: "左上" },
  { value: "top-right", label: "右上" },
  { value: "bottom-left", label: "左下" },
  { value: "bottom-right", label: "右下" }
];

const ratioNumberMap: Record<RefinedCanvasRatio, number> = {
  "1:1": 1,
  "4:5": 4 / 5,
  "4:3": 4 / 3,
  "3:4": 3 / 4,
  "9:16": 9 / 16,
  "16:9": 16 / 9,
  auto: 3 / 4
};

function clampValue(value: number, range: { min: number; max: number }): number {
  return Math.min(Math.max(value, range.min), range.max);
}

function isCornerTextAnchor(value: unknown): value is CornerTextAnchor {
  return (
    value === "top-left" ||
    value === "top-right" ||
    value === "bottom-left" ||
    value === "bottom-right"
  );
}

function isGlassTextTone(value: unknown): value is GlassTextTone {
  return value === "white" || value === "black" || value === "gray";
}

export function clampCornerFrame(frame: CornerFrameConfig): CornerFrameConfig {
  return {
    ...frame,
    canvasRatio: frame.canvasRatio ?? "auto",
    outerMargin: clampValue(frame.outerMargin ?? CORNER_DEFAULTS.outerMargin, CORNER_FRAME_LIMITS.outerMargin),
    mediaRadius: clampValue(frame.mediaRadius ?? CORNER_DEFAULTS.mediaRadius, CORNER_FRAME_LIMITS.mediaRadius),
    borderWidth: clampValue(frame.borderWidth ?? CORNER_DEFAULTS.borderWidth, CORNER_FRAME_LIMITS.borderWidth),
    subtitleSize: clampValue(frame.subtitleSize ?? CORNER_DEFAULTS.subtitleSize, CORNER_FRAME_LIMITS.subtitleSize),
    titleSize: clampValue(frame.titleSize ?? CORNER_DEFAULTS.titleSize, CORNER_FRAME_LIMITS.titleSize),
    textCorner: isCornerTextAnchor(frame.textCorner) ? frame.textCorner : CORNER_DEFAULTS.textCorner,
    textTone: isGlassTextTone(frame.textTone) ? frame.textTone : CORNER_DEFAULTS.textTone,
    backingColor: frame.backingColor ?? CORNER_DEFAULTS.backingColor,
    systemBackingHex: frame.systemBackingHex
  };
}

export function resolveCornerRatioNumber(
  frame: CornerFrameConfig,
  mediaWidth: number,
  mediaHeight: number
): number {
  if (frame.canvasRatio === "auto") {
    return mediaWidth / mediaHeight;
  }

  return ratioNumberMap[frame.canvasRatio];
}

export function getCornerMediaRadiusPx(radius: number, canvasWidth: number): number {
  return Math.round(radius * (canvasWidth / 720));
}

export function getCornerTextColors(tone: GlassTextTone): { title: string; subtitle: string } {
  return getGlassTextColors(tone);
}

export type CornerLayoutPx = {
  cardX: number;
  cardY: number;
  cardW: number;
  cardH: number;
  mediaRadius: number;
  borderPx: number;
  textPadX: number;
  textPadY: number;
};

export function getCornerLayoutPx(frame: CornerFrameConfig, canvasWidth: number, canvasHeight: number): CornerLayoutPx {
  const normalized = clampCornerFrame(frame);
  // 等比内缩：四边按同一比例缩小卡片，保持与画布相同宽高比，避免改外边缘时改变图像裁切
  const insetRatio = normalized.outerMargin / 100;
  const cardW = canvasWidth * (1 - insetRatio * 2);
  const cardH = canvasHeight * (1 - insetRatio * 2);
  const cardX = (canvasWidth - cardW) / 2;
  const cardY = (canvasHeight - cardH) / 2;
  const borderPx = Math.round(normalized.borderWidth * (canvasWidth / 720));
  // 文字贴画布四角，不随外边缘变化
  const textPadX = Math.max(Math.round(canvasWidth * 0.035), 14);
  const textPadY = Math.max(Math.round(canvasHeight * 0.03), 12);

  return {
    cardX,
    cardY,
    cardW: Math.max(0, cardW),
    cardH: Math.max(0, cardH),
    mediaRadius: getCornerMediaRadiusPx(normalized.mediaRadius, canvasWidth),
    borderPx,
    textPadX,
    textPadY
  };
}
