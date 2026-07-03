import { getTemplateById } from "../templates/registry";
import type {
  BandFrameConfig,
  GlassFrameConfig,
  GridFrameConfig,
  MediaAsset,
  Project,
  RefinedFrameConfig,
  TemplateParams
} from "../types";
import { clampGlassFrame } from "../templates/glassFrame";
import { clampGridFrame, withDerivedGridEffects } from "../templates/gridFrame";
import { clampBandFrame, deriveSystemColor, sampleAverageColorFromUrl } from "../templates/bandFrame";
import { normalizeTextFont, type TextFontId } from "../templates/fonts";
import { CardPreview } from "./components/CardPreview";
import { EditorEmptyStage } from "./components/EditorEmptyStage";
import { StageActionButton } from "./components/StageActionButton";
import { Sidebar } from "./components/Sidebar";
import { Field } from "./inspector/controls";
import { BandFrameControls } from "./inspector/BandFrameControls";
import { GlassFrameControls } from "./inspector/GlassFrameControls";
import { GridFrameControls } from "./inspector/GridFrameControls";
import { RefinedFrameControls } from "./inspector/RefinedFrameControls";
import type { HeroUploadOptions } from "./HeroPage";

type EditorSectionProps = {
  project: Project | null;
  mediaAsset: MediaAsset | null;
  mediaUrl?: string;
  status: string;
  isBusy: boolean;
  editorRailsVisible: boolean;
  templateListOpen: boolean;
  frameOpen: boolean;
  onUpload: (file?: File) => void;
  onNavigate: (section: "hero" | "editor" | "gallery") => void;
  onToggleTemplateList: () => void;
  onToggleFrame: () => void;
  onShuffleParams: () => void;
  onSaveToAlbum: () => void;
  onDownloadResult: () => void;
  onUpdateTemplateParams: (params: TemplateParams) => void;
  onSelectTemplate: (templateId: string) => void;
  onMagicFrame: (file: File, options: HeroUploadOptions) => void | Promise<void>;
};

