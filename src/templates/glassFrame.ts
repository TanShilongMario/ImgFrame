import type { GlassFrameConfig, GlassTextTone } from "../types";

export const GLASS_FRAME_LIMITS = {
  edgeWidth: { min: 1.5, max: 8 },
  bottomExtra: { min: 0, max: 20 },
  blur: { min: 4, max: 48 }
} as const;

/** 外矩形圆角（px @720 参考宽） */
export const GLASS_OUTER_RADIUS_PX = 64;

/** 内矩形圆角：边缘最薄 / 最厚时的参考值（px @720） */
export const GLASS_INNER_RADIUS_AT_REF = {
  thin: 54,
  thick: 26
} as const;

/** 磨砂白色叠层不透明度 */
export const GLASS_FROST_ALPHA = 0.52;

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

  return {
    ...frame,
    edgeWidth,
    bottomExtra,
    blur
  };
}

export function getGlassInsets(frame: GlassFrameConfig) {
  const normalized = clampGlassFrame(frame);

  return {
    top: normalized.edgeWidth,
    right: normalized.edgeWidth,
    bottom: normalized.edgeWidth + normalized.bottomExtra,
    left: normalized.edgeWidth
  };
}

export function getGlassEdgeNormalized(edgeWidth: number): number {
  const { min, max } = GLASS_FRAME_LIMITS.edgeWidth;
  return (edgeWidth - min) / (max - min);
}

/** 内圆角随边缘厚度线性变小（相对外圆角的比例 @720） */
export function getGlassInnerRadiusRatio(edgeWidth: number): number {
  const t = getGlassEdgeNormalized(edgeWidth);
  const innerAtRef =
    GLASS_INNER_RADIUS_AT_REF.thin -
    t * (GLASS_INNER_RADIUS_AT_REF.thin - GLASS_INNER_RADIUS_AT_REF.thick);

  return innerAtRef / GLASS_OUTER_RADIUS_PX;
}

export function getGlassInnerRadiusPx(edgeWidth: number, referenceWidth = 720): number {
  const scale = referenceWidth / 720;
  const inner = getGlassInnerRadiusRatio(edgeWidth) * GLASS_OUTER_RADIUS_PX * scale;
  const outer = GLASS_OUTER_RADIUS_PX * scale;
  const minInner = 6 * scale;

  return Math.round(Math.max(minInner, Math.min(inner, outer - 4 * scale)));
}

export function getGlassOuterRadiusPx(referenceWidth = 720): number {
  return Math.round(GLASS_OUTER_RADIUS_PX * (referenceWidth / 720));
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
