import type { CSSProperties, MouseEvent } from "react";
import type { TemplateParams } from "../../types";
import { HeroTemplateCard } from "./HeroTemplateCard";

type HeroShowcaseProps = {
  rawImageSrc: string;
  heroAssetRatio: number;
  templateId: string;
  params: TemplateParams;
  onSwapRawImage: () => void;
  onRandomizeTemplate: () => void;
  onRawEnter: (event: MouseEvent<HTMLElement>) => void;
  onRawLeave: (event: MouseEvent<HTMLElement>) => void;
  className?: string;
};

export function HeroShowcase({
  rawImageSrc,
  heroAssetRatio,
  templateId,
  params,
  onSwapRawImage,
  onRandomizeTemplate,
  onRawEnter,
  onRawLeave,
  className
}: HeroShowcaseProps) {
  return (
    <div aria-hidden="true" className={className ? `hero-showcase ${className}` : "hero-showcase"}>
      <figure
        className="hero-raw hero-hover-card"
        onClick={onSwapRawImage}
        onMouseEnter={onRawEnter}
        onMouseLeave={onRawLeave}
        style={{ "--hero-raw-ratio": String(heroAssetRatio) } as CSSProperties}
      >
        <img alt="原始素材" src={rawImageSrc} />
      </figure>
      <HeroTemplateCard
        imageAlt="模版包装效果"
        imageSrc={rawImageSrc}
        onRandomize={onRandomizeTemplate}
        params={params}
        templateId={templateId}
      />
    </div>
  );
}
