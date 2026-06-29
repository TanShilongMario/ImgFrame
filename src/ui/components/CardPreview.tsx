import type { BandFrameConfig, CanvasRatio, GlassFrameConfig, TemplateParams } from "../../types";
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
  getGlassInsets,
  getGlassOuterRadiusPx,
  getGlassTextColors,
  getGlassWindowMediaStyle,
  GLASS_FROST_ALPHA
} from "../../templates/glassFrame";
import {
  getBandCardRadiusPx,
  getBandTextColors,
  resolveBandColor
} from "../../templates/bandFrame";
import { getFontStack } from "../../templates/fonts";
import { useElementWidth } from "../../hooks/useElementWidth";
import { useImageAspectRatio } from "../../hooks/useImageAspectRatio";
import { getStagePreviewStyle } from "../../preview/stagePreviewStyle";
import { cssPx } from "../../utils/cssPx";
import { useRef, type ReactNode } from "react";

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

type GlassCardPreviewProps = {
  glassFrame: GlassFrameConfig;
  params: TemplateParams;
  ratio: string;
  ratioNumber: number;
  variant: CardPreviewProps["variant"];
  renderMedia: (alt: string) => ReactNode;
  mediaName: string;
};

function GlassCardPreview({
  glassFrame,
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
  const insets = getGlassInsets(glassFrame);
  const textColors = getGlassTextColors(glassFrame.textTone);
  const outerRadiusPx = getGlassOuterRadiusPx(refWidth);
  const innerRadiusPx = getGlassInnerRadiusPx(glassFrame.edgeWidth, refWidth);
  const windowMediaStyle = getGlassWindowMediaStyle(insets);
  const blurPx = cssPx(glassFrame.blur, refWidth);
  const textInsetX = cssPx(18, refWidth);
  const textInsetY = cssPx(22, refWidth);
  const outerRadiusStyle = `${outerRadiusPx}px`;
  const stageStyle =
    variant === "stage"
      ? {
          ...getStagePreviewStyle(ratio, ratioNumber),
          background: params.canvas.background,
          borderRadius: outerRadiusStyle
        }
      : variant === "hero"
        ? {
            background: "transparent",
            borderRadius: outerRadiusStyle,
            height: "100%",
            width: "100%"
        }
        : {
            aspectRatio: ratio,
            background: variant === "gallery" || variant === "thumb" ? "transparent" : params.canvas.background,
            borderRadius: outerRadiusStyle
          };

  return (
    <div
      ref={rootRef}
      className={`card-preview card-preview-${variant} card-preview-glass`}
      style={stageStyle}
    >
      <div className="glass-preview-plate">
        <div className="glass-preview-plate-media">{renderMedia(mediaName)}</div>
        <div
          aria-hidden="true"
          className="glass-preview-plate-frost"
          style={{
            backdropFilter: `blur(${blurPx}px) saturate(1.04)`,
            WebkitBackdropFilter: `blur(${blurPx}px) saturate(1.04)`,
            background: `rgba(255, 255, 255, ${GLASS_FROST_ALPHA})`
          }}
        />
        <div aria-hidden="true" className="glass-preview-outer-border" />
      </div>
      <div
        className="glass-preview-window"
        style={{
          borderRadius: `${innerRadiusPx}px`,
          bottom: `${insets.bottom}%`,
          left: `${insets.left}%`,
          right: `${insets.right}%`,
          top: `${insets.top}%`
        }}
      >
        <div className="glass-preview-window-media" style={windowMediaStyle}>
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
          <h3 style={{ color: textColors.title }}>{params.text.title.slice(0, 24)}</h3>
          <p style={{ color: textColors.subtitle }}>{params.text.subtitle.slice(0, 48)}</p>
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
      className={`card-preview card-preview-${variant} card-preview-refined`}
      style={stageStyle}
    >
      <div className="refined-preview-bg" style={{ filter: `blur(${blurPx}px)` }} aria-hidden="true">
        {renderMedia("")}
      </div>
      <div
        className="refined-preview-frame"
        style={{
          bottom: `${verticalInset}%`,
          top: `${verticalInset}%`,
          width: `${visibleWidth}%`
        }}
      >
        {renderMedia(mediaName)}
        <div className="refined-preview-gradient" style={{ background: gradientBackground }} aria-hidden="true" />
        <p
          className="refined-preview-credit"
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
      className={`card-preview card-preview-${variant} card-preview-band`}
      style={rootStyle}
    >
      <div className="band-preview-card" style={{ borderRadius: `${radiusPx}px` }}>
        <div className="band-preview-media">{renderMedia(mediaName)}</div>
        <div
          className="band-preview-band"
          style={{ background: bandHex, height: `${bandFrame.bandHeight}%` }}
        >
          <div
            className="band-preview-copy"
            style={{ fontFamily: fontStack, paddingLeft: `${padX}px`, paddingRight: `${padX}px` }}
          >
            <span
              className="band-preview-subtitle"
              style={{ color: textColors.subtitle, fontSize: `${subtitlePx}px` }}
            >
              {params.text.subtitle.slice(0, 24)}
            </span>
            <span
              className="band-preview-title"
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
  let ratio: string;
  let ratioNumber = ratioNumberMap[params.canvas.ratio];
  if (refinedFrame) {
    if (refinedFrame.canvasRatio === "auto") {
      ratio = imageRatio ? String(imageRatio) : ratioMap[params.canvas.ratio];
      ratioNumber = imageRatio ?? ratioNumberMap[params.canvas.ratio];
    } else {
      ratio = ratioMap[refinedFrame.canvasRatio];
      ratioNumber = ratioNumberMap[refinedFrame.canvasRatio];
    }
  } else if (gridFrame) {
    if (gridFrame.canvasRatio === "auto") {
      ratio = imageRatio ? String(imageRatio) : ratioMap[params.canvas.ratio];
      ratioNumber = imageRatio ?? ratioNumberMap[params.canvas.ratio];
    } else {
      ratio = ratioMap[gridFrame.canvasRatio];
      ratioNumber = ratioNumberMap[gridFrame.canvasRatio];
    }
  } else if (glassFrame) {
    if (glassFrame.canvasRatio === "auto") {
      ratio = imageRatio ? String(imageRatio) : ratioMap[params.canvas.ratio];
      ratioNumber = imageRatio ?? ratioNumberMap[params.canvas.ratio];
    } else {
      ratio = ratioMap[glassFrame.canvasRatio];
      ratioNumber = ratioNumberMap[glassFrame.canvasRatio];
    }
  } else if (bandFrame) {
    if (bandFrame.canvasRatio === "auto") {
      ratio = imageRatio ? String(imageRatio) : ratioMap[params.canvas.ratio];
      ratioNumber = imageRatio ?? ratioNumberMap[params.canvas.ratio];
    } else {
      ratio = ratioMap[bandFrame.canvasRatio];
      ratioNumber = ratioNumberMap[bandFrame.canvasRatio];
    }
  } else {
    ratio = ratioMap[params.canvas.ratio];
    ratioNumber = ratioNumberMap[params.canvas.ratio];
  }

  function renderMedia(alt: string) {
    if (mediaUrl && mediaType === "image") {
      return <img alt={alt} src={mediaUrl} />;
    }

    if (mediaUrl) {
      return <video muted playsInline src={mediaUrl} />;
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
        className={`card-preview card-preview-${variant} card-preview-grid`}
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
              className={`grid-preview-cell-effect is-${entry.effect}`}
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
          <line stroke={lineColor} strokeWidth={GRID_LINE_WIDTH_PX} vectorEffect="non-scaling-stroke" x1={gridFrame.lineX1} x2={gridFrame.lineX1} y1="0" y2="100" />
          <line stroke={lineColor} strokeWidth={GRID_LINE_WIDTH_PX} vectorEffect="non-scaling-stroke" x1={gridFrame.lineX2} x2={gridFrame.lineX2} y1="0" y2="100" />
          <line stroke={lineColor} strokeWidth={GRID_LINE_WIDTH_PX} vectorEffect="non-scaling-stroke" x1="0" x2="100" y1={gridFrame.lineY1} y2={gridFrame.lineY1} />
          <line stroke={lineColor} strokeWidth={GRID_LINE_WIDTH_PX} vectorEffect="non-scaling-stroke" x1="0" x2="100" y1={gridFrame.lineY2} y2={gridFrame.lineY2} />
        </svg>
        <p
          className="grid-preview-title"
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

  if (framed && glassFrame) {
    return (
      <GlassCardPreview
        glassFrame={glassFrame}
        mediaName={mediaName}
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
      className={`card-preview card-preview-${variant}${framed ? " is-framed" : " is-raw"}`}
      style={{ background: framed ? params.canvas.background : "transparent" }}
    >
      {framed ? <p className="card-preview-subtitle">{params.text.subtitle}</p> : null}
      <div
        className="card-preview-media"
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
          <h3 className="card-preview-title" style={{ color: params.text.titleColor }}>
            {params.text.title}
          </h3>
          <p className="card-preview-credit">{params.text.credit}</p>
        </>
      ) : null}
    </div>
  );
}
