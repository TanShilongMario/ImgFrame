import type {
  BandFrameConfig,
  CanvasRatio,
  GlassFrameConfig,
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
  fallbackSystemColor,
  getBandCardRadiusPx,
  getBandTextColors,
  resolveBandColor,
  sampleAverageColorFromUrl
} from "../../templates/bandFrame";
import { getFontStack } from "../../templates/fonts";
import { useElementWidth } from "../../hooks/useElementWidth";
import { useImageAspectRatio } from "../../hooks/useImageAspectRatio";
import { getStagePreviewStyle } from "../../preview/stagePreviewStyle";
import { combinePreviewSurface as surface } from "../../preview/previewParamTransition";
import { cssPx } from "../../utils/cssPx";
import { useEffect, useRef, useState, type ReactNode } from "react";

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
};

function GlassCardPreview({
  glassFrame,
  mediaUrl,
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
  const [sampledBackingHex, setSampledBackingHex] = useState<string | undefined>(glassFrame.backingHex);

  useEffect(() => {
    setSampledBackingHex(glassFrame.backingHex);
  }, [glassFrame.backingHex]);

  useEffect(() => {
    if (glassFrame.backingHex || !mediaUrl) {
      return;
    }

    let cancelled = false;
    void sampleAverageColorFromUrl(mediaUrl)
      .then((average) => {
        if (!cancelled) {
          setSampledBackingHex(fallbackSystemColor(average, "backing"));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSampledBackingHex(GLASS_BACKING_COLOR);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [glassFrame.backingHex, mediaUrl]);

  const backingColor = resolveGlassBackingColor(sampledBackingHex);
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
          <h3 className={surface()} style={{ color: textColors.title }}>
            {params.text.title.slice(0, 24)}
          </h3>
          <p className={surface()} style={{ color: textColors.subtitle }}>
            {params.text.subtitle.slice(0, 48)}
          </p>
        </div>
      </div>
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
          style={{ color: creditColor, fontFamily: getFontStack(params.text.fontFamily) }}
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
              {params.text.subtitle.slice(0, 24)}
            </span>
            <span
              className={surface("band-preview-title")}
              style={{ color: textColors.title, fontSize: `${titlePx}px` }}
            >
              {params.text.title.slice(0, 40)}
            </span>
          </div>
        </div>
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
  const cells = getGridCellRects(gridFrame);
  const titleCell = cells[8];
  const lineColor = getGridLineColor(gridFrame.lineTone);
  const titleColor = getGridTitleColor(gridFrame.lineTone);
  const stageStyle =
    variant === "stage"
      ? {
          ...getStagePreviewStyle(ratio, ratioNumber),
          background: params.canvas.background
        }
      : { aspectRatio: ratio, background: params.canvas.background };

  return (
    <div
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
          height: `${titleCell.height}%`,
          left: `${titleCell.left}%`,
          top: `${titleCell.top}%`,
          width: `${titleCell.width}%`
        }}
      >
        {params.text.title.slice(0, 10)}
      </p>
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
  const bandFrame = template?.family === "band-frame" ? params.bandFrame : undefined;
  const imageRatio = useImageAspectRatio(mediaUrl);
  const frameCanvasRatio =
    refinedFrame?.canvasRatio ?? gridFrame?.canvasRatio ?? glassFrame?.canvasRatio ?? bandFrame?.canvasRatio;
  const { ratio, ratioNumber } = resolveCanvasRatio(frameCanvasRatio, imageRatio ?? undefined, params.canvas.ratio);

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

  if (framed && glassFrame) {
    return (
      <GlassCardPreview
        glassFrame={glassFrame}
        mediaName={mediaName}
        mediaUrl={mediaUrl}
        params={params}
        ratio={ratio}
        ratioNumber={ratioNumber}
        renderMedia={renderMedia}
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
