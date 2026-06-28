import type { CanvasRatio, RefinedFrameConfig, TemplateParams } from "../../types";

const heroRatioMap: Record<CanvasRatio, string> = {
  "1:1": "1 / 1",
  "4:5": "4 / 5",
  "4:3": "4 / 3",
  "3:4": "3 / 4",
  "9:16": "9 / 16",
  "16:9": "16 / 9"
};

type HeroTemplateCardProps = {
  imageSrc: string;
  imageAlt: string;
  params: TemplateParams;
  aspectRatio?: number;
  onRandomize?: () => void;
};

export function HeroTemplateCard({
  imageSrc,
  imageAlt,
  params,
  aspectRatio,
  onRandomize
}: HeroTemplateCardProps) {
  const refined = params.refinedFrame as RefinedFrameConfig | undefined;

  if (!refined) {
    return null;
  }

  const resolvedRatio =
    refined.canvasRatio === "auto"
      ? aspectRatio
        ? String(aspectRatio)
        : undefined
      : heroRatioMap[refined.canvasRatio];

  const visibleWidth = 100 - refined.cropWidth;
  const verticalInset = refined.cropHeight / 2;
  const gradientBackground =
    refined.gradientTone === "white"
      ? "linear-gradient(0deg, #ffffff 0%, #fffffffd 3%, rgba(255, 255, 255, 0) 41%)"
      : "linear-gradient(0deg, #111111 0%, rgba(17, 17, 17, 0.98) 3%, rgba(17, 17, 17, 0) 41%)";
  const creditColor =
    refined.gradientTone === "white" ? "rgba(34, 34, 31, 0.62)" : "rgba(255, 255, 255, 0.78)";

  function handleEnter(event: React.MouseEvent<HTMLElement>) {
    const rotation = (Math.random() * 4 - 2).toFixed(2);
    event.currentTarget.style.setProperty("--hero-hover-rotate", `${rotation}deg`);
  }

  function handleLeave(event: React.MouseEvent<HTMLElement>) {
    event.currentTarget.style.setProperty("--hero-hover-rotate", "0deg");
  }

  return (
    <article
      aria-label="模版包装效果预览"
      className="hero-template-card hero-hover-card"
      onClick={onRandomize}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={resolvedRatio ? { aspectRatio: resolvedRatio } : undefined}
    >
      <div aria-hidden="true" className="hero-template-bg" style={{ filter: `blur(${refined.backgroundBlur}px)` }}>
        <img alt="" src={imageSrc} />
      </div>
      <div
        className="hero-template-frame"
        style={{
          bottom: `${verticalInset}%`,
          top: `${verticalInset}%`,
          width: `${visibleWidth}%`
        }}
      >
        <img alt={imageAlt} src={imageSrc} />
        <div aria-hidden="true" className="hero-template-gradient" style={{ background: gradientBackground }} />
        <p className="hero-template-credit" style={{ color: creditColor }}>
          {params.text.credit}
        </p>
      </div>
    </article>
  );
}
