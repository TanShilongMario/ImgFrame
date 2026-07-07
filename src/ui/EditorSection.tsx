import { useEffect, useRef, useState } from "react";
import { getTemplateById } from "../templates/registry";
import type {
  BandFrameConfig,
  FlutedFrameConfig,
  GlassFrameConfig,
  GlassSillFrameConfig,
  GridFrameConfig,
  MediaAsset,
  Project,
  RefinedFrameConfig,
  TemplateParams
} from "../types";
import { clampGlassFrame } from "../templates/glassFrame";
import {
  clampGlassSillFrame,
  deriveGlassSillBackingColor,
  deriveGlassSillCausticColor
} from "../templates/glassSillFrame";
import { clampFlutedFrame } from "../templates/flutedFrame";
import { clampGridFrame, withDerivedGridEffects } from "../templates/gridFrame";
import { clampBandFrame, deriveSystemColor, fallbackSystemColor, sampleAverageColorFromUrl } from "../templates/bandFrame";
import { normalizeTextFont, type TextFontId } from "../templates/fonts";
import { CardPreview } from "./components/CardPreview";
import { EditorEmptyStage } from "./components/EditorEmptyStage";
import { MobileTemplateRail } from "./components/MobileTemplateRail";
import { StageActionButton } from "./components/StageActionButton";
import { Sidebar } from "./components/Sidebar";
import { Field } from "./inspector/controls";
import { FlutedFrameControls } from "./inspector/FlutedFrameControls";
import { BandFrameControls } from "./inspector/BandFrameControls";
import { GlassFrameControls } from "./inspector/GlassFrameControls";
import { GlassSillFrameControls } from "./inspector/GlassSillFrameControls";
import { GridFrameControls } from "./inspector/GridFrameControls";
import { RefinedFrameControls } from "./inspector/RefinedFrameControls";
import { MobileInspectorPanel } from "./inspector/MobileInspectorPanel";
import type { HeroUploadOptions } from "./HeroPage";

type EditorSectionProps = {
  project: Project | null;
  mediaAsset: MediaAsset | null;
  mediaUrl?: string;
  isBusy: boolean;
  variant?: "desktop" | "mobile";
  imagesOnly?: boolean;
  onUpload: (file?: File) => void;
  onNavigate?: (section: "hero" | "editor" | "gallery") => void;
  onShuffleParams: () => void;
  onSaveToAlbum?: () => void;
  onDownloadResult: () => void;
  onUpdateTemplateParams: (params: TemplateParams) => void;
  onSelectTemplate: (templateId: string) => void;
  onMagicFrame: (file: File, options: HeroUploadOptions) => void | Promise<void>;
};

