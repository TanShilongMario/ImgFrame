import type { TemplateParams } from "../../types";
import { CardPreview } from "./CardPreview";

type HeroTemplateCardProps = {
  templateId: string;
  imageSrc: string;
  imageAlt: string;
  params: TemplateParams;
  onRandomize?: () => void;
};

export function HeroTemplateCard({
  templateId,
  imageSrc,
  imageAlt,
  params,
  onRandomize
}: HeroTemplateCardProps) {
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
    >
      <CardPreview
        framed
        mediaName={imageAlt}
        mediaUrl={imageSrc}
        params={params}
        templateId={templateId}
        variant="hero"
      />
    </article>
  );
}
