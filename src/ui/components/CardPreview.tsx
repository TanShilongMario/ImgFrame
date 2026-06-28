import type { CanvasRatio, TemplateParams } from "../../types";
import { getTemplateById } from "../../templates/registry";
import { useImageAspectRatio } from "../../hooks/useImageAspectRatio";

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
    const gradientBackground =
      refinedFrame.gradientTone === "white"
        ? "linear-gradient(0deg, #ffffff 0%, #fffffffd 3%, rgba(255, 255, 255, 0) 41%)"
        : "linear-gradient(0deg, #111111 0%, rgba(17, 17, 17, 0.98) 3%, rgba(17, 17, 17, 0) 41%)";
    const creditColor = refinedFrame.gradientTone === "white" ? "rgba(34, 34, 31, 0.62)" : "rgba(255, 255, 255, 0.78)";
    const visibleWidth = 100 - refinedFrame.cropWidth;
    const verticalInset = refinedFrame.cropHeight / 2;
    const stageWidthPercent = Math.min(92, Math.max(52, 62 + (ratioNumber - 1) * 24));
    const stageStyle =
      variant === "stage"
        ? {
            aspectRatio: ratio,
            background: params.canvas.background,
            width: `${stageWidthPercent}%`
          }
        : { aspectRatio: ratio, background: params.canvas.background };

    return (
      <div
        className={`card-preview card-preview-${variant} card-preview-refined`}
        style={stageStyle}
      >
        <div className="refined-preview-bg" style={{ filter: `blur(${refinedFrame.backgroundBlur}px)` }} aria-hidden="true">
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
          <p className="refined-preview-credit" style={{ color: creditColor }}>
            {params.text.credit}
          </p>
        </div>
      </div>
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
