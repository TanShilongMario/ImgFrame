import heroAsset from "../media/Asset_1.png";
import { HERO_ASSET_RATIO } from "../media/heroAsset";
import { HeroTemplateCard } from "./components/HeroTemplateCard";

type CeremonyPhase = "idle" | "reading" | "transforming" | "done";

type HeroPageProps = {
  isBusy: boolean;
  ceremonyPhase: CeremonyPhase;
  onUpload: (file?: File) => void;
  onScrollDown: () => void;
};

export function HeroPage({ isBusy, ceremonyPhase, onUpload, onScrollDown }: HeroPageProps) {
  const isCeremony = ceremonyPhase !== "idle";

  return (
    <div
      className="hero-page"
      style={{ "--hero-asset-ratio": String(HERO_ASSET_RATIO) } as React.CSSProperties}
    >
      <div className="hero-copy">
        <h1 className="hero-title">Your photo, instantly framed.</h1>
        <p className="hero-lead">
          Upload what you already have. FrameForge wraps it in a polished card, ready to post without design work.
        </p>
        <label className="hero-upload">
          <input
            accept="image/*,video/*"
            disabled={isBusy}
            type="file"
            onChange={(event) => onUpload(event.target.files?.[0])}
          />
          Try from a Photo
        </label>
      </div>

      <div aria-hidden="true" className="hero-showcase">
        <figure className="hero-raw">
          <img alt="原始素材" src={heroAsset} />
        </figure>
        <HeroTemplateCard
          credit="Made by FrameForge"
          imageAlt="模版包装效果"
          imageSrc={heroAsset}
        />
      </div>

      {isCeremony ? (
        <div className="hero-ceremony">
          <div className="hero-ceremony-card">
            <p className="hero-ceremony-label">
              {ceremonyPhase === "reading"
                ? "正在读取素材"
                : ceremonyPhase === "transforming"
                  ? "正在生成展示卡片"
                  : "即将进入编辑器"}
            </p>
            <div className="hero-ceremony-bar">
              <span className={`hero-ceremony-progress is-${ceremonyPhase}`} aria-hidden="true" />
            </div>
          </div>
        </div>
      ) : null}

      <button
        aria-label="进入编辑器"
        className="scroll-hint scroll-hint-down"
        type="button"
        onClick={onScrollDown}
      >
        <span className="scroll-hint-icon" aria-hidden="true" />
      </button>
    </div>
  );
}

export type { CeremonyPhase };
