type HeroTemplateCardProps = {
  imageSrc: string;
  imageAlt: string;
  credit?: string;
};

export function HeroTemplateCard({
  imageSrc,
  imageAlt,
  credit = "Made by FrameForge"
}: HeroTemplateCardProps) {
  return (
    <article aria-label="模版包装效果预览" className="hero-template-card">
      <div aria-hidden="true" className="hero-template-bg">
        <img alt="" src={imageSrc} />
      </div>
      <div className="hero-template-frame">
        <img alt={imageAlt} src={imageSrc} />
        <div aria-hidden="true" className="hero-template-gradient" />
        <p className="hero-template-credit">{credit}</p>
      </div>
    </article>
  );
}