export function EditorSection({
  project,
  mediaAsset,
  mediaUrl,
  isBusy,
  variant = "desktop",
  imagesOnly = false,
  onUpload,
  onNavigate,
  onShuffleParams,
  onSaveToAlbum,
  onDownloadResult,
  onUpdateTemplateParams,
  onSelectTemplate,
  onMagicFrame
}: EditorSectionProps) {
  const [activeSheet, setActiveSheet] = useState<"none" | "templates" | "params">("none");
  const isMobile = variant === "mobile";
  const activeTemplate = project ? getTemplateById(project.templateId) : undefined;
  const refinedFrame =
    activeTemplate?.family === "refined-blur-frame" ? project?.templateParams.refinedFrame : undefined;
  const gridFrame = activeTemplate?.family === "grid-frame" ? project?.templateParams.gridFrame : undefined;
  const glassFrame = activeTemplate?.family === "glass-frame" ? project?.templateParams.glassFrame : undefined;
  const glassSillFrame =
    activeTemplate?.family === "glass-sill-frame" ? project?.templateParams.glassSillFrame : undefined;
  const bandFrame = activeTemplate?.family === "band-frame" ? project?.templateParams.bandFrame : undefined;
  const flutedFrame = activeTemplate?.family === "fluted-frame" ? project?.templateParams.flutedFrame : undefined;
  const activeFont = normalizeTextFont(project?.templateParams.text.fontFamily);
  const lastGlassBackingSampleRef = useRef<{ mediaId?: string; hex?: string }>({});
  const lastGlassSillSampleRef = useRef<{ mediaId?: string; backingHex?: string; causticHex?: string }>({});

  useEffect(() => {
    if (
      !project ||
      !glassFrame ||
      !mediaUrl ||
      !mediaAsset ||
      activeTemplate?.family !== "glass-frame" ||
      glassFrame.backingColor !== "system"
    ) {
      return;
    }

    if (
      glassFrame.systemBackingHex &&
      lastGlassBackingSampleRef.current.mediaId === mediaAsset.id
    ) {
      return;
    }

    let cancelled = false;

    void sampleAverageColorFromUrl(mediaUrl, mediaAsset.type)
      .then((average) => {
        if (cancelled) {
          return;
        }

        const systemBackingHex = fallbackSystemColor(average, "backing");
        lastGlassBackingSampleRef.current = { mediaId: mediaAsset.id, hex: systemBackingHex };

        if (systemBackingHex !== glassFrame.systemBackingHex) {
          onUpdateTemplateParams({
            ...project.templateParams,
            glassFrame: clampGlassFrame({ ...glassFrame, backingColor: "system", systemBackingHex })
          });
        }
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        const systemBackingHex = fallbackSystemColor({ r: 202, g: 188, b: 170 }, "backing");
        lastGlassBackingSampleRef.current = { mediaId: mediaAsset.id, hex: systemBackingHex };

        if (systemBackingHex !== glassFrame.systemBackingHex) {
          onUpdateTemplateParams({
            ...project.templateParams,
            glassFrame: clampGlassFrame({ ...glassFrame, backingColor: "system", systemBackingHex })
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    activeTemplate?.family,
    glassFrame,
    mediaAsset,
    mediaUrl,
    onUpdateTemplateParams,
    project
  ]);

  useEffect(() => {
    if (!project || !glassSillFrame || !mediaUrl || !mediaAsset || activeTemplate?.family !== "glass-sill-frame") {
      return;
    }

    const needsSystemBacking = glassSillFrame.backingColor === "system";
    const needsCaustic = !glassSillFrame.causticHex;

    if (!needsSystemBacking && !needsCaustic) {
      return;
    }

    if (
      lastGlassSillSampleRef.current.mediaId === mediaAsset.id &&
      (!needsSystemBacking || glassSillFrame.systemBackingHex) &&
      (!needsCaustic || glassSillFrame.causticHex)
    ) {
      return;
    }

    let cancelled = false;

    void sampleAverageColorFromUrl(mediaUrl, mediaAsset.type)
      .then((average) => {
        if (cancelled) {
          return;
        }

        const systemBackingHex = needsSystemBacking
          ? deriveGlassSillBackingColor(average)
          : glassSillFrame.systemBackingHex;
        const causticHex = needsCaustic ? deriveGlassSillCausticColor(average) : glassSillFrame.causticHex;
        lastGlassSillSampleRef.current = { mediaId: mediaAsset.id, backingHex: systemBackingHex, causticHex };

        if (
          systemBackingHex !== glassSillFrame.systemBackingHex ||
          (needsCaustic && causticHex !== glassSillFrame.causticHex)
        ) {
          onUpdateTemplateParams({
            ...project.templateParams,
            glassSillFrame: clampGlassSillFrame({
              ...glassSillFrame,
              systemBackingHex,
              causticHex
            })
          });
        }
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        const fallbackAverage = { r: 202, g: 188, b: 170 };
        const systemBackingHex = needsSystemBacking
          ? deriveGlassSillBackingColor(fallbackAverage)
          : glassSillFrame.systemBackingHex;
        const causticHex = needsCaustic
          ? deriveGlassSillCausticColor(fallbackAverage)
          : glassSillFrame.causticHex;
        lastGlassSillSampleRef.current = { mediaId: mediaAsset.id, backingHex: systemBackingHex, causticHex };

        if (
          systemBackingHex !== glassSillFrame.systemBackingHex ||
          (needsCaustic && causticHex !== glassSillFrame.causticHex)
        ) {
          onUpdateTemplateParams({
            ...project.templateParams,
            glassSillFrame: clampGlassSillFrame({
              ...glassSillFrame,
              systemBackingHex,
              causticHex
            })
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    activeTemplate?.family,
    glassSillFrame,
    mediaAsset,
    mediaUrl,
    onUpdateTemplateParams,
    project
  ]);

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

  function updateGlassSillFrame(nextFrame: GlassSillFrameConfig) {
    if (!project) {
      return;
    }

    onUpdateTemplateParams({
      ...project.templateParams,
      glassSillFrame: clampGlassSillFrame(nextFrame)
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

  function updateFlutedFrame(nextFrame: FlutedFrameConfig) {
    if (!project) {
      return;
    }

    onUpdateTemplateParams({
      ...project.templateParams,
      flutedFrame: clampFlutedFrame(nextFrame)
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
        const average = await sampleAverageColorFromUrl(mediaUrl, mediaAsset?.type ?? "image");
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

  async function applyGlassSystemBacking() {
    if (!glassFrame) {
      return;
    }

    const fallbackAverage = { r: 202, g: 188, b: 170 };
    let systemBackingHex: string | undefined;
    if (mediaUrl) {
      try {
        const average = await sampleAverageColorFromUrl(mediaUrl, mediaAsset?.type ?? "image");
        systemBackingHex = deriveSystemColor(average, "backing");
      } catch {
        systemBackingHex = undefined;
      }
    }
    if (!systemBackingHex) {
      systemBackingHex = deriveSystemColor(fallbackAverage, "backing");
    }

    lastGlassBackingSampleRef.current = { mediaId: mediaAsset?.id, hex: systemBackingHex };

    updateGlassFrame({
      ...glassFrame,
      backingColor: "system",
      systemBackingHex
    });
  }

  async function applyGlassSillSystemBacking() {
    if (!glassSillFrame) {
      return;
    }

    const fallbackAverage = { r: 202, g: 188, b: 170 };
    let average = fallbackAverage;
    if (mediaUrl) {
      try {
        average = await sampleAverageColorFromUrl(mediaUrl, mediaAsset?.type ?? "image");
      } catch {
        average = fallbackAverage;
      }
    }

    const systemBackingHex = deriveGlassSillBackingColor(average, { jitter: true });
    const causticHex = deriveGlassSillCausticColor(average, { jitter: true });
    lastGlassSillSampleRef.current = {
      mediaId: mediaAsset?.id,
      backingHex: systemBackingHex,
      causticHex
    };

    updateGlassSillFrame({
      ...glassSillFrame,
      backingColor: "system",
      systemBackingHex,
      causticHex
    });
  }

  function handleTemplateSelect(templateId: string) {
    onSelectTemplate(templateId);
    if (isMobile) {
      setActiveSheet("none");
    }
  }

  function openSheet(next: "templates" | "params") {
    setActiveSheet((current) => {
      if (current === next) {
        return "none";
      }

      return next;
    });
  }

  const mobilePanelClass =
    activeSheet === "templates"
      ? " is-panel-open is-panel-templates"
      : activeSheet === "params"
        ? " is-panel-open is-panel-params"
        : "";

  const uploadAccept = imagesOnly ? "image/*" : undefined;

  const stageActions = mediaAsset ? (
    <div className="stage-actions">
      <StageActionButton
        accept={uploadAccept}
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
      {!isMobile ? (
        <StageActionButton
          className="stage-action-primary"
          disabled={!project}
          kind="save"
          label="保存至画册"
          title="保存至画册"
          onClick={() => onSaveToAlbum?.()}
        />
      ) : null}
      <StageActionButton
        className={isMobile ? "stage-action-primary" : "stage-action-download"}
        disabled={!project || !mediaAsset || isBusy}
        kind="download"
        label={imagesOnly ? "下载结果图" : mediaAsset?.type === "video" ? "下载结果视频" : "下载结果图"}
        title={imagesOnly ? "下载结果图" : mediaAsset?.type === "video" ? "下载结果视频" : "下载结果图"}
        onClick={onDownloadResult}
      />
    </div>
  ) : null;

  const controlPanelContent = (
    <section className="panel control-panel">
      <div className="panel-heading panel-heading-static">
        <span>Frame</span>
      </div>
      <div className="panel-content">
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
            onApplySystemBacking={() => void applyGlassSystemBacking()}
            onChangeFont={updateFont}
            onChangeFrame={updateGlassFrame}
            onChangeText={(field, value) => updateTextField(field, value, field === "title" ? 24 : 48)}
          />
        ) : glassSillFrame ? (
          <GlassSillFrameControls
            caption={project?.templateParams.text.title ?? ""}
            font={activeFont}
            frame={glassSillFrame}
            onApplySystemBacking={() => void applyGlassSillSystemBacking()}
            onChangeCaption={(value) => updateTextField("title", value, 40)}
            onChangeFont={updateFont}
            onChangeFrame={updateGlassSillFrame}
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
            ) : flutedFrame ? (
              <FlutedFrameControls frame={flutedFrame} onChangeFrame={updateFlutedFrame} />
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
  );

  const stageMain = (
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
        <EditorEmptyStage imageOnly={imagesOnly} isBusy={isBusy} onMagicFrame={onMagicFrame} />
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className={`mobile-workspace${mobilePanelClass}`}>
        <section className="mobile-stage">
          <div className={`stage-stack${mediaAsset ? " is-has-media" : " is-empty"}`}>
            {stageMain}
            {stageActions}
          </div>
        </section>

        <div className="mobile-dock">
          <div className="mobile-sheet-triggers">
            <button
              className={`mobile-sheet-trigger${activeSheet === "templates" ? " is-active" : ""}`}
              disabled={!project}
              type="button"
              onClick={() => openSheet("templates")}
            >
              模板
            </button>
            <button
              className={`mobile-sheet-trigger${activeSheet === "params" ? " is-active" : ""}`}
              disabled={!project}
              type="button"
              onClick={() => openSheet("params")}
            >
              参数
            </button>
          </div>

          {activeSheet === "templates" ? (
            <div className="mobile-inline-panel mobile-inline-panel-templates">
              <MobileTemplateRail activeTemplateId={project?.templateId} onSelectTemplate={handleTemplateSelect} />
            </div>
          ) : null}

          {activeSheet === "params" && project ? (
            <div className="mobile-inline-panel mobile-inline-panel-params">
              <MobileInspectorPanel
                activeFont={activeFont}
                project={project}
                onApplyBandSystemColor={(target) => void applyBandSystemColor(target)}
                onApplyGlassSillSystemBacking={() => void applyGlassSillSystemBacking()}
                onApplyGlassSystemBacking={() => void applyGlassSystemBacking()}
                onChangeBandFrame={updateBandFrame}
                onChangeFont={updateFont}
                onChangeGlassFrame={updateGlassFrame}
                onChangeGlassSillFrame={updateGlassSillFrame}
                onChangeGridFrame={updateGridFrame}
                onChangeGridSeed={updateGridSeed}
                onChangeRefinedFrame={updateRefinedFrame}
                onChangeTextField={updateTextField}
                onChangeFlutedFrame={updateFlutedFrame}
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-shell">
        <Sidebar
        activeTemplateId={project?.templateId}
        onSelectTemplate={onSelectTemplate}
      />

      <section className="stage">
        <div className={`stage-stack${mediaAsset ? " is-has-media" : " is-empty"}`}>
          {stageMain}

          {stageActions}

          {!isMobile && onNavigate ? (
            <button
              aria-label="浏览模板画廊"
              className="scroll-hint scroll-hint-stage"
              type="button"
              onClick={() => onNavigate("gallery")}
            >
              <span className="scroll-hint-icon" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </section>

      <aside className="inspector workspace-rail">
        <div className="workspace-rail-panel">
        <div className="workspace-rail-scroll inspector-rail-scroll">
        {controlPanelContent}
        </div>
        </div>
      </aside>
      </div>
  );
}
