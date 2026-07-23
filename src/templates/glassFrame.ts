import type { BandColorChoice, GlassFrameConfig, GlassTextTone } from "../types";
import { fallbackSystemColor, resolveBandColor, sampleAverageColorFromSource, type Rgb } from "./bandFrame";

export const GLASS_FRAME_LIMITS = {
  edgeWidth: { min: 0, max: 8 },
  bottomExtra: { min: 0, max: 20 },
  blur: { min: 4, max: 48 },
  outerRadius: { min: 28, max: 96 },
  titleSize: { min: 16, max: 48 },
  subtitleSize: { min: 10, max: 32 }
} as const;

/** 外矩形圆角默认值（px @720 参考宽） */
export const GLASS_OUTER_RADIUS_PX = 64;

/** 内矩形圆角：边缘最薄 / 最厚时的参考值（px @720） */
export const GLASS_INNER_RADIUS_AT_REF = {
  thin: 54,
  thick: 26
} as const;

/** 磨砂白色叠层不透明度 */
export const GLASS_FROST_ALPHA = 0.52;

/** 玻璃层与底层固定矩形间距（@720 参考宽） */
export const GLASS_PLATE_INSET_PX = 22;

export const GLASS_BACKING_COLOR = "#e4e4e0";

export function getGlassPlateInsetPx(referenceWidth = 720): number {
  return Math.round(GLASS_PLATE_INSET_PX * (referenceWidth / 720));
}

/** @deprecated 使用 getGlassPlateInsetPx */
export const GLASS_BACKING_INSET_PX = GLASS_PLATE_INSET_PX;

/** @deprecated 使用 getGlassPlateInsetPx */
export function getGlassBackingInsetPx(referenceWidth = 720): number {
  return getGlassPlateInsetPx(referenceWidth);
}

/** 内缩玻璃层的圆角 */
export function getGlassPlateRadiusPx(outerRadiusPx: number, plateInsetPx: number): number {
  return Math.max(0, Math.round(outerRadiusPx - plateInsetPx * 0.65));
}

export function clampGlassFrame(frame: GlassFrameConfig): GlassFrameConfig {
  const edgeWidth = Math.min(
    Math.max(frame.edgeWidth, GLASS_FRAME_LIMITS.edgeWidth.min),
    GLASS_FRAME_LIMITS.edgeWidth.max
  );
  const bottomExtra = Math.min(
    Math.max(frame.bottomExtra, GLASS_FRAME_LIMITS.bottomExtra.min),
    GLASS_FRAME_LIMITS.bottomExtra.max
  );
  const blur = Math.min(
    Math.max(frame.blur ?? 28, GLASS_FRAME_LIMITS.blur.min),
    GLASS_FRAME_LIMITS.blur.max
  );
  const outerRadius = Math.min(
    Math.max(frame.outerRadius ?? GLASS_OUTER_RADIUS_PX, GLASS_FRAME_LIMITS.outerRadius.min),
    GLASS_FRAME_LIMITS.outerRadius.max
  );

  return {
    ...frame,
    edgeWidth,
    bottomExtra,
    blur,
    outerRadius,
    titleSize: Math.min(Math.max(frame.titleSize ?? 28, GLASS_FRAME_LIMITS.titleSize.min), GLASS_FRAME_LIMITS.titleSize.max),
    subtitleSize: Math.min(Math.max(frame.subtitleSize ?? 14, GLASS_FRAME_LIMITS.subtitleSize.min), GLASS_FRAME_LIMITS.subtitleSize.max),
    backingColor: frame.backingColor ?? (frame.backingHex ? "system" : "system"),
    systemBackingHex: frame.systemBackingHex ?? frame.backingHex
  };
}

export type GlassBackingColorSource = {
  backingColor?: BandColorChoice;
  systemBackingHex?: string;
  backingHex?: string;
};

export function resolveGlassBackingColor(source: GlassBackingColorSource, average?: Rgb | null): string {
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
    return fallbackSystemColor(average, "backing");
  }

  return GLASS_BACKING_COLOR;
}

export function deriveGlassBackingFromSource(source: CanvasImageSource): string {
  return fallbackSystemColor(sampleAverageColorFromSource(source), "backing");
}

export function getGlassInsets(frame: GlassFrameConfig, referenceWidth = 720) {
  const normalized = clampGlassFrame(frame);
  const plateInsetPercent = (getGlassPlateInsetPx(referenceWidth) / referenceWidth) * 100;

  return {
    top: plateInsetPercent + normalized.edgeWidth,
    right: plateInsetPercent + normalized.edgeWidth,
    bottom: plateInsetPercent + normalized.edgeWidth + normalized.bottomExtra,
    left: plateInsetPercent + normalized.edgeWidth
  };
}

