import { getTemplateById } from "../templates/registry";
import type { BandColorChoice, BandFrameConfig, GlassFrameConfig, GridFrameConfig, MediaAsset, Project, RefinedFrameConfig, TemplateParams } from "../types";
import { clampGlassFrame, GLASS_FRAME_LIMITS } from "../templates/glassFrame";
import { clampGridFrame, GRID_LINE_LIMITS, withDerivedGridEffects } from "../templates/gridFrame";
import {
  BAND_FIXED_COLORS,
  BAND_FRAME_LIMITS,
  clampBandFrame,
  deriveSystemColor,
  resolveBandColor,
  sampleAverageColorFromUrl
} from "../templates/bandFrame";
import { TEXT_FONT_OPTIONS, normalizeTextFont, type TextFontId } from "../templates/fonts";
import { CardPreview } from "./components/CardPreview";
import { EditorEmptyStage } from "./components/EditorEmptyStage";
import { StageActionButton } from "./components/StageActionButton";
import { Sidebar } from "./components/Sidebar";
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
    if (!gridFrame) {
      return;
    }

    onUpdateTemplateParams({
      ...project!.templateParams,
      gridFrame: withDerivedGridEffects({ ...gridFrame, seed })
    });
  }

  function updateGridTitle(title: string) {
    if (!project) {
      return;
    }

    onUpdateTemplateParams({
      ...project.templateParams,
      text: {
        ...project.templateParams.text,
        title: title.slice(0, 10)
      }
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

  function updateBandText(field: "title" | "subtitle", value: string) {
    if (!project) {
      return;
    }

    onUpdateTemplateParams({
      ...project.templateParams,
      text: {
        ...project.templateParams.text,
        [field]: field === "title" ? value.slice(0, 40) : value.slice(0, 24)
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

  const activeFont = normalizeTextFont(project?.templateParams.text.fontFamily);

  function updateGlassText(field: "title" | "subtitle", value: string) {
    if (!project) {
      return;
    }

    onUpdateTemplateParams({
      ...project.templateParams,
      text: {
        ...project.templateParams.text,
        [field]: field === "title" ? value.slice(0, 24) : value.slice(0, 48)
      }
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
                <FontControl value={activeFont} onChange={updateFont} />
                <label className="field text-control">
                  <span>文字内容</span>
                  <textarea
                    maxLength={48}
                    value={project?.templateParams.text.credit ?? ""}
                    onChange={(event) => updateCredit(event.target.value)}
                  />
                </label>
              </>
            ) : gridFrame ? (
              <>
                <div className="field field-control">
                  <span>画布比例</span>
                  <div className="segmented-control segmented-control-wrap">
                    {(["16:9", "4:3", "1:1", "3:4", "9:16", "auto"] as const).map((option) => (
                      <button
                        key={option}
                        className={gridFrame.canvasRatio === option ? "is-active" : ""}
                        type="button"
                        onClick={() => updateGridFrame({ ...gridFrame, canvasRatio: option })}
                      >
                        {option === "auto" ? "随原图" : option}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field field-control">
                  <span>线与文字</span>
                  <div className="segmented-control">
                    <button
                      className={gridFrame.lineTone === "white" ? "is-active" : ""}
                      type="button"
                      onClick={() => updateGridFrame({ ...gridFrame, lineTone: "white" })}
                    >
                      白
                    </button>
                    <button
                      className={gridFrame.lineTone === "black" ? "is-active" : ""}
                      type="button"
                      onClick={() => updateGridFrame({ ...gridFrame, lineTone: "black" })}
                    >
                      黑
                    </button>
                  </div>
                </div>
                <RangeControl
                  label="竖线 X1"
                  max={GRID_LINE_LIMITS.lineX1.max}
                  min={GRID_LINE_LIMITS.lineX1.min}
                  step={1}
                  suffix="%"
                  value={gridFrame.lineX1}
                  onChange={(value) => updateGridFrame({ ...gridFrame, lineX1: value })}
                />
                <RangeControl
                  label="竖线 X2"
                  max={GRID_LINE_LIMITS.lineX2.max}
                  min={GRID_LINE_LIMITS.lineX2.min}
                  step={1}
                  suffix="%"
                  value={gridFrame.lineX2}
                  onChange={(value) => updateGridFrame({ ...gridFrame, lineX2: value })}
                />
                <RangeControl
                  label="横线 Y1"
                  max={GRID_LINE_LIMITS.lineY1.max}
                  min={GRID_LINE_LIMITS.lineY1.min}
                  step={1}
                  suffix="%"
                  value={gridFrame.lineY1}
                  onChange={(value) => updateGridFrame({ ...gridFrame, lineY1: value })}
                />
                <RangeControl
                  label="横线 Y2"
                  max={GRID_LINE_LIMITS.lineY2.max}
                  min={GRID_LINE_LIMITS.lineY2.min}
                  step={1}
                  suffix="%"
                  value={gridFrame.lineY2}
                  onChange={(value) => updateGridFrame({ ...gridFrame, lineY2: value })}
                />
                <RangeControl
                  label="随机种子"
                  max={99999}
                  min={0}
                  step={1}
                  suffix=""
                  value={gridFrame.seed}
                  onChange={updateGridSeed}
                />
                <FontControl value={activeFont} onChange={updateFont} />
                <label className="field text-control">
                  <span>标题（右下格）</span>
                  <textarea
                    maxLength={10}
                    value={project?.templateParams.text.title ?? ""}
                    onChange={(event) => updateGridTitle(event.target.value)}
                  />
                </label>
              </>
            ) : glassFrame ? (
              <>
                <div className="field field-control">
                  <span>画布比例</span>
                  <div className="segmented-control segmented-control-wrap">
                    {(["16:9", "4:3", "1:1", "3:4", "9:16", "auto"] as const).map((option) => (
                      <button
                        key={option}
                        className={glassFrame.canvasRatio === option ? "is-active" : ""}
                        type="button"
                        onClick={() => updateGlassFrame({ ...glassFrame, canvasRatio: option })}
                      >
                        {option === "auto" ? "随原图" : option}
                      </button>
                    ))}
                  </div>
                </div>
                <RangeControl
                  label="边缘宽度"
                  max={GLASS_FRAME_LIMITS.edgeWidth.max}
                  min={GLASS_FRAME_LIMITS.edgeWidth.min}
                  step={0.5}
                  suffix="%"
                  value={glassFrame.edgeWidth}
                  onChange={(value) => updateGlassFrame({ ...glassFrame, edgeWidth: value })}
                />
                <RangeControl
                  label="底边加厚"
                  max={GLASS_FRAME_LIMITS.bottomExtra.max}
                  min={GLASS_FRAME_LIMITS.bottomExtra.min}
                  step={0.5}
                  suffix="%"
                  value={glassFrame.bottomExtra}
                  onChange={(value) => updateGlassFrame({ ...glassFrame, bottomExtra: value })}
                />
                <RangeControl
                  label="磨砂模糊"
                  max={GLASS_FRAME_LIMITS.blur.max}
                  min={GLASS_FRAME_LIMITS.blur.min}
                  step={1}
                  suffix="px"
                  value={glassFrame.blur}
                  onChange={(value) => updateGlassFrame({ ...glassFrame, blur: value })}
                />
                <div className="field field-control">
                  <span>文字颜色</span>
                  <div className="segmented-control">
                    <button
                      className={glassFrame.textTone === "white" ? "is-active" : ""}
                      type="button"
                      onClick={() => updateGlassFrame({ ...glassFrame, textTone: "white" })}
                    >
                      白
                    </button>
                    <button
                      className={glassFrame.textTone === "black" ? "is-active" : ""}
                      type="button"
                      onClick={() => updateGlassFrame({ ...glassFrame, textTone: "black" })}
                    >
                      黑
                    </button>
                    <button
                      className={glassFrame.textTone === "gray" ? "is-active" : ""}
                      type="button"
                      onClick={() => updateGlassFrame({ ...glassFrame, textTone: "gray" })}
                    >
                      灰
                    </button>
                  </div>
                </div>
                <FontControl value={activeFont} onChange={updateFont} />
                <label className="field text-control">
                  <span>标题</span>
                  <textarea
                    maxLength={24}
                    value={project?.templateParams.text.title ?? ""}
                    onChange={(event) => updateGlassText("title", event.target.value)}
                  />
                </label>
                <label className="field text-control">
                  <span>副标题</span>
                  <textarea
                    maxLength={48}
                    value={project?.templateParams.text.subtitle ?? ""}
                    onChange={(event) => updateGlassText("subtitle", event.target.value)}
                  />
                </label>
              </>
            ) : bandFrame ? (
              <>
                <div className="field field-control">
                  <span>画布比例</span>
                  <div className="segmented-control segmented-control-wrap">
                    {(["16:9", "4:3", "1:1", "3:4", "9:16", "auto"] as const).map((option) => (
                      <button
                        key={option}
                        className={bandFrame.canvasRatio === option ? "is-active" : ""}
                        type="button"
                        onClick={() => updateBandFrame({ ...bandFrame, canvasRatio: option })}
                      >
                        {option === "auto" ? "随原图" : option}
                      </button>
                    ))}
                  </div>
                </div>
                <RangeControl
                  label="外边缘"
                  max={BAND_FRAME_LIMITS.outerMargin.max}
                  min={BAND_FRAME_LIMITS.outerMargin.min}
                  step={0.5}
                  suffix="%"
                  value={bandFrame.outerMargin}
                  onChange={(value) => updateBandFrame({ ...bandFrame, outerMargin: value })}
                />
                <RangeControl
                  label="腰封高度"
                  max={BAND_FRAME_LIMITS.bandHeight.max}
                  min={BAND_FRAME_LIMITS.bandHeight.min}
                  step={1}
                  suffix="%"
                  value={bandFrame.bandHeight}
                  onChange={(value) => updateBandFrame({ ...bandFrame, bandHeight: value })}
                />
                <RangeControl
                  label="副标题字号"
                  max={BAND_FRAME_LIMITS.subtitleSize.max}
                  min={BAND_FRAME_LIMITS.subtitleSize.min}
                  step={1}
                  suffix="px"
                  value={bandFrame.subtitleSize}
                  onChange={(value) => updateBandFrame({ ...bandFrame, subtitleSize: value })}
                />
                <RangeControl
                  label="标题字号"
                  max={BAND_FRAME_LIMITS.titleSize.max}
                  min={BAND_FRAME_LIMITS.titleSize.min}
                  step={1}
                  suffix="px"
                  value={bandFrame.titleSize}
                  onChange={(value) => updateBandFrame({ ...bandFrame, titleSize: value })}
                />
                <BandColorControl
                  label="腰封颜色"
                  value={bandFrame.bandColor}
                  systemHex={bandFrame.systemBandHex}
                  onPick={(choice) => updateBandFrame({ ...bandFrame, bandColor: choice })}
                  onSystem={() => void applyBandSystemColor("band")}
                />
                <BandColorControl
                  label="衬底颜色"
                  value={bandFrame.backingColor}
                  systemHex={bandFrame.systemBackingHex}
                  onPick={(choice) => updateBandFrame({ ...bandFrame, backingColor: choice })}
                  onSystem={() => void applyBandSystemColor("backing")}
                />
                <FontControl value={activeFont} onChange={updateFont} />
                <label className="field text-control">
                  <span>标题句</span>
                  <textarea
                    maxLength={40}
                    value={project?.templateParams.text.title ?? ""}
                    onChange={(event) => updateBandText("title", event.target.value)}
                  />
                </label>
                <label className="field text-control">
                  <span>副标题</span>
                  <textarea
                    maxLength={24}
                    value={project?.templateParams.text.subtitle ?? ""}
                    onChange={(event) => updateBandText("subtitle", event.target.value)}
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

        <section className="inspector-summary workspace-rail-footer">
          <h2>Design</h2>
          <p>{status}</p>
        </section>
        </div>
      </aside>
      </div>
  );
}

function BandColorControl({
  label,
  value,
  systemHex,
  onPick,
  onSystem
}: {
  label: string;
  value: BandColorChoice;
  systemHex?: string;
  onPick: (choice: BandColorChoice) => void;
  onSystem: () => void;
}) {
  return (
    <div className="field field-control band-color-field">
      <span>{label}</span>
      <div className="band-color-control">
        <div className="band-color-row">
          {BAND_FIXED_COLORS.map((option) => (
            <button
              key={option.id}
              aria-label={option.label}
              className={`band-color-swatch${value === option.id ? " is-active" : ""}`}
              style={{ background: option.hex }}
              title={option.label}
              type="button"
              onClick={() => onPick(option.id)}
            />
          ))}
        </div>
        <button
          className={`band-color-system${value === "system" ? " is-active" : ""}`}
          type="button"
          onClick={onSystem}
        >
          <span
            aria-hidden="true"
            className="band-color-system-dot"
            style={{ background: resolveBandColor("system", systemHex) }}
          />
          <span className="band-color-system-label">系统配色</span>
          <span className="band-color-system-hint">换一换</span>
        </button>
      </div>
    </div>
  );
}

function FontControl({
  value,
  onChange
}: {
  value: TextFontId;
  onChange: (value: TextFontId) => void;
}) {
  return (
    <div className="field field-control">
      <span>字体</span>
      <div className="segmented-control segmented-control-wrap">
        {TEXT_FONT_OPTIONS.map((option) => (
          <button
            key={option.id}
            className={value === option.id ? "is-active" : ""}
            style={{ fontFamily: option.stack }}
            type="button"
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
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
