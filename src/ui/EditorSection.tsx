import { getTemplateById } from "../templates/registry";
import type { MediaAsset, Project, RefinedFrameConfig, TemplateParams } from "../types";
import { CardPreview } from "./components/CardPreview";
import { StageActionButton } from "./components/StageActionButton";
import { Sidebar } from "./components/Sidebar";

type EditorSectionProps = {
  project: Project | null;
  mediaAsset: MediaAsset | null;
  mediaUrl?: string;
  status: string;
  isBusy: boolean;
  editorRailsVisible: boolean;
  projectsCount: number;
  templateListOpen: boolean;
  archiveOpen: boolean;
  frameOpen: boolean;
  onUpload: (file?: File) => void;
  onNavigate: (section: "hero" | "editor" | "gallery") => void;
  onToggleTemplateList: () => void;
  onToggleArchive: () => void;
  onToggleFrame: () => void;
  onShuffleParams: () => void;
  onSaveToAlbum: () => void;
  onDownloadResult: () => void;
  onUpdateTemplateParams: (params: TemplateParams) => void;
};

export function EditorSection({
  project,
  mediaAsset,
  mediaUrl,
  status,
  isBusy,
  editorRailsVisible,
  projectsCount,
  templateListOpen,
  archiveOpen,
  frameOpen,
  onUpload,
  onNavigate,
  onToggleTemplateList,
  onToggleArchive,
  onToggleFrame,
  onShuffleParams,
  onSaveToAlbum,
  onDownloadResult,
  onUpdateTemplateParams
}: EditorSectionProps) {
  const activeTemplate = project ? getTemplateById(project.templateId) : undefined;
  const refinedFrame =
    activeTemplate?.family === "refined-blur-frame" ? project?.templateParams.refinedFrame : undefined;

  function updateRefinedFrame(nextFrame: RefinedFrameConfig) {
    if (!project) {
      return;
    }

    onUpdateTemplateParams({
      ...project.templateParams,
      refinedFrame: nextFrame
    });
  }

  function updateCredit(credit: string) {
    if (!project) {
      return;
    }

    onUpdateTemplateParams({
      ...project.templateParams,
      text: {
        ...project.templateParams.text,
        credit: credit.slice(0, 48)
      }
    });
  }

  return (
    <>
      <div className={`workspace-shell${editorRailsVisible ? " is-rails-visible" : ""}`}>
        <Sidebar
        archiveOpen={archiveOpen}
        mediaType={mediaAsset?.type}
        projectsCount={projectsCount}
        templateListOpen={templateListOpen}
        onToggleArchive={onToggleArchive}
        onToggleTemplateList={onToggleTemplateList}
      />

      <section className="stage">
        <div className="stage-stack">
          {!project ? (
            <label className="hero-dropzone">
              <input
                accept="image/*,video/*"
                disabled={isBusy}
                type="file"
                onChange={(event) => onUpload(event.target.files?.[0])}
              />
              <span className="upload-glyph" aria-hidden="true" />
              <span className="hero-action">上传图片，或从画廊选择模板</span>
            </label>
          ) : (
            <CardPreview
              mediaName={mediaAsset?.name}
              mediaType={mediaAsset?.type}
              mediaUrl={mediaUrl}
              params={project.templateParams}
              templateId={project.templateId}
              variant="stage"
            />
          )}

          <div className="stage-actions">
            <StageActionButton
              disabled={isBusy}
              kind="upload"
              label="上传素材"
              title="上传素材"
              onUpload={onUpload}
            />
            <StageActionButton
              disabled={!project}
              kind="random"
              label="随机"
              title="参数随机"
              onClick={onShuffleParams}
            />
            <StageActionButton
              className="stage-action-primary"
              disabled={!project}
              kind="save"
              label="保存至画册"
              title="保存至画册"
              onClick={onSaveToAlbum}
            />
            <StageActionButton
              className="stage-action-download"
              disabled={!project || !mediaAsset || isBusy}
              kind="download"
              label="下载结果图"
              title="下载结果图"
              onClick={onDownloadResult}
            />
          </div>
        </div>
      </section>

      <aside className="inspector workspace-rail">
        <div className="workspace-rail-panel">
        <section className={`panel control-panel ${frameOpen ? "is-expanded" : "is-collapsed"}`}>
          <button className="panel-heading" type="button" onClick={onToggleFrame}>
            <span>Frame</span>
            <span className="panel-chevron" aria-hidden="true" />
          </button>
          <div className="panel-content">
            <Field label="Template" value={activeTemplate?.name ?? "-"} />
            {refinedFrame ? (
              <>
                <div className="field field-control">
                  <span>画布比例</span>
                  <div className="segmented-control segmented-control-wrap">
                    {(["16:9", "4:3", "1:1", "3:4", "9:16", "auto"] as const).map((option) => (
                      <button
                        key={option}
                        className={refinedFrame.canvasRatio === option ? "is-active" : ""}
                        type="button"
                        onClick={() => updateRefinedFrame({ ...refinedFrame, canvasRatio: option })}
                      >
                        {option === "auto" ? "随原图" : option}
                      </button>
                    ))}
                  </div>
                </div>
                <RangeControl
                  label="裁剪宽度"
                  max={50}
                  min={0}
                  step={1}
                  suffix="%"
                  value={refinedFrame.cropWidth}
                  onChange={(value) => updateRefinedFrame({ ...refinedFrame, cropWidth: value })}
                />
                <RangeControl
                  label="裁剪高度"
                  max={50}
                  min={0}
                  step={1}
                  suffix="%"
                  value={refinedFrame.cropHeight}
                  onChange={(value) => updateRefinedFrame({ ...refinedFrame, cropHeight: value })}
                />
                <RangeControl
                  label="背景模糊度"
                  max={60}
                  min={0}
                  step={1}
                  suffix="px"
                  value={refinedFrame.backgroundBlur}
                  onChange={(value) => updateRefinedFrame({ ...refinedFrame, backgroundBlur: value })}
                />
                <div className="field field-control">
                  <span>渐变颜色</span>
                  <div className="segmented-control">
                    <button
                      className={refinedFrame.gradientTone === "white" ? "is-active" : ""}
                      type="button"
                      onClick={() => updateRefinedFrame({ ...refinedFrame, gradientTone: "white" })}
                    >
                      白
                    </button>
                    <button
                      className={refinedFrame.gradientTone === "black" ? "is-active" : ""}
                      type="button"
                      onClick={() => updateRefinedFrame({ ...refinedFrame, gradientTone: "black" })}
                    >
                      黑
                    </button>
                  </div>
                </div>
                <label className="field text-control">
                  <span>文字内容</span>
                  <textarea
                    maxLength={48}
                    value={project?.templateParams.text.credit ?? ""}
                    onChange={(event) => updateCredit(event.target.value)}
                  />
                </label>
              </>
            ) : (
              <>
                <Field label="Ratio" value={project?.templateParams.canvas.ratio ?? "-"} />
                <Field label="Background" value={project?.templateParams.canvas.background ?? "-"} />
                <Field label="Round Corner" value={`${project?.templateParams.media.radius ?? 0}`} />
                <Field label="Border" value={`${project?.templateParams.media.borderWidth ?? 0}`} />
              </>
            )}
          </div>
        </section>

        <section className="inspector-summary">
          <h2>Design</h2>
          <p>{status}</p>
        </section>
        </div>
      </aside>
      </div>

      <button
        aria-label="浏览模板画廊"
        className="scroll-hint scroll-hint-section"
        type="button"
        onClick={() => onNavigate("gallery")}
      >
        <span className="scroll-hint-icon" aria-hidden="true" />
      </button>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RangeControl({
  label,
  max,
  min,
  step,
  suffix,
  value,
  onChange
}: {
  label: string;
  max: number;
  min: number;
  step: number;
  suffix: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field field-control range-control">
      <span>{label}</span>
      <strong>
        {value}
        {suffix}
      </strong>
      <input
        max={max}
        min={min}
        step={step}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
