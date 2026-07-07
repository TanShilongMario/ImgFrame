import type { Rgb } from "./bandFrame";
import { rgbToHex, rgbToHsl } from "./bandFrame";
import type { SwatchFrameConfig, RefinedCanvasRatio } from "../types";

export const SWATCH_FRAME_LIMITS = {
  windowMargin: { min: 10, max: 28 },
  innerRadius: { min: 0, max: 64 },
  borderWidth: { min: 2, max: 12 },
  segmentCount: { min: 3, max: 6 }
} as const;

export const SWATCH_DEFAULTS = {
  windowMargin: 16,
  innerRadius: 20,
  borderWidth: 4,
  segmentCount: 4,
  seed: 42
};

const MATERIAL_TONE_FALLBACK: Rgb = { r: 180, g: 176, b: 168 };

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

function getCanvasImageSourceSize(source: CanvasImageSource): { width: number; height: number } {
  if (source instanceof HTMLImageElement) {
    return { width: source.naturalWidth, height: source.naturalHeight };
  }

  if (source instanceof HTMLVideoElement) {
    return { width: source.videoWidth, height: source.videoHeight };
  }

  if (source instanceof HTMLCanvasElement) {
    return { width: source.width, height: source.height };
  }

  if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) {
    return { width: source.width, height: source.height };
  }

  return { width: 0, height: 0 };
}

function samplePatchAverage(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  normalizedX: number,
  normalizedY: number,
  patchSize: number
): Rgb {
  const centerX = Math.round(normalizedX * canvasWidth);
  const centerY = Math.round(normalizedY * canvasHeight);
  const x = Math.max(0, Math.min(canvasWidth - patchSize, centerX - Math.floor(patchSize / 2)));
  const y = Math.max(0, Math.min(canvasHeight - patchSize, centerY - Math.floor(patchSize / 2)));
  const { data } = context.getImageData(x, y, patchSize, patchSize);

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count += 1;
  }

  if (count === 0) {
    return MATERIAL_TONE_FALLBACK;
  }

  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count)
  };
}

type SwatchCandidate = {
  rgb: Rgb;
  luminance: number;
  hue: number;
  saturation: number;
  chroma: number;
};

function computeLuminance({ r, g, b }: Rgb): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function computeChroma({ r, g, b }: Rgb): number {
  return Math.max(r, g, b) - Math.min(r, g, b);
}

function colorDistance(a: Rgb, b: Rgb): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function toCandidate(rgb: Rgb): SwatchCandidate {
  const { h, s } = rgbToHsl(rgb);
  return {
    rgb,
    luminance: computeLuminance(rgb),
    hue: h,
    saturation: s,
    chroma: computeChroma(rgb)
  };
}

function buildCandidatePool(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  patchSize: number,
  seed: number
): SwatchCandidate[] {
  const gridSteps = 7;
  const points: Array<[number, number]> = [];

  for (let row = 0; row < gridSteps; row += 1) {
    for (let col = 0; col < gridSteps; col += 1) {
      const normalizedX = 0.08 + (col / (gridSteps - 1)) * 0.84;
      const normalizedY = 0.08 + (row / (gridSteps - 1)) * 0.84;
      points.push([normalizedX, normalizedY]);
    }
  }

  const rand = seededRandom(seed + 7919);
  for (let index = 0; index < 14; index += 1) {
    points.push([0.06 + rand() * 0.88, 0.06 + rand() * 0.88]);
  }

  const merged: SwatchCandidate[] = [];
  for (const [normalizedX, normalizedY] of points) {
    const rgb = samplePatchAverage(context, canvasWidth, canvasHeight, normalizedX, normalizedY, patchSize);
    const candidate = toCandidate(rgb);
    const duplicate = merged.find((item) => colorDistance(item.rgb, candidate.rgb) < 14);
    if (!duplicate || candidate.chroma > duplicate.chroma) {
      if (duplicate) {
        const duplicateIndex = merged.indexOf(duplicate);
        merged[duplicateIndex] = candidate;
      } else {
        merged.push(candidate);
      }
    }
  }

  return merged;
}

