import type { BandColorChoice, GlassSillFrameConfig, GlassTextTone } from "../types";
import {
  hexToRgb,
  hslToRgb,
  resolveBandColor,
  rgbToHsl,
  rgbToHex,
  sampleMaterialToneFromSource,
  type Rgb
} from "./bandFrame";
import {
  getGlassInnerRadiusPx,
  getGlassOuterRadiusPx,
  getGlassPlateRadiusPx,
  getGlassTextColors,
  getGlassWindowMediaStylePx,
  GLASS_FROST_ALPHA,
  type GlassBackingColorSource,
  type GlassInsetsPx
} from "./glassFrame";

export const GLASS_SILL_FRAME_LIMITS = {
  edgeWidth: { min: 0, max: 8 },
  bottomBand: { min: 8, max: 22 },
  blur: { min: 4, max: 48 },
  outerRadius: { min: 28, max: 96 },
  captionSize: { min: 12, max: 36 }
} as const;

/** 底层矩形更大：玻璃层相对画布内缩更多（@720 参考宽） */
export const GLASS_SILL_PLATE_INSET_PX = 48;

export const GLASS_SILL_BACKING_FALLBACK = "#8a857c";

export { GLASS_FROST_ALPHA, getGlassTextColors, getGlassWindowMediaStylePx };
export type { GlassBackingColorSource };

export function getGlassSillPlateInsetPx(referenceWidth = 720): number {
  return Math.round(GLASS_SILL_PLATE_INSET_PX * (referenceWidth / 720));
}

export function clampGlassSillFrame(frame: GlassSillFrameConfig): GlassSillFrameConfig {
  return {
    ...frame,
    edgeWidth: Math.min(
      Math.max(frame.edgeWidth, GLASS_SILL_FRAME_LIMITS.edgeWidth.min),
      GLASS_SILL_FRAME_LIMITS.edgeWidth.max
    ),
    bottomBand: Math.min(
      Math.max(frame.bottomBand, GLASS_SILL_FRAME_LIMITS.bottomBand.min),
      GLASS_SILL_FRAME_LIMITS.bottomBand.max
    ),
    blur: Math.min(
      Math.max(frame.blur ?? 32, GLASS_SILL_FRAME_LIMITS.blur.min),
      GLASS_SILL_FRAME_LIMITS.blur.max
    ),
    outerRadius: Math.min(
      Math.max(frame.outerRadius ?? 56, GLASS_SILL_FRAME_LIMITS.outerRadius.min),
      GLASS_SILL_FRAME_LIMITS.outerRadius.max
    ),
    captionSize: Math.min(
      Math.max(frame.captionSize ?? 18, GLASS_SILL_FRAME_LIMITS.captionSize.min),
      GLASS_SILL_FRAME_LIMITS.captionSize.max
    ),
    backingColor: frame.backingColor ?? (frame.backingHex ? "system" : "system"),
    systemBackingHex: frame.systemBackingHex ?? frame.backingHex
  };
}

export function deriveGlassSillBackingColor(average: Rgb, options?: { jitter?: boolean }): string {
  const { h, s, l } = rgbToHsl(average);
  const hueJitter = options?.jitter ? (Math.random() - 0.5) * 28 : 0;
  const satJitter = options?.jitter ? (Math.random() - 0.5) * 8 : 0;
  const lightJitter = options?.jitter ? (Math.random() - 0.5) * 10 : 0;
  const backingS = Math.min(38, Math.max(14, s * 0.52 + 8 + satJitter));
  const backingL = Math.min(52, Math.max(32, l * 0.38 + 14 + lightJitter));
  return rgbToHex(hslToRgb(h + hueJitter, backingS, backingL));
}

export function deriveGlassSillCausticColor(average: Rgb, options?: { jitter?: boolean }): string {
  const { h, s, l } = rgbToHsl(average);
  const hueJitter = options?.jitter ? (Math.random() - 0.5) * 24 : 0;
  const satBoost = 32 + (options?.jitter ? (Math.random() - 0.5) * 10 : 0);
  const lightBoost = 42 + (options?.jitter ? (Math.random() - 0.5) * 12 : 0);
  return rgbToHex(hslToRgb(h + hueJitter, Math.min(58, s + satBoost), Math.min(96, Math.max(72, l + lightBoost))));
}

export function resolveGlassSillBackingColor(source: GlassBackingColorSource, average?: Rgb | null): string {
  const choice = source.backingColor ?? "system";

  if (choice !== "system") {
    return resolveBandColor(choice);
  }

  if (source.systemBackingHex) {
    return source.systemBackingHex;
  }

  if (source.backingHex) {
    return source.backingHex;
  }

  if (average) {
    return deriveGlassSillBackingColor(average);
  }

  return GLASS_SILL_BACKING_FALLBACK;
}

export function resolveGlassSillCausticColor(causticHex?: string, average?: Rgb | null): string {
  if (causticHex) {
    return causticHex;
  }

  if (average) {
    return deriveGlassSillCausticColor(average);
  }

  return "#f6f2ea";
}

export function deriveGlassSillColorsFromSource(source: CanvasImageSource): { backingHex: string; causticHex: string } {
  const average = sampleMaterialToneFromSource(source);
  return {
    backingHex: deriveGlassSillBackingColor(average),
    causticHex: deriveGlassSillCausticColor(average)
  };
}

/** 上/左右等宽，底边为独立加厚区域；边缘 0 时贴齐玻璃内缘（含 plate 退边距） */
export function getGlassSillInsetsPx(frame: GlassSillFrameConfig, referenceWidth: number): GlassInsetsPx {
  const normalized = clampGlassSillFrame(frame);
  const plateInsetPx = getGlassSillPlateInsetPx(referenceWidth);
  const edgePx = (normalized.edgeWidth / 100) * referenceWidth;
  const bottomBandPx = (normalized.bottomBand / 100) * referenceWidth;

  return {
    top: plateInsetPx + edgePx,
    right: plateInsetPx + edgePx,
    bottom: Math.max(plateInsetPx + edgePx, bottomBandPx),
    left: plateInsetPx + edgePx
  };
}

export function getGlassSillInnerRadiusPx(
  edgeWidth: number,
  referenceWidth: number,
  outerRadiusRef: number
): number {
  return getGlassInnerRadiusPx(edgeWidth, referenceWidth, outerRadiusRef, GLASS_SILL_FRAME_LIMITS.edgeWidth);
}

export function getGlassSillOuterRadiusPx(outerRadiusRef: number, referenceWidth: number): number {
  return getGlassOuterRadiusPx(outerRadiusRef, referenceWidth);
}

export function getGlassSillPlateRadiusPx(outerRadiusPx: number, plateInsetPx: number): number {
  return getGlassPlateRadiusPx(outerRadiusPx, plateInsetPx);
}

export function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return `rgba(255, 255, 255, ${alpha})`;
  }

  return `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${alpha})`;
}

export function getGlassSillCaptionColor(tone: GlassTextTone): string {
  return getGlassTextColors(tone).title;
}
