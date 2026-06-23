import { getTemplateById } from "../templates/registry";
import type { MediaAsset, Project, RefinedFrameConfig, TemplateParams } from "../types";
import { CardPreview } from "./components/CardPreview";
import { Sidebar } from "./components/Sidebar";
import { StageActionIcon } from "./components/StageActionIcon";

type EditorSectionProps = {
  project: Project | null;
  mediaAsset: MediaAsset | null;
  mediaUrl?: string;
  demoFill?: string;
  status: string;
  isBusy: boolean;
  editorRailsVisible: boolean;
  recentProjects: Project[];
  templateListOpen: boolean;
  historyOpen: boolean;
  archiveOpen: boolean;
  frameOpen: boolean;
  onUpload: (file?: File) => void;
  onNavigate: (section: "hero" | "editor" | "gallery") => void;
  onSelectProject: (project: Project) => void;
  onRenameProject: (projectId: string, name: string) => void;
  onToggleTemplateList: () => void;
  onToggleHistory: () => void;
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
  demoFill,
  status,
  isBusy,
  editorRailsVisible,
  recentProjects,
  templateListOpen,
  historyOpen,
  archiveOpen,
  frameOpen,
  onUpload,
  onNavigate,
  onSelectProject,
  onRenameProject,
  onToggleTemplateList,
  onToggleHistory,
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
        activeProjectId={project?.id}
        archiveOpen={archiveOpen}
        historyOpen={historyOpen}
        isBusy={isBusy}
        mediaType={mediaAsset?.type}
        projectsCount={recentProjects.length}
        recentProjects={recentProjects}
        templateListOpen={templateListOpen}
        onRenameProject={onRenameProject}
        onSelectProject={onSelectProject}
        onToggleArchive={onToggleArchive}
        onToggleHistory={onToggleHistory}
        onToggleTemplateList={onToggleTemplateList}
        onUpload={onUpload}
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
              demoFill={demoFill}
              mediaName={mediaAsset?.name}
              mediaType={mediaAsset?.type}
              mediaUrl={mediaUrl}
              params={project.templateParams}
              templateId={project.templateId}
              variant="stage"
            />
          )}

          <div className="stage-actions">
            <button
              aria-label="参数随机"
              className="stage-action"
              disabled={!project}
              title="参数随机"
              type="button"
              onClick={onShuffleParams}
            >
              <StageActionIcon kind="random" />
              <span>随机</span>
            </button>
            <button
              aria-label="保存至画册"
              className="stage-action stage-action-primary"
              disabled={!project}
              title="保存至画册"
              type="button"
              onClick={onSaveToAlbum}
            >
              <StageActionIcon kind="save" />
              <span>保存至画册</span>
            </button>
            <button
              aria-label="下载结果图"
              className="stage-action stage-action-download"
              disabled={!project}
              title="下载结果图"
              type="button"
              onClick={onDownloadResult}
            >
              <StageActionIcon kind="download" />
              <span>下载结果图</span>
            </button>
          </div>
        </div>
      </section>

      <aside className="inspector workspace-rail">
        <div className="workspace-rail-panel">
        <section className="inspector-summary">
          <h2>Design</h2>
          <p>{status}</p>
        </section>

        <section className={`panel control-panel ${frameOpen ? "is-expanded" : "is-collapsed"}`}>
          <button className="panel-heading" type="button" onClick={onToggleFrame}>
            <span>Frame</span>
            <span className="panel-chevron" aria-hidden="true" />
          </button>
          <div className="panel-content">
            <Field label="Template" value={activeTemplate?.name ?? "-"} />
            {refinedFrame ? (
              <>
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
                  <input
                    maxLength={48}
                    type="text"
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