function hueDistance(a: number, b: number): number {
  const delta = Math.abs(a - b) % 360;
  return Math.min(delta, 360 - delta);
}

function pickDiverseSwatchColors(candidates: SwatchCandidate[], segmentCount: number, seed: number): string[] {
  if (candidates.length === 0) {
    return Array.from({ length: segmentCount }, () => rgbToHex(MATERIAL_TONE_FALLBACK).toUpperCase());
  }

  const pool = [...candidates];
  const rand = seededRandom(seed);
  const selected: SwatchCandidate[] = [];
  const used = new Set<number>();

  const luminances = pool.map((item) => item.luminance);
  const minLuminance = Math.min(...luminances);
  const maxLuminance = Math.max(...luminances);
  const luminanceRange = maxLuminance - minLuminance;
  const useHueStratification = luminanceRange < 22;

  for (let index = 0; index < segmentCount; index += 1) {
    const targetLuminance = useHueStratification
      ? minLuminance + luminanceRange / 2
      : minLuminance + (luminanceRange * (index + 0.5)) / segmentCount;
    const targetHue = useHueStratification ? (360 * (index + rand() * 0.35)) / segmentCount : -1;
    const luminanceJitter = useHueStratification ? 0 : ((rand() - 0.5) * luminanceRange) / segmentCount;

    let bestIndex = -1;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (let candidateIndex = 0; candidateIndex < pool.length; candidateIndex += 1) {
      if (used.has(candidateIndex)) {
        continue;
      }

      const candidate = pool[candidateIndex];
      const luminanceFit = -Math.abs(candidate.luminance - (targetLuminance + luminanceJitter));
      const vividBonus = candidate.saturation * 0.22 + candidate.chroma * 0.08;
      const hueFit =
        targetHue >= 0 ? -hueDistance(candidate.hue, targetHue) * 0.85 : candidate.saturation > 12 ? 6 : 0;

      let diversityBonus = 0;
      for (const picked of selected) {
        const rgbGap = colorDistance(candidate.rgb, picked.rgb);
        diversityBonus += Math.min(rgbGap, 96) * 0.14;
        diversityBonus += hueDistance(candidate.hue, picked.hue) * 0.05;
        diversityBonus -= Math.abs(candidate.luminance - picked.luminance) * 0.03;
      }

      const score = luminanceFit + vividBonus + hueFit + diversityBonus + rand() * 1.5;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = candidateIndex;
      }
    }

    if (bestIndex >= 0) {
      used.add(bestIndex);
      selected.push(pool[bestIndex]);
    }
  }

  for (let index = selected.length; index < segmentCount; index += 1) {
    let fallbackIndex = -1;
    let fallbackScore = Number.NEGATIVE_INFINITY;

    for (let candidateIndex = 0; candidateIndex < pool.length; candidateIndex += 1) {
      if (used.has(candidateIndex)) {
        continue;
      }

      const candidate = pool[candidateIndex];
      let diversityBonus = candidate.saturation * 0.1;
      for (const picked of selected) {
        diversityBonus += colorDistance(candidate.rgb, picked.rgb) * 0.08;
      }

      if (diversityBonus > fallbackScore) {
        fallbackScore = diversityBonus;
        fallbackIndex = candidateIndex;
      }
    }

    if (fallbackIndex < 0) {
      selected.push(pool[index % pool.length]);
      continue;
    }

    used.add(fallbackIndex);
    selected.push(pool[fallbackIndex]);
  }

  const orderRand = seededRandom(seed + 104729);
  const ordered = [...selected].sort((left, right) => {
    const luminanceDelta = left.luminance - right.luminance;
    if (Math.abs(luminanceDelta) > 6) {
      return luminanceDelta;
    }

    return left.hue - right.hue + (orderRand() - 0.5) * 12;
  });

  return ordered.map((item) => rgbToHex(item.rgb).toUpperCase());
}

