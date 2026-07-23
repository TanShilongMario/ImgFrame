import type {
  BandFrameConfig,
  CanvasRatio,
  CornerFrameConfig,
  DotFrameConfig,
  PrintFrameConfig,
  FlutedFrameConfig,
  SwatchFrameConfig,
  GlassFrameConfig,
  GlassSillFrameConfig,
  GridFrameConfig,
  RefinedCanvasRatio,
  TemplateParams
} from "../../types";
import { getTemplateById } from "../../templates/registry";
import {
  getGridCellRects,
  getGridLineColor,
  getGridTitleColor,
  getCellOverlayRgba,
  GRID_LINE_WIDTH_PX
} from "../../templates/gridFrame";
import {
  getGlassInnerRadiusPx,
  getGlassInsetsPx,
  getGlassOuterRadiusPx,
  getGlassPlateInsetPx,
  getGlassPlateRadiusPx,
  getGlassTextColors,
  getGlassWindowMediaStylePx,
  GLASS_BACKING_COLOR,
  GLASS_FROST_ALPHA,
  resolveGlassBackingColor
} from "../../templates/glassFrame";
import {
  deriveGlassSillBackingColor,
  deriveGlassSillCausticColor,
  getGlassSillCaptionColor,
  getGlassSillInsetsPx,
  getGlassSillInnerRadiusPx,
  getGlassSillOuterRadiusPx,
  getGlassSillPlateInsetPx,
  getGlassSillPlateRadiusPx,
  GLASS_SILL_BACKING_FALLBACK,
  resolveGlassSillBackingColor,
  resolveGlassSillCausticColor
} from "../../templates/glassSillFrame";
import {
  fallbackSystemColor,
  getBandCardRadiusPx,
  getBandTextColors,
  resolveBandColor,
  sampleAverageColorFromUrl
} from "../../templates/bandFrame";
import {
  clampCornerFrame,
  CORNER_IMAGE_SHADOW,
  getCornerLayoutPx,
  getCornerTextColors
} from "../../templates/cornerFrame";
import { getFontStack } from "../../templates/fonts";
import { useElementWidth } from "../../hooks/useElementWidth";
import { useImageAspectRatio } from "../../hooks/useImageAspectRatio";
import { getStagePreviewStyle } from "../../preview/stagePreviewStyle";
import { combinePreviewSurface as surface } from "../../preview/previewParamTransition";
import { cssPx } from "../../utils/cssPx";
import { renderFlutedFrame } from "../../export/renderFlutedFrame";
import { renderPrintFrame } from "../../export/renderPrintFrame";
import { renderDotFrame } from "../../export/renderDotFrame";
import { renderSwatchFrame } from "../../export/renderSwatchFrame";
import { resolveExportDimensions } from "../../export/sizing";
import { clampFlutedFrame, resolveFlutedRatioNumber } from "../../templates/flutedFrame";
import { clampPrintFrame, resolvePrintRatioNumber } from "../../templates/printFrame";
import { clampDotFrame, resolveDotRatioNumber } from "../../templates/dotFrame";
import { clampSwatchFrame, resolveSwatchRatioNumber } from "../../templates/swatchFrame";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type CardPreviewProps = {
  params: TemplateParams;
  templateId?: string;
  mediaUrl?: string;
  demoFill?: string;
  mediaType?: "image" | "video";
  mediaName?: string;
  variant?: "hero" | "stage" | "thumb" | "gallery";
  framed?: boolean;
};

const ratioMap: Record<CanvasRatio, string> = {
  "1:1": "1 / 1",
  "4:5": "4 / 5",
  "4:3": "4 / 3",
  "3:4": "3 / 4",
  "9:16": "9 / 16",
  "16:9": "16 / 9"
};

const ratioNumberMap: Record<CanvasRatio, number> = {
  "1:1": 1,
  "4:5": 4 / 5,
  "4:3": 4 / 3,
  "3:4": 3 / 4,
  "9:16": 9 / 16,
  "16:9": 16 / 9
};

const GLASS_RADIUS_REF_WIDTH = 720;
const HERO_PREVIEW_RATIO = "3 / 4";
const HERO_PREVIEW_RATIO_NUMBER = 3 / 4;

/** 各模板共用的画布比例解析：auto 时跟随原图，否则查表。 */
function resolveCanvasRatio(
  canvasRatio: RefinedCanvasRatio | undefined,
  imageRatio: number | undefined,
  fallback: CanvasRatio
): { ratio: string; ratioNumber: number } {
  if (canvasRatio && canvasRatio !== "auto") {
    return { ratio: ratioMap[canvasRatio], ratioNumber: ratioNumberMap[canvasRatio] };
  }

  if (canvasRatio === "auto" && imageRatio) {
    return { ratio: String(imageRatio), ratioNumber: imageRatio };
  }

  return { ratio: ratioMap[fallback], ratioNumber: ratioNumberMap[fallback] };
}

type GlassCardPreviewProps = {
  glassFrame: GlassFrameConfig;
  mediaUrl?: string;
  params: TemplateParams;
  ratio: string;
  ratioNumber: number;
  variant: CardPreviewProps["variant"];
  renderMedia: (alt: string) => ReactNode;
  mediaName: string;
  mediaType?: "image" | "video";
};