export function EditorSection({
  project,
  mediaAsset,
  mediaUrl,
  status,
  isBusy,
  editorRailsVisible,
  templateListOpen,
  frameOpen,
  onUpload,
  onNavigate,
  onToggleTemplateList,
  onToggleFrame,
  onShuffleParams,
  onSaveToAlbum,
  onDownloadResult,
  onUpdateTemplateParams,
  onSelectTemplate,
  onMagicFrame
}: EditorSectionProps) {
  const activeTemplate = project ? getTemplateById(project.templateId) : undefined;
  const refinedFrame =
    activeTemplate?.family === "refined-blur-frame" ? project?.templateParams.refinedFrame : undefined;
  const gridFrame = activeTemplate?.family === "grid-frame" ? project?.templateParams.gridFrame : undefined;
  const glassFrame = activeTemplate?.family === "glass-frame" ? project?.templateParams.glassFrame : undefined;
  const bandFrame = activeTemplate?.family === "band-frame" ? project?.templateParams.bandFrame : undefined;
  const activeFont = normalizeTextFont(project?.templateParams.text.fontFamily);

  function updateRefinedFrame(nextFrame: RefinedFrameConfig) {
    if (!project) {
      return;
    }

    onUpdateTemplateParams({
      ...project.templateParams,
      refinedFrame: nextFrame
    });
  }

  function updateGridFrame(nextFrame: GridFrameConfig) {
    if (!project) {
      return;
    }

    onUpdateTemplateParams({
      ...project.templateParams,
      gridFrame: clampGridFrame(nextFrame)
    });
  }

  function updateGridSeed(seed: number) {
    if (!project || !gridFrame) {
      return;
    }

    onUpdateTemplateParams({
      ...project.templateParams,
      gridFrame: withDerivedGridEffects({ ...gridFrame, seed })
    });
  }

  function updateGlassFrame(nextFrame: GlassFrameConfig) {
    if (!project) {
      return;
    }

    onUpdateTemplateParams({
      ...project.templateParams,
      glassFrame: clampGlassFrame(nextFrame)
    });
  }

  function updateBandFrame(nextFrame: BandFrameConfig) {
    if (!project) {
      return;
    }

    onUpdateTemplateParams({
      ...project.templateParams,
      bandFrame: clampBandFrame(nextFrame)
    });
  }

  function updateTextField(field: "title" | "subtitle" | "credit", value: string, maxLength: number) {
    if (!project) {
      return;
    }

    onUpdateTemplateParams({
      ...project.templateParams,
      text: {
        ...project.templateParams.text,
        [field]: value.slice(0, maxLength)
      }
    });
  }

  function updateFont(fontFamily: TextFontId) {
    if (!project) {
      return;
    }

    onUpdateTemplateParams({
      ...project.templateParams,
      text: {
        ...project.templateParams.text,
        fontFamily
      }
    });
  }

  async function applyBandSystemColor(target: "band" | "backing") {
    if (!bandFrame) {
      return;
    }

    let hex: string | undefined;
    if (mediaUrl) {
      try {
        const average = await sampleAverageColorFromUrl(mediaUrl);
        hex = deriveSystemColor(average, target);
      } catch {
        hex = undefined;
      }
    }
    if (!hex) {
      hex = deriveSystemColor({ r: 202, g: 188, b: 170 }, target);
    }

    updateBandFrame({
      ...bandFrame,
      ...(target === "band"
        ? { bandColor: "system", systemBandHex: hex }
        : { backingColor: "system", systemBackingHex: hex })
    });
  }

  return (
    <div className={`workspace-shell${editorRailsVisible ? " is-rails-visible" : ""}`}>
        <Sidebar
        activeTemplateId={project?.templateId}
        templateListOpen={templateListOpen}
        onSelectTemplate={onSelectTemplate}
        onToggleTemplateList={onToggleTemplateList}
      />

      <section className="stage">
        <div className={`stage-stack${mediaAsset ? " is-has-media" : " is-empty"}`}>
          <div className="stage-main">
            {mediaAsset && project ? (
              <CardPreview
                mediaName={mediaAsset.name}
                mediaType={mediaAsset.type}
                mediaUrl={mediaUrl}
                params={project.templateParams}
                templateId={project.templateId}
                variant="stage"
              />
            ) : (
              <EditorEmptyStage isBusy={isBusy} onMagicFrame={onMagicFrame} />
            )}
          </div>

          {mediaAsset ? (
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
          ) : null}

          <button
            aria-label="浏览模板画廊"
            className="scroll-hint scroll-hint-stage"
            type="button"
            onClick={() => onNavigate("gallery")}
          >
            <span className="scroll-hint-icon" aria-hidden="true" />
          </button>
        </div>
      </section>

      <aside className="inspector workspace-rail">
        <div className="workspace-rail-panel">
        <div className="workspace-rail-scroll inspector-rail-scroll">
        <section className={`panel control-panel ${frameOpen ? "is-expanded" : "is-collapsed"}`}>
          <button className="panel-heading" type="button" onClick={onToggleFrame}>
            <span>Frame</span>
            <span className="panel-chevron" aria-hidden="true" />
          </button>
          <div className="panel-content">
            <Field label="Template" value={activeTemplate?.name ?? "-"} />
            {refinedFrame ? (
              <RefinedFrameControls
                credit={project?.templateParams.text.credit ?? ""}
                font={activeFont}
                frame={refinedFrame}
                onChangeCredit={(value) => updateTextField("credit", value, 48)}
                onChangeFont={updateFont}
                onChangeFrame={updateRefinedFrame}
              />
            ) : gridFrame ? (
              <GridFrameControls
                font={activeFont}
                frame={gridFrame}
                title={project?.templateParams.text.title ?? ""}
                onChangeFont={updateFont}
                onChangeFrame={updateGridFrame}
                onChangeSeed={updateGridSeed}
                onChangeTitle={(value) => updateTextField("title", value, 10)}
              />
            ) : glassFrame ? (
              <GlassFrameControls
                font={activeFont}
                frame={glassFrame}
                subtitle={project?.templateParams.text.subtitle ?? ""}
                title={project?.templateParams.text.title ?? ""}
                onChangeFont={updateFont}
                onChangeFrame={updateGlassFrame}
                onChangeText={(field, value) => updateTextField(field, value, field === "title" ? 24 : 48)}
              />
            ) : bandFrame ? (
              <BandFrameControls
                font={activeFont}
                frame={bandFrame}
                subtitle={project?.templateParams.text.subtitle ?? ""}
                title={project?.templateParams.text.title ?? ""}
                onApplySystemColor={(target) => void applyBandSystemColor(target)}
                onChangeFont={updateFont}
                onChangeFrame={updateBandFrame}
                onChangeText={(field, value) => updateTextField(field, value, field === "title" ? 40 : 24)}
              />
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

        <section className="inspector-summary workspace-rail-footer">
          <h2>Design</h2>
          <p>{status}</p>
        </section>
        </div>
      </aside>
      </div>
  );
}