export function deriveSwatchColorsFromSource(
  source: CanvasImageSource,
  segmentCount: number,
  seed: number
): string[] {
  const { width, height } = getCanvasImageSourceSize(source);
  if (width <= 0 || height <= 0) {
    return Array.from({ length: segmentCount }, () => rgbToHex(MATERIAL_TONE_FALLBACK).toUpperCase());
  }

  const scale = Math.min(1, 512 / Math.max(width, height));
  const canvasWidth = Math.max(1, Math.round(width * scale));
  const canvasHeight = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    return Array.from({ length: segmentCount }, () => rgbToHex(MATERIAL_TONE_FALLBACK).toUpperCase());
  }

  context.drawImage(source, 0, 0, canvasWidth, canvasHeight);
  const patchSize = Math.max(4, Math.round(16 * scale));
  const candidates = buildCandidatePool(context, canvasWidth, canvasHeight, patchSize, seed);
  return pickDiverseSwatchColors(candidates, segmentCount, seed);
}

export function clampSwatchFrame(frame: SwatchFrameConfig): SwatchFrameConfig {
  return {
    ...frame,
    canvasRatio: frame.canvasRatio ?? "auto",
    windowMargin: Math.min(
      Math.max(frame.windowMargin ?? SWATCH_DEFAULTS.windowMargin, SWATCH_FRAME_LIMITS.windowMargin.min),
      SWATCH_FRAME_LIMITS.windowMargin.max
    ),
    innerRadius: Math.min(
      Math.max(frame.innerRadius ?? SWATCH_DEFAULTS.innerRadius, SWATCH_FRAME_LIMITS.innerRadius.min),
      SWATCH_FRAME_LIMITS.innerRadius.max
    ),
    borderWidth: Math.min(
      Math.max(frame.borderWidth ?? SWATCH_DEFAULTS.borderWidth, SWATCH_FRAME_LIMITS.borderWidth.min),
      SWATCH_FRAME_LIMITS.borderWidth.max
    ),
    segmentCount: Math.min(
      Math.max(frame.segmentCount ?? SWATCH_DEFAULTS.segmentCount, SWATCH_FRAME_LIMITS.segmentCount.min),
      SWATCH_FRAME_LIMITS.segmentCount.max
    ),
    seed: Math.max(0, Math.round(frame.seed ?? SWATCH_DEFAULTS.seed))
  };
}

export type SwatchLayoutPx = {
  innerX: number;
  innerY: number;
  innerW: number;
  innerH: number;
  innerRadius: number;
  labelBandHeight: number;
};

export function getSwatchLayoutPx(frame: SwatchFrameConfig, canvasWidth: number, canvasHeight: number): SwatchLayoutPx {
  const normalized = clampSwatchFrame(frame);
  const marginX = (canvasWidth * normalized.windowMargin) / 100;
  const marginY = (canvasHeight * normalized.windowMargin) / 100;
  const innerRadius = Math.round(normalized.innerRadius * (canvasWidth / 720));
  const labelBandHeight = Math.max(28, Math.round(canvasHeight * 0.09));

  return {
    innerX: marginX,
    innerY: marginY,
    innerW: canvasWidth - marginX * 2,
    innerH: canvasHeight - marginY * 2,
    innerRadius,
    labelBandHeight
  };
}

export function pickContrastTextColor({ r, g, b }: Rgb): string {
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.58 ? "#141414" : "#f4f4f2";
}

export function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return MATERIAL_TONE_FALLBACK;
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
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

export function resolveSwatchRatioNumber(frame: SwatchFrameConfig, mediaWidth: number, mediaHeight: number): number {
  if (frame.canvasRatio === "auto") {
    return mediaWidth / mediaHeight;
  }

  return ratioNumberMap[frame.canvasRatio];
}
