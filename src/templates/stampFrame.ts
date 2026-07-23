import type { RefinedCanvasRatio, StampFrameConfig } from "../types";

export const STAMP_FRAME_LIMITS = {
  stampSize: { min: 24, max: 52 },
  stampPadding: { min: 4, max: 12 },
  perforationSize: { min: 4, max: 14 },
  captionSize: { min: 10, max: 24 }
} as const;

export const STAMP_DEFAULTS: StampFrameConfig = {
  canvasRatio: "3:4",
  stampSize: 34,
  stampPadding: 6,
  perforationSize: 8,
  seed: 42,
  captionSize: 15
};

export function clampStampFrame(frame: StampFrameConfig): StampFrameConfig {
  return {
    canvasRatio: frame.canvasRatio ?? STAMP_DEFAULTS.canvasRatio,
    stampSize: Math.min(
      Math.max(frame.stampSize ?? STAMP_DEFAULTS.stampSize, STAMP_FRAME_LIMITS.stampSize.min),
      STAMP_FRAME_LIMITS.stampSize.max
    ),
    stampPadding: Math.min(
      Math.max(frame.stampPadding ?? STAMP_DEFAULTS.stampPadding, STAMP_FRAME_LIMITS.stampPadding.min),
      STAMP_FRAME_LIMITS.stampPadding.max
    ),
    perforationSize: Math.min(
      Math.max(frame.perforationSize ?? STAMP_DEFAULTS.perforationSize, STAMP_FRAME_LIMITS.perforationSize.min),
      STAMP_FRAME_LIMITS.perforationSize.max
    ),
    seed: Math.max(0, Math.round(frame.seed ?? STAMP_DEFAULTS.seed)),
    captionSize: Math.min(
      Math.max(frame.captionSize ?? STAMP_DEFAULTS.captionSize, STAMP_FRAME_LIMITS.captionSize.min),
      STAMP_FRAME_LIMITS.captionSize.max
    )
  };
}

export function getStampRotation(seed: number): number {
  const normalized = Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % 1;
  return -15 + normalized * 30;
}

export function formatStampDate(date = new Date()): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} · ${hour}:${minute}`;
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

export function resolveStampRatioNumber(frame: StampFrameConfig, mediaWidth: number, mediaHeight: number): number {
  return frame.canvasRatio === "auto" ? mediaWidth / mediaHeight : ratioNumberMap[frame.canvasRatio];
}