export type GlassInsetsPx = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

/** 边缘统一按画布宽度换算；0 时贴齐玻璃内缘（含 plate 退边距） */
export function getGlassInsetsPx(frame: GlassFrameConfig, referenceWidth: number): GlassInsetsPx {
  const normalized = clampGlassFrame(frame);
  const plateInsetPx = getGlassPlateInsetPx(referenceWidth);
  const edgePx = (normalized.edgeWidth / 100) * referenceWidth;
  const bottomExtraPx = (normalized.bottomExtra / 100) * referenceWidth;

  return {
    top: plateInsetPx + edgePx,
    right: plateInsetPx + edgePx,
    bottom: plateInsetPx + edgePx + bottomExtraPx,
    left: plateInsetPx + edgePx
  };
}

/** 上层清晰图与底层同图对齐（cover 裁切一致） */
export function getGlassWindowMediaStyle(insets: ReturnType<typeof getGlassInsets>) {
  const innerW = 100 - insets.left - insets.right;
  const innerH = 100 - insets.top - insets.bottom;

  return {
    height: `${(100 / innerH) * 100}%`,
    left: `${(-insets.left / innerW) * 100}%`,
    top: `${(-insets.top / innerH) * 100}%`,
    width: `${(100 / innerW) * 100}%`
  };
}

export function getGlassWindowMediaStylePx(
  insetsPx: GlassInsetsPx,
  containerWidth: number,
  containerHeight: number
) {
  const innerW = containerWidth - insetsPx.left - insetsPx.right;
  const innerH = containerHeight - insetsPx.top - insetsPx.bottom;

  return {
    height: `${(containerHeight / innerH) * 100}%`,
    left: `${(-insetsPx.left / innerW) * 100}%`,
    top: `${(-insetsPx.top / innerH) * 100}%`,
    width: `${(containerWidth / innerW) * 100}%`
  };
}

export function getGlassEdgeNormalized(
  edgeWidth: number,
  limits: { min: number; max: number } = GLASS_FRAME_LIMITS.edgeWidth
): number {
  const span = limits.max - limits.min;
  if (span <= 0) {
    return 0;
  }

  return (edgeWidth - limits.min) / span;
}

/** 内圆角随边缘厚度线性变小（相对外圆角的比例 @720） */
export function getGlassInnerRadiusRatio(
  edgeWidth: number,
  outerRadiusRef = GLASS_OUTER_RADIUS_PX,
  edgeLimits: { min: number; max: number } = GLASS_FRAME_LIMITS.edgeWidth
): number {
  const t = getGlassEdgeNormalized(edgeWidth, edgeLimits);
  const innerAtRef =
    GLASS_INNER_RADIUS_AT_REF.thin -
    t * (GLASS_INNER_RADIUS_AT_REF.thin - GLASS_INNER_RADIUS_AT_REF.thick);

  return innerAtRef / outerRadiusRef;
}

export function getGlassInnerRadiusPx(
  edgeWidth: number,
  referenceWidth = 720,
  outerRadiusRef = GLASS_OUTER_RADIUS_PX,
  edgeLimits: { min: number; max: number } = GLASS_FRAME_LIMITS.edgeWidth
): number {
  const scale = referenceWidth / 720;
  const inner = getGlassInnerRadiusRatio(edgeWidth, outerRadiusRef, edgeLimits) * outerRadiusRef * scale;
  const outer = outerRadiusRef * scale;
  const minInner = 6 * scale;

  return Math.round(Math.max(minInner, Math.min(inner, outer - 4 * scale)));
}

export function getGlassOuterRadiusPx(outerRadiusRef: number, referenceWidth = 720): number {
  return Math.round(outerRadiusRef * (referenceWidth / 720));
}

export function getGlassTextColors(tone: GlassTextTone): { title: string; subtitle: string } {
  if (tone === "black") {
    return {
      title: "#111111",
      subtitle: "rgba(17, 17, 17, 0.72)"
    };
  }

  if (tone === "gray") {
    return {
      title: "rgba(255, 255, 255, 0.88)",
      subtitle: "rgba(255, 255, 255, 0.62)"
    };
  }

  return {
    title: "#ffffff",
    subtitle: "rgba(255, 255, 255, 0.78)"
  };
}