function GlassCardPreview({
  glassFrame,
  mediaUrl,
  mediaType = "image",
  params,
  ratio,
  ratioNumber,
  variant,
  renderMedia,
  mediaName
}: GlassCardPreviewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const measuredWidth = useElementWidth(rootRef);
  const refWidth = measuredWidth || GLASS_RADIUS_REF_WIDTH;
  const [sampledSystemBackingHex, setSampledSystemBackingHex] = useState<string | undefined>(
    glassFrame.systemBackingHex
  );

  useEffect(() => {
    setSampledSystemBackingHex(glassFrame.systemBackingHex);
  }, [glassFrame.systemBackingHex]);

  useEffect(() => {
    if (glassFrame.backingColor !== "system" || glassFrame.systemBackingHex || !mediaUrl) {
      return;
    }

    let cancelled = false;
    void sampleAverageColorFromUrl(mediaUrl, mediaType)
      .then((average) => {
        if (!cancelled) {
          setSampledSystemBackingHex(fallbackSystemColor(average, "backing"));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSampledSystemBackingHex(GLASS_BACKING_COLOR);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [glassFrame.backingColor, glassFrame.systemBackingHex, mediaType, mediaUrl]);

  const backingColor = resolveGlassBackingColor({
    ...glassFrame,
    systemBackingHex: glassFrame.systemBackingHex ?? sampledSystemBackingHex
  });
  const refHeight = refWidth / ratioNumber;
  const insetsPx = getGlassInsetsPx(glassFrame, refWidth);
  const textColors = getGlassTextColors(glassFrame.textTone);
  const outerRadiusPx = getGlassOuterRadiusPx(glassFrame.outerRadius, refWidth);
  const innerRadiusPx = getGlassInnerRadiusPx(glassFrame.edgeWidth, refWidth, glassFrame.outerRadius);
  const plateInsetPx = getGlassPlateInsetPx(refWidth);
  const plateRadiusPx = getGlassPlateRadiusPx(outerRadiusPx, plateInsetPx);
  const windowMediaStyle = getGlassWindowMediaStylePx(insetsPx, refWidth, refHeight);
  const blurPx = cssPx(glassFrame.blur, refWidth);
  const textInsetX = cssPx(18, refWidth);
  const textInsetY = cssPx(22, refWidth);
  const titleSize = cssPx(glassFrame.titleSize, refWidth);
  const subtitleSize = cssPx(glassFrame.subtitleSize, refWidth);
  const stageStyle =
    variant === "stage"
      ? {
          ...getStagePreviewStyle(ratio, ratioNumber),
          background: "transparent"
        }
      : variant === "hero"
        ? {
            background: "transparent",
            height: "100%",
            width: "100%"
        }
        : {
            aspectRatio: ratio,
            background: "transparent"
          };

  return (
    <div
      ref={rootRef}
      className={surface(`card-preview card-preview-${variant} card-preview-glass`)}
      style={stageStyle}
    >
      <div
        aria-hidden="true"
        className={surface("glass-preview-base")}
        style={{ background: backingColor }}
      />
      <div
        className={surface("glass-preview-plate")}
        style={{
          borderRadius: `${plateRadiusPx}px`,
          inset: `${plateInsetPx}px`
        }}
      >
        <div className="glass-preview-plate-media">{renderMedia(mediaName)}</div>
        <div
          aria-hidden="true"
          className={surface("glass-preview-plate-frost")}
          style={{
            backdropFilter: `blur(${blurPx}px) saturate(1.04)`,
            WebkitBackdropFilter: `blur(${blurPx}px) saturate(1.04)`,
            background: `rgba(255, 255, 255, ${GLASS_FROST_ALPHA})`
          }}
        />
        <div aria-hidden="true" className={surface("glass-preview-outer-border")} />
      </div>
      <div
        className={surface("glass-preview-window")}
        style={{
          borderRadius: `${innerRadiusPx}px`,
          bottom: `${insetsPx.bottom}px`,
          left: `${insetsPx.left}px`,
          right: `${insetsPx.right}px`,
          top: `${insetsPx.top}px`
        }}
      >
        <div className={surface("glass-preview-window-media")} style={windowMediaStyle}>
          {renderMedia(mediaName)}
        </div>
        <div aria-hidden="true" className="glass-preview-inset" />
        <div
          className="glass-preview-copy"
          style={{
            fontFamily: getFontStack(params.text.fontFamily),
            left: `${textInsetX}px`,
            top: `${textInsetY}px`
          }}
        >
          <h3
            className={surface()}
            style={{ color: textColors.title, fontSize: `${titleSize}px`, lineHeight: 1.1 }}
          >
            {params.text.title.slice(0, 40)}
          </h3>
          <p
            className={surface()}
            style={{
              color: textColors.subtitle,
              fontSize: `${subtitleSize}px`,
              lineHeight: 1.35,
              marginTop: `${titleSize * 0.18}px`
            }}
          >
            {params.text.subtitle.slice(0, 72)}
          </p>
        </div>
      </div>
    </div>
  );
}

type GlassSillCardPreviewProps = {
  glassSillFrame: GlassSillFrameConfig;
  mediaUrl?: string;
  params: TemplateParams;
  ratio: string;
  ratioNumber: number;
  variant: CardPreviewProps["variant"];
  renderMedia: (alt: string) => ReactNode;
  mediaName: string;
  mediaType?: "image" | "video";
};

function GlassSillCardPreview({
  glassSillFrame,
  mediaUrl,
  mediaType = "image",
  params,
  ratio,
  ratioNumber,
  variant,
  renderMedia,
  mediaName
}: GlassSillCardPreviewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const measuredWidth = useElementWidth(rootRef);
  const refWidth = measuredWidth || GLASS_RADIUS_REF_WIDTH;
  const refHeight = refWidth / ratioNumber;
  const [sampledColors, setSampledColors] = useState<{ systemBackingHex?: string; causticHex?: string }>({
    systemBackingHex: glassSillFrame.systemBackingHex,
    causticHex: glassSillFrame.causticHex
  });

  useEffect(() => {
    setSampledColors({
      systemBackingHex: glassSillFrame.systemBackingHex,
      causticHex: glassSillFrame.causticHex
    });
  }, [glassSillFrame.systemBackingHex, glassSillFrame.causticHex]);

  useEffect(() => {
    const needsSystemBacking = glassSillFrame.backingColor === "system" && !glassSillFrame.systemBackingHex;
    const needsCaustic = !glassSillFrame.causticHex;

    if ((!needsSystemBacking && !needsCaustic) || !mediaUrl) {
      return;
    }

    let cancelled = false;
    void sampleAverageColorFromUrl(mediaUrl, mediaType)
      .then((average) => {
        if (!cancelled) {
          setSampledColors({
            systemBackingHex: needsSystemBacking ? deriveGlassSillBackingColor(average) : glassSillFrame.systemBackingHex,
            causticHex: needsCaustic ? deriveGlassSillCausticColor(average) : glassSillFrame.causticHex
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSampledColors({
            systemBackingHex: needsSystemBacking ? GLASS_SILL_BACKING_FALLBACK : glassSillFrame.systemBackingHex,
            causticHex: needsCaustic ? "#f6f2ea" : glassSillFrame.causticHex
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    glassSillFrame.backingColor,
    glassSillFrame.causticHex,
    glassSillFrame.systemBackingHex,
    mediaType,
    mediaUrl
  ]);

  const backingColor = resolveGlassSillBackingColor({
    ...glassSillFrame,
    systemBackingHex: glassSillFrame.systemBackingHex ?? sampledColors.systemBackingHex
  });
  const causticColor = resolveGlassSillCausticColor(glassSillFrame.causticHex ?? sampledColors.causticHex);
  const insetsPx = getGlassSillInsetsPx(glassSillFrame, refWidth);
  const captionColor = getGlassSillCaptionColor(glassSillFrame.textTone);
  const outerRadiusPx = getGlassSillOuterRadiusPx(glassSillFrame.outerRadius, refWidth);
  const innerRadiusPx = getGlassSillInnerRadiusPx(glassSillFrame.edgeWidth, refWidth, glassSillFrame.outerRadius);
  const plateInsetPx = getGlassSillPlateInsetPx(refWidth);
  const plateRadiusPx = getGlassSillPlateRadiusPx(outerRadiusPx, plateInsetPx);
  const windowMediaStyle = getGlassWindowMediaStylePx(insetsPx, refWidth, refHeight);
  const blurPx = cssPx(glassSillFrame.blur, refWidth);
  const captionTop = refHeight - insetsPx.bottom + (insetsPx.bottom - plateInsetPx) / 2;
  const captionSize = cssPx(glassSillFrame.captionSize, refWidth);
  const stageStyle =
    variant === "stage"
      ? {
          ...getStagePreviewStyle(ratio, ratioNumber),
          background: "transparent"
        }
      : variant === "hero"
        ? {
            background: "transparent",
            height: "100%",
            width: "100%"
          }
        : {
            aspectRatio: ratio,
            background: "transparent"
          };

  return (
    <div
      ref={rootRef}
      className={surface(`card-preview card-preview-${variant} card-preview-glass card-preview-glass-sill`)}
      style={stageStyle}
    >
      <div aria-hidden="true" className={surface("glass-preview-base")} style={{ background: backingColor }} />
      <div
        aria-hidden="true"
        className={surface("glass-sill-caustic")}
        style={
          {
            borderRadius: `${plateRadiusPx}px`,
            inset: `${plateInsetPx}px`,
            "--caustic-a": causticColor,
            "--caustic-b": causticColor
          } as CSSProperties
        }
      />
      <div
        className={surface("glass-preview-plate")}
        style={{
          borderRadius: `${plateRadiusPx}px`,
          inset: `${plateInsetPx}px`
        }}
      >
        <div className="glass-preview-plate-media">{renderMedia(mediaName)}</div>
        <div
          aria-hidden="true"
          className={surface("glass-preview-plate-frost")}
          style={{
            backdropFilter: `blur(${blurPx}px) saturate(1.04)`,
            WebkitBackdropFilter: `blur(${blurPx}px) saturate(1.04)`,
            background: `rgba(255, 255, 255, ${GLASS_FROST_ALPHA})`
          }}
        />
        <div aria-hidden="true" className={surface("glass-preview-outer-border")} />
      </div>
      <div
        className={surface("glass-preview-window")}
        style={{
          borderRadius: `${innerRadiusPx}px`,
          bottom: `${insetsPx.bottom}px`,
          left: `${insetsPx.left}px`,
          right: `${insetsPx.right}px`,
          top: `${insetsPx.top}px`
        }}
      >
        <div className={surface("glass-preview-window-media")} style={windowMediaStyle}>
          {renderMedia(mediaName)}
        </div>
        <div aria-hidden="true" className="glass-preview-inset" />
      </div>
      <p
        className={surface("glass-sill-caption")}
        style={{
          color: captionColor,
          fontFamily: getFontStack(params.text.fontFamily),
          fontSize: `${captionSize}px`,
          top: `${captionTop}px`
        }}
      >
        {params.text.title.slice(0, 64)}
      </p>
    </div>
  );
}

function RefinedCardPreview({
  params,
  ratio,
  ratioNumber,
  refinedFrame,
  variant,
  renderMedia,
  mediaName
}: {
  params: TemplateParams;
  ratio: string;
  ratioNumber: number;
  refinedFrame: NonNullable<TemplateParams["refinedFrame"]>;
  variant: CardPreviewProps["variant"];
  renderMedia: (alt: string) => ReactNode;
  mediaName: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const measuredWidth = useElementWidth(rootRef);
  const refWidth = measuredWidth || GLASS_RADIUS_REF_WIDTH;
  const gradientBackground =
    refinedFrame.gradientTone === "white"
      ? "linear-gradient(0deg, #ffffff 0%, #fffffffd 3%, rgba(255, 255, 255, 0) 41%)"
      : "linear-gradient(0deg, #111111 0%, rgba(17, 17, 17, 0.98) 3%, rgba(17, 17, 17, 0) 41%)";
  const creditColor = refinedFrame.gradientTone === "white" ? "rgba(34, 34, 31, 0.62)" : "rgba(255, 255, 255, 0.78)";
  const visibleWidth = 100 - refinedFrame.cropWidth;
  const verticalInset = refinedFrame.cropHeight / 2;
  const blurPx = cssPx(refinedFrame.backgroundBlur, refWidth);
  const refHeight = refWidth / ratioNumber;
  const frameHeightPx = refHeight * (1 - refinedFrame.cropHeight / 100);
  const creditFontSize = cssPx(refinedFrame.creditSize, refWidth);
  const creditBottomInset = Math.min(
    cssPx(28, refHeight, refHeight),
    Math.max(cssPx(14, refHeight, refHeight), frameHeightPx * 0.03)
  );
  const stageStyle =
    variant === "stage"
      ? {
          ...getStagePreviewStyle(ratio, ratioNumber),
          background: params.canvas.background
        }
      : { aspectRatio: ratio, background: params.canvas.background };

  return (
    <div
      ref={rootRef}
      className={surface(`card-preview card-preview-${variant} card-preview-refined`)}
      style={stageStyle}
    >
      <div
        className={surface("refined-preview-bg")}
        style={{ filter: `blur(${blurPx}px)` }}
        aria-hidden="true"
      >
        {renderMedia("")}
      </div>
      <div
        className={surface("refined-preview-frame")}
        style={{
          bottom: `${verticalInset}%`,
          top: `${verticalInset}%`,
          width: `${visibleWidth}%`
        }}
      >
        {renderMedia(mediaName)}
        <div
          className={surface("refined-preview-gradient")}
          style={{ background: gradientBackground }}
          aria-hidden="true"
        />
        <p
          className={surface("refined-preview-credit")}
          style={{
            bottom: `${creditBottomInset}px`,
            color: creditColor,
            fontFamily: getFontStack(params.text.fontFamily),
            fontSize: `${creditFontSize}px`
          }}
        >
          {params.text.credit}
        </p>
      </div>
    </div>
  );
}

function BandCardPreview({
  bandFrame,
  params,
  ratio,
  ratioNumber,
  variant,
  renderMedia,
  mediaName
}: {
  bandFrame: BandFrameConfig;
  params: TemplateParams;
  ratio: string;
  ratioNumber: number;
  variant: CardPreviewProps["variant"];
  renderMedia: (alt: string) => ReactNode;
  mediaName: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const measuredWidth = useElementWidth(rootRef);
  const refWidth = measuredWidth || GLASS_RADIUS_REF_WIDTH;
  const backingHex = resolveBandColor(bandFrame.backingColor, bandFrame.systemBackingHex);
  const bandHex = resolveBandColor(bandFrame.bandColor, bandFrame.systemBandHex);
  const textColors = getBandTextColors(bandHex);
  const fontStack = getFontStack(params.text.fontFamily);
  const radiusPx = getBandCardRadiusPx(refWidth);
  const subtitlePx = cssPx(bandFrame.subtitleSize, refWidth);
  const titlePx = cssPx(bandFrame.titleSize, refWidth);
  const padX = Math.max(cssPx(24, refWidth), refWidth * 0.055);

  const baseStyle =
    variant === "stage" ? getStagePreviewStyle(ratio, ratioNumber) : { aspectRatio: ratio };
  const rootStyle = {
    ...baseStyle,
    background: backingHex,
    boxSizing: "border-box" as const,
    padding: `${bandFrame.outerMargin}%`
  };

  return (
    <div
      ref={rootRef}
      className={surface(`card-preview card-preview-${variant} card-preview-band`)}
      style={rootStyle}
    >
      <div className={surface("band-preview-card")} style={{ borderRadius: `${radiusPx}px` }}>
        <div className="band-preview-media">{renderMedia(mediaName)}</div>
        <div
          className={surface("band-preview-band")}
          style={{ background: bandHex, height: `${bandFrame.bandHeight}%` }}
        >
          <div
            className="band-preview-copy"
            style={{ fontFamily: fontStack, paddingLeft: `${padX}px`, paddingRight: `${padX}px` }}
          >
            <span
              className={surface("band-preview-subtitle")}
              style={{ color: textColors.subtitle, fontSize: `${subtitlePx}px` }}
            >
              {params.text.subtitle.slice(0, 40)}
            </span>
            <span
              className={surface("band-preview-title")}
              style={{
                color: textColors.title,
                fontSize: `${titlePx}px`,
                marginTop: `${subtitlePx * 0.7}px`
              }}
            >
              {params.text.title.slice(0, 64)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CornerCardPreview({
  cornerFrame,
  params,
  ratio,
  ratioNumber,
  variant,
  renderMedia,
  mediaName
}: {
  cornerFrame: CornerFrameConfig;
  params: TemplateParams;
  ratio: string;
  ratioNumber: number;
  variant: CardPreviewProps["variant"];
  renderMedia: (alt: string) => ReactNode;
  mediaName: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const measuredWidth = useElementWidth(rootRef);
  const refWidth = measuredWidth || GLASS_RADIUS_REF_WIDTH;
  const refHeight = refWidth / ratioNumber;
  const frame = clampCornerFrame(cornerFrame);
  const layout = getCornerLayoutPx(frame, refWidth, refHeight);
  const backingHex = resolveBandColor(frame.backingColor, frame.systemBackingHex);
  const textColors = getCornerTextColors(frame.textTone);
  const fontStack = getFontStack(params.text.fontFamily);
  const subtitlePx = cssPx(frame.subtitleSize, refWidth);
  const titlePx = cssPx(frame.titleSize, refWidth);
  const isRight = frame.textCorner.endsWith("right");
  const isBottom = frame.textCorner.startsWith("bottom");

  const baseStyle =
    variant === "stage" ? getStagePreviewStyle(ratio, ratioNumber) : { aspectRatio: ratio };
  const rootStyle = {
    ...baseStyle,
    background: backingHex,
    boxSizing: "border-box" as const,
    padding: 0,
    position: "relative" as const
  };

  const cardStyle: CSSProperties = {
    borderRadius: `${layout.mediaRadius}px`,
    boxShadow: `0 ${cssPx(CORNER_IMAGE_SHADOW.offsetY, refWidth)}px ${cssPx(CORNER_IMAGE_SHADOW.blur, refWidth)}px rgba(24, 24, 24, ${CORNER_IMAGE_SHADOW.opacity})`,
    height: `${layout.cardH}px`,
    left: `${layout.cardX}px`,
    outline: layout.borderPx > 0 ? `${layout.borderPx}px solid rgba(255, 255, 255, 0.96)` : "none",
    outlineOffset: layout.borderPx > 0 ? `-${layout.borderPx}px` : undefined,
    position: "absolute",
    top: `${layout.cardY}px`,
    width: `${layout.cardW}px`,
    zIndex: 1
  };

  const copyStyle: CSSProperties = {
    alignItems: isRight ? "flex-end" : "flex-start",
    bottom: isBottom ? `${layout.textPadY}px` : "auto",
    fontFamily: fontStack,
    left: isRight ? "auto" : `${layout.textPadX}px`,
    right: isRight ? `${layout.textPadX}px` : "auto",
    textAlign: isRight ? "right" : "left",
    top: isBottom ? "auto" : `${layout.textPadY}px`,
    zIndex: 2
  };

  return (
    <div
      ref={rootRef}
      className={surface(`card-preview card-preview-${variant} card-preview-corner`)}
      style={rootStyle}
    >
      <div className={surface("corner-preview-card")} style={cardStyle}>
        <div className="corner-preview-media">{renderMedia(mediaName)}</div>
      </div>
      <div className={surface("corner-preview-copy")} style={copyStyle}>
        {params.text.subtitle ? (
          <span
            className={surface("corner-preview-subtitle")}
            style={{ color: textColors.subtitle, fontSize: `${subtitlePx}px` }}
          >
            {params.text.subtitle.slice(0, 40)}
          </span>
        ) : null}
        <span
          className={surface("corner-preview-title")}
          style={{
            color: textColors.title,
            fontSize: `${titlePx}px`,
            marginTop: params.text.subtitle ? `${subtitlePx * 0.55}px` : 0
          }}
        >
          {params.text.title.slice(0, 64)}
        </span>
      </div>
    </div>
  );
}

function GridCardPreview({
  gridFrame,
  params,
  ratio,
  ratioNumber,
  variant,
  renderMedia,
  mediaName
}: {
  gridFrame: GridFrameConfig;
  params: TemplateParams;
  ratio: string;
  ratioNumber: number;
  variant: CardPreviewProps["variant"];
  renderMedia: (alt: string) => ReactNode;
  mediaName: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const measuredWidth = useElementWidth(rootRef);
  const refWidth = measuredWidth || GLASS_RADIUS_REF_WIDTH;
  const cells = getGridCellRects(gridFrame);
  const titleCell = cells[8];
  const lineColor = getGridLineColor(gridFrame.lineTone);
  const titleColor = getGridTitleColor(gridFrame.lineTone);
  const titleFontSize = cssPx(gridFrame.titleSize, refWidth);
  const stageStyle =
    variant === "stage"
      ? {
          ...getStagePreviewStyle(ratio, ratioNumber),
          background: params.canvas.background
        }
      : { aspectRatio: ratio, background: params.canvas.background };

  return (
    <div
      ref={rootRef}
      className={surface(`card-preview card-preview-${variant} card-preview-grid`)}
      style={stageStyle}
    >
      <div className="grid-preview-media">{renderMedia(mediaName)}</div>
      {cells.map((cell) => {
        const entry = gridFrame.cellEffects[cell.index];
        const overlay = getCellOverlayRgba(entry);
        if (!overlay) {
          return null;
        }

        return (
          <div
            key={cell.index}
            className={surface(`grid-preview-cell-effect is-${entry.effect}`)}
            style={{
              background: overlay,
              height: `${cell.height}%`,
              left: `${cell.left}%`,
              top: `${cell.top}%`,
              width: `${cell.width}%`
            }}
            aria-hidden="true"
          />
        );
      })}
      <svg
        aria-hidden="true"
        className="grid-preview-lines"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <rect
          fill="none"
          height="100"
          stroke={lineColor}
          strokeWidth={GRID_LINE_WIDTH_PX}
          vectorEffect="non-scaling-stroke"
          width="100"
          x="0"
          y="0"
        />
        <line
          className={surface()}
          stroke={lineColor}
          strokeWidth={GRID_LINE_WIDTH_PX}
          transform={`translate(${gridFrame.lineX1}, 0)`}
          vectorEffect="non-scaling-stroke"
          x1="0"
          x2="0"
          y1="0"
          y2="100"
        />
        <line
          className={surface()}
          stroke={lineColor}
          strokeWidth={GRID_LINE_WIDTH_PX}
          transform={`translate(${gridFrame.lineX2}, 0)`}
          vectorEffect="non-scaling-stroke"
          x1="0"
          x2="0"
          y1="0"
          y2="100"
        />
        <line
          className={surface()}
          stroke={lineColor}
          strokeWidth={GRID_LINE_WIDTH_PX}
          transform={`translate(0, ${gridFrame.lineY1})`}
          vectorEffect="non-scaling-stroke"
          x1="0"
          x2="100"
          y1="0"
          y2="0"
        />
        <line
          className={surface()}
          stroke={lineColor}
          strokeWidth={GRID_LINE_WIDTH_PX}
          transform={`translate(0, ${gridFrame.lineY2})`}
          vectorEffect="non-scaling-stroke"
          x1="0"
          x2="100"
          y1="0"
          y2="0"
        />
      </svg>
      <p
        className={surface("grid-preview-title")}
        style={{
          color: titleColor,
          fontFamily: getFontStack(params.text.fontFamily),
          fontSize: `${titleFontSize}px`,
          height: `${titleCell.height}%`,
          left: `${titleCell.left}%`,
          top: `${titleCell.top}%`,
          width: `${titleCell.width}%`
        }}
      >
        {params.text.title.slice(0, 20)}
      </p>
    </div>
  );
}

type FlutedCardPreviewProps = {
  flutedFrame: FlutedFrameConfig;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  params: TemplateParams;
  ratio: string;
  ratioNumber: number;
  variant: CardPreviewProps["variant"];
};

function FlutedCardPreview({
  flutedFrame,
  mediaUrl,
  mediaType = "image",
  params,
  ratio,
  ratioNumber,
  variant
}: FlutedCardPreviewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const measuredWidth = useElementWidth(rootRef);
  const refWidth = measuredWidth || 360;
  const frame = clampFlutedFrame(flutedFrame);
  const [contentRatio, setContentRatio] = useState(ratioNumber);

  useEffect(() => {
    setContentRatio(ratioNumber);
  }, [ratioNumber]);

  useEffect(() => {
    if (!mediaUrl || !canvasRef.current || refWidth <= 0) {
      return;
    }

    let cancelled = false;
    let video: HTMLVideoElement | undefined;

    async function renderPreview() {
      const sourceUrl = mediaUrl;
      if (!sourceUrl) {
        return;
      }

      let source: CanvasImageSource;
      let width: number;
      let height: number;

      if (mediaType === "video") {
        video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.src = sourceUrl;

        await new Promise<void>((resolve, reject) => {
          video!.onloadeddata = () => resolve();
          video!.onerror = () => reject(new Error("无法加载视频预览。"));
        });

        video.currentTime = 0;
        await new Promise<void>((resolve) => {
          video!.onseeked = () => resolve();
        });

        source = video;
        width = video.videoWidth;
        height = video.videoHeight;
      } else {
        const image = new Image();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error("无法加载图片预览。"));
          image.src = sourceUrl;
        });
        source = image;
        width = image.naturalWidth;
        height = image.naturalHeight;
      }

      if (cancelled || !canvasRef.current) {
        return;
      }

      const media = { source, width, height };
      const ratioNumberResolved = variant === "hero" ? ratioNumber : resolveFlutedRatioNumber(frame, width, height);
      const base = resolveExportDimensions(ratioNumberResolved, media, 1);
      const scale = refWidth / base.width;
      const rendered = renderFlutedFrame({ ...params, flutedFrame: frame }, media, scale);
      const canvas = canvasRef.current;
      canvas.width = rendered.width;
      canvas.height = rendered.height;
      const context = canvas.getContext("2d");
      context?.clearRect(0, 0, canvas.width, canvas.height);
      context?.drawImage(rendered, 0, 0);
      if (!cancelled) {
        setContentRatio(rendered.width / Math.max(rendered.height, 1));
      }
    }

    void renderPreview().catch((error) => {
      console.error("长虹玻璃预览渲染失败:", error);
      if (!cancelled && canvasRef.current) {
        const context = canvasRef.current.getContext("2d");
        context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    });

    return () => {
      cancelled = true;
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
    };
  }, [flutedFrame, mediaType, mediaUrl, params, refWidth, ratioNumber, variant]);

  const stageStyle =
    variant === "stage"
      ? {
          ...getStagePreviewStyle(String(contentRatio), contentRatio),
          background: "transparent"
        }
      : variant === "hero"
        ? {
            background: "transparent",
            height: "100%",
            width: "100%"
          }
        : {
            aspectRatio: ratio,
            background: "transparent"
          };

  return (
    <div
      ref={rootRef}
      className={surface(`card-preview card-preview-${variant} card-preview-fluted`)}
      style={stageStyle}
    >
      <canvas className="fluted-preview-canvas" ref={canvasRef} />
    </div>
  );
}

type SwatchCardPreviewProps = {
  swatchFrame: SwatchFrameConfig;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  params: TemplateParams;
  ratio: string;
  ratioNumber: number;
  variant: CardPreviewProps["variant"];
};

function SwatchCardPreview({
  swatchFrame,
  mediaUrl,
  mediaType = "image",
  params,
  ratio,
  ratioNumber,
  variant
}: SwatchCardPreviewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const measuredWidth = useElementWidth(rootRef);
  const refWidth = measuredWidth || 360;
  const frame = clampSwatchFrame(swatchFrame);
  const [contentRatio, setContentRatio] = useState(ratioNumber);

  useEffect(() => {
    setContentRatio(ratioNumber);
  }, [ratioNumber]);

  useEffect(() => {
    if (!mediaUrl || !canvasRef.current || refWidth <= 0) {
      return;
    }

    let cancelled = false;
    let video: HTMLVideoElement | undefined;

    async function renderPreview() {
      const sourceUrl = mediaUrl;
      if (!sourceUrl) {
        return;
      }

      let source: CanvasImageSource;
      let width: number;
      let height: number;

      if (mediaType === "video") {
        video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.src = sourceUrl;

        await new Promise<void>((resolve, reject) => {
          video!.onloadeddata = () => resolve();
          video!.onerror = () => reject(new Error("无法加载视频预览。"));
        });

        video.currentTime = 0;
        await new Promise<void>((resolve) => {
          video!.onseeked = () => resolve();
        });

        source = video;
        width = video.videoWidth;
        height = video.videoHeight;
      } else {
        const image = new Image();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error("无法加载图片预览。"));
          image.src = sourceUrl;
        });
        source = image;
        width = image.naturalWidth;
        height = image.naturalHeight;
      }

      if (cancelled || !canvasRef.current) {
        return;
      }

      const media = { source, width, height };
      const ratioNumberResolved = variant === "hero" ? ratioNumber : resolveSwatchRatioNumber(frame, width, height);
      const base = resolveExportDimensions(ratioNumberResolved, media, 1);
      const scale = refWidth / base.width;
      const rendered = renderSwatchFrame({ ...params, swatchFrame: frame }, media, scale);
      const canvas = canvasRef.current;
      canvas.width = rendered.width;
      canvas.height = rendered.height;
      const context = canvas.getContext("2d");
      context?.clearRect(0, 0, canvas.width, canvas.height);
      context?.drawImage(rendered, 0, 0);
      if (!cancelled) {
        setContentRatio(rendered.width / Math.max(rendered.height, 1));
      }
    }

    void renderPreview().catch((error) => {
      console.error("色谱预览渲染失败:", error);
      if (!cancelled && canvasRef.current) {
        const context = canvasRef.current.getContext("2d");
        context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    });

    return () => {
      cancelled = true;
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
    };
  }, [swatchFrame, mediaType, mediaUrl, params, refWidth, ratioNumber, variant]);

  const stageStyle =
    variant === "stage"
      ? {
          ...getStagePreviewStyle(String(contentRatio), contentRatio),
          background: "transparent"
        }
      : variant === "hero"
        ? {
            background: "transparent",
            height: "100%",
            width: "100%"
          }
        : {
            aspectRatio: ratio,
            background: "transparent"
          };

  return (
    <div
      ref={rootRef}
      className={surface(`card-preview card-preview-${variant} card-preview-swatch`)}
      style={stageStyle}
    >
      <canvas className="swatch-preview-canvas" ref={canvasRef} />
    </div>
  );
}

type DotCardPreviewProps = {
  dotFrame: DotFrameConfig;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  params: TemplateParams;
  ratio: string;
  ratioNumber: number;
  variant: CardPreviewProps["variant"];
};

function DotCardPreview({
  dotFrame,
  mediaUrl,
  mediaType = "image",
  params,
  ratio,
  ratioNumber,
  variant
}: DotCardPreviewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const measuredWidth = useElementWidth(rootRef);
  const refWidth = measuredWidth || 360;
  const frame = clampDotFrame(dotFrame);

  useEffect(() => {
    if (!mediaUrl || !canvasRef.current || refWidth <= 0) {
      return;
    }

    let cancelled = false;
    let video: HTMLVideoElement | undefined;

    async function renderPreview() {
      const sourceUrl = mediaUrl;
      if (!sourceUrl) {
        return;
      }

      let source: CanvasImageSource;
      let width: number;
      let height: number;

      if (mediaType === "video") {
        video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.src = sourceUrl;

        await new Promise<void>((resolve, reject) => {
          video!.onloadeddata = () => resolve();
          video!.onerror = () => reject(new Error("无法加载视频预览。"));
        });

        video.currentTime = 0;
        await new Promise<void>((resolve) => {
          video!.onseeked = () => resolve();
        });

        source = video;
        width = video.videoWidth;
        height = video.videoHeight;
      } else {
        const image = new Image();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error("无法加载图片预览。"));
          image.src = sourceUrl;
        });
        source = image;
        width = image.naturalWidth;
        height = image.naturalHeight;
      }

      if (cancelled || !canvasRef.current) {
        return;
      }

      const media = { source, width, height };
      const ratioNumberResolved = variant === "hero" ? ratioNumber : resolveDotRatioNumber(frame, width, height);
      const base = resolveExportDimensions(ratioNumberResolved, media, 1);
      const scale = refWidth / base.width;
      const rendered = renderDotFrame({ ...params, dotFrame: frame }, media, scale);
      const canvas = canvasRef.current;
      canvas.width = rendered.width;
      canvas.height = rendered.height;
      const context = canvas.getContext("2d");
      context?.clearRect(0, 0, canvas.width, canvas.height);
      context?.drawImage(rendered, 0, 0);
    }

    void renderPreview().catch((error) => {
      console.error("波点预览渲染失败:", error);
      if (!cancelled && canvasRef.current) {
        const context = canvasRef.current.getContext("2d");
        context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    });

    return () => {
      cancelled = true;
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
    };
  }, [dotFrame, mediaType, mediaUrl, params, refWidth, ratioNumber, variant]);

  const stageStyle =
    variant === "stage"
      ? {
          ...getStagePreviewStyle(ratio, ratioNumber),
          background: "transparent"
        }
      : variant === "hero"
        ? {
            background: "transparent",
            height: "100%",
            width: "100%"
          }
        : {
            aspectRatio: ratio,
            background: "transparent"
          };

  return (
    <div
      ref={rootRef}
      className={surface(`card-preview card-preview-${variant} card-preview-dot`)}
      style={stageStyle}
    >
      <canvas className="dot-preview-canvas" ref={canvasRef} />
    </div>
  );
}

type PrintCardPreviewProps = {
  printFrame: PrintFrameConfig;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  params: TemplateParams;
  ratio: string;
  ratioNumber: number;
  variant: CardPreviewProps["variant"];
};

function PrintCardPreview({
  printFrame,
  mediaUrl,
  mediaType = "image",
  params,
  ratio,
  ratioNumber,
  variant
}: PrintCardPreviewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const measuredWidth = useElementWidth(rootRef);
  // 取整，避免 ResizeObserver 亚像素抖动反复重绘
  const refWidth = Math.max(1, Math.round(measuredWidth || 360));
  const frame = clampPrintFrame(printFrame);
  const [contentRatio, setContentRatio] = useState(ratioNumber);
  const mediaCacheRef = useRef<{
    key: string;
    source: CanvasImageSource;
    width: number;
    height: number;
    video?: HTMLVideoElement;
  } | null>(null);

  useEffect(() => {
    setContentRatio((prev) => (Math.abs(prev - ratioNumber) > 0.002 ? ratioNumber : prev));
  }, [ratioNumber]);

  useEffect(() => {
    return () => {
      const cached = mediaCacheRef.current;
      if (cached?.video) {
        cached.video.pause();
        cached.video.removeAttribute("src");
        cached.video.load();
      }
      mediaCacheRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mediaUrl || !canvasRef.current || refWidth <= 0) {
      return;
    }

    let cancelled = false;

    async function loadMedia(sourceUrl: string) {
      const cacheKey = `${mediaType}|${sourceUrl}`;
      const cached = mediaCacheRef.current;
      if (cached?.key === cacheKey) {
        return cached;
      }

      if (cached?.video) {
        cached.video.pause();
        cached.video.removeAttribute("src");
        cached.video.load();
      }

      if (mediaType === "video") {
        const video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.src = sourceUrl;

        await new Promise<void>((resolve, reject) => {
          video.onloadeddata = () => resolve();
          video.onerror = () => reject(new Error("无法加载视频预览。"));
        });

        video.currentTime = 0;
        await new Promise<void>((resolve) => {
          video.onseeked = () => resolve();
        });

        const next = {
          key: cacheKey,
          source: video as CanvasImageSource,
          width: video.videoWidth,
          height: video.videoHeight,
          video
        };
        mediaCacheRef.current = next;
        return next;
      }

      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("无法加载图片预览。"));
        image.src = sourceUrl;
      });
      const next = {
        key: cacheKey,
        source: image as CanvasImageSource,
        width: image.naturalWidth,
        height: image.naturalHeight
      };
      mediaCacheRef.current = next;
      return next;
    }

    async function renderPreview() {
      const sourceUrl = mediaUrl;
      if (!sourceUrl) {
        return;
      }

      const loaded = await loadMedia(sourceUrl);
      if (cancelled || !canvasRef.current) {
        return;
      }

      const media = { source: loaded.source, width: loaded.width, height: loaded.height };
      const ratioNumberResolved =
        variant === "hero" ? ratioNumber : resolvePrintRatioNumber(frame, loaded.width, loaded.height);
      const base = resolveExportDimensions(ratioNumberResolved, media, 1);
      const scale = refWidth / base.width;
      const rendered = renderPrintFrame({ ...params, printFrame: frame }, media, scale, {
        cacheKey: sourceUrl
      });
      const canvas = canvasRef.current;
      canvas.width = rendered.width;
      canvas.height = rendered.height;
      const context = canvas.getContext("2d");
      context?.clearRect(0, 0, canvas.width, canvas.height);
      context?.drawImage(rendered, 0, 0);
      if (!cancelled) {
        const nextRatio = rendered.width / Math.max(rendered.height, 1);
        // 避免 contentRatio → 容器尺寸 → refWidth 反馈环导致网点不停重算
        setContentRatio((prev) => (Math.abs(prev - nextRatio) > 0.002 ? nextRatio : prev));
      }
    }

    void renderPreview().catch((error) => {
      console.error("网点预览渲染失败:", error);
      if (!cancelled && canvasRef.current) {
        const context = canvasRef.current.getContext("2d");
        context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    });

    return () => {
      cancelled = true;
    };
    // 只依赖会影响画面的字段；params 整体引用变化不应触发重绘
  }, [
    frame.seed,
    frame.canvasRatio,
    frame.windowMargin,
    frame.innerRadius,
    frame.borderWidth,
    frame.backingColor,
    mediaType,
    mediaUrl,
    refWidth,
    ratioNumber,
    variant
  ]);

  const stageStyle =
    variant === "stage"
      ? {
          ...getStagePreviewStyle(String(contentRatio), contentRatio),
          background: "transparent"
        }
      : variant === "hero"
        ? {
            background: "transparent",
            height: "100%",
            width: "100%"
          }
        : {
            aspectRatio: ratio,
            background: "transparent"
          };

  return (
    <div
      ref={rootRef}
      className={surface(`card-preview card-preview-${variant} card-preview-print`)}
      style={stageStyle}
    >
      <canvas className="print-preview-canvas" ref={canvasRef} />
    </div>
  );
}

export function CardPreview({
  params,
  templateId,
  mediaUrl,
  demoFill,
  mediaType = "image",
  mediaName = "preview",
  variant = "stage",
  framed = true
}: CardPreviewProps) {
  const template = templateId ? getTemplateById(templateId) : undefined;
  const refinedFrame = template?.family === "refined-blur-frame" ? params.refinedFrame : undefined;
  const gridFrame = template?.family === "grid-frame" ? params.gridFrame : undefined;
  const glassFrame = template?.family === "glass-frame" ? params.glassFrame : undefined;
  const glassSillFrame = template?.family === "glass-sill-frame" ? params.glassSillFrame : undefined;
  const bandFrame = template?.family === "band-frame" ? params.bandFrame : undefined;
  const cornerFrame = template?.family === "corner-frame" ? params.cornerFrame : undefined;
  const flutedFrame = template?.family === "fluted-frame" ? params.flutedFrame : undefined;
  const swatchFrame = template?.family === "swatch-frame" ? params.swatchFrame : undefined;
  const dotFrame = template?.family === "dot-frame" ? params.dotFrame : undefined;
  const printFrame = template?.family === "print-frame" ? params.printFrame : undefined;
  const imageRatio = useImageAspectRatio(mediaUrl, mediaType);
  const frameCanvasRatio =
    refinedFrame?.canvasRatio ??
    gridFrame?.canvasRatio ??
    glassFrame?.canvasRatio ??
    glassSillFrame?.canvasRatio ??
    bandFrame?.canvasRatio ??
    cornerFrame?.canvasRatio ??
    flutedFrame?.canvasRatio ??
    swatchFrame?.canvasRatio ??
    dotFrame?.canvasRatio ??
    printFrame?.canvasRatio;
  const { ratio, ratioNumber } =
    variant === "hero"
      ? { ratio: HERO_PREVIEW_RATIO, ratioNumber: HERO_PREVIEW_RATIO_NUMBER }
      : resolveCanvasRatio(frameCanvasRatio, imageRatio ?? undefined, params.canvas.ratio);

  function renderMedia(alt: string) {
    if (mediaUrl && mediaType === "image") {
      return <img alt={alt} src={mediaUrl} />;
    }

    if (mediaUrl) {
      return <video autoPlay loop muted playsInline src={mediaUrl} />;
    }

    if (demoFill) {
      return <div className="card-preview-demo" style={{ background: demoFill }} />;
    }

    return <div className="card-preview-placeholder">素材预览</div>;
  }

  if (framed && refinedFrame) {
    return (
      <RefinedCardPreview
        mediaName={mediaName}
        params={params}
        ratio={ratio}
        ratioNumber={ratioNumber}
        refinedFrame={refinedFrame}
        renderMedia={renderMedia}
        variant={variant}
      />
    );
  }

  if (framed && gridFrame) {
    return (
      <GridCardPreview
        gridFrame={gridFrame}
        mediaName={mediaName}
        params={params}
        ratio={ratio}
        ratioNumber={ratioNumber}
        renderMedia={renderMedia}
        variant={variant}
      />
    );
  }

  if (framed && glassSillFrame) {
    return (
      <GlassSillCardPreview
        glassSillFrame={glassSillFrame}
        mediaName={mediaName}
        mediaType={mediaType}
        mediaUrl={mediaUrl}
        params={params}
        ratio={ratio}
        ratioNumber={ratioNumber}
        renderMedia={renderMedia}
        variant={variant}
      />
    );
  }

  if (framed && glassFrame) {
    return (
      <GlassCardPreview
        glassFrame={glassFrame}
        mediaName={mediaName}
        mediaType={mediaType}
        mediaUrl={mediaUrl}
        params={params}
        ratio={ratio}
        ratioNumber={ratioNumber}
        renderMedia={renderMedia}
        variant={variant}
      />
    );
  }

  if (framed && flutedFrame) {
    return (
      <FlutedCardPreview
        flutedFrame={flutedFrame}
        mediaType={mediaType}
        mediaUrl={mediaUrl}
        params={params}
        ratio={ratio}
        ratioNumber={ratioNumber}
        variant={variant}
      />
    );
  }

  if (framed && swatchFrame) {
    return (
      <SwatchCardPreview
        swatchFrame={swatchFrame}
        mediaType={mediaType}
        mediaUrl={mediaUrl}
        params={params}
        ratio={ratio}
        ratioNumber={ratioNumber}
        variant={variant}
      />
    );
  }

  if (framed && printFrame) {
    return (
      <PrintCardPreview
        printFrame={printFrame}
        mediaType={mediaType}
        mediaUrl={mediaUrl}
        params={params}
        ratio={ratio}
        ratioNumber={ratioNumber}
        variant={variant}
      />
    );
  }

  if (framed && dotFrame) {
    return (
      <DotCardPreview
        dotFrame={dotFrame}
        mediaType={mediaType}
        mediaUrl={mediaUrl}
        params={params}
        ratio={ratio}
        ratioNumber={ratioNumber}
        variant={variant}
      />
    );
  }

  if (framed && bandFrame) {
    return (
      <BandCardPreview
        bandFrame={bandFrame}
        mediaName={mediaName}
        params={params}
        ratio={ratio}
        ratioNumber={ratioNumber}
        renderMedia={renderMedia}
        variant={variant}
      />
    );
  }

  if (framed && cornerFrame) {
    return (
      <CornerCardPreview
        cornerFrame={cornerFrame}
        mediaName={mediaName}
        params={params}
        ratio={ratio}
        ratioNumber={ratioNumber}
        renderMedia={renderMedia}
        variant={variant}
      />
    );
  }

  return (
    <div
      className={surface(`card-preview card-preview-${variant}${framed ? " is-framed" : " is-raw"}`)}
      style={{ background: framed ? params.canvas.background : "transparent" }}
    >
      {framed ? <p className="card-preview-subtitle">{params.text.subtitle}</p> : null}
      <div
        className={surface("card-preview-media")}
        style={{
          aspectRatio: ratio,
          borderColor: framed ? params.media.borderColor : "transparent",
          borderRadius: framed ? params.media.radius : 0,
          borderWidth: framed ? params.media.borderWidth : 0,
          boxShadow: framed
            ? `0 ${params.media.shadow.offsetY}px ${params.media.shadow.blur}px rgba(24, 24, 24, ${params.media.shadow.opacity})`
            : "none"
        }}
      >
        {renderMedia(mediaName)}
      </div>
      {framed ? (
        <>
          <h3 className={surface("card-preview-title")} style={{ color: params.text.titleColor }}>
            {params.text.title}
          </h3>
          <p className="card-preview-credit">{params.text.credit}</p>
        </>
      ) : null}
    </div>
  );
}
