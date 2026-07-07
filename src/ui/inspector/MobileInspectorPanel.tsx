import { useMemo } from "react";
import { getTemplateById } from "../../templates/registry";
import type { Project } from "../../types";
import type { TextFontId } from "../../templates/fonts";
import {
  buildBandMobileTabs,
  buildFlutedMobileTabs,
  buildGlassMobileTabs,
  buildGlassSillMobileTabs,
  buildGridMobileTabs,
  buildRefinedMobileTabs
} from "./buildMobileInspectorTabs";
import { MobileTabbedInspector } from "./MobileTabbedInspector";
import type {
  BandFrameConfig,
  FlutedFrameConfig,
  GlassFrameConfig,
  GlassSillFrameConfig,
  GridFrameConfig,
  RefinedFrameConfig
} from "../../types";

type MobileInspectorPanelProps = {
  project: Project;
  activeFont: TextFontId;
  onChangeRefinedFrame: (frame: RefinedFrameConfig) => void;
  onChangeGridFrame: (frame: GridFrameConfig) => void;
  onChangeGridSeed: (seed: number) => void;
  onChangeGlassFrame: (frame: GlassFrameConfig) => void;
  onChangeGlassSillFrame: (frame: GlassSillFrameConfig) => void;
  onChangeBandFrame: (frame: BandFrameConfig) => void;
  onChangeFlutedFrame: (frame: FlutedFrameConfig) => void;
  onChangeTextField: (field: "title" | "subtitle" | "credit", value: string, maxLength: number) => void;
  onChangeFont: (font: TextFontId) => void;
  onApplyGlassSystemBacking: () => void;
  onApplyGlassSillSystemBacking: () => void;
  onApplyBandSystemColor: (target: "band" | "backing") => void;
};

export function MobileInspectorPanel({
  project,
  activeFont,
  onChangeRefinedFrame,
  onChangeGridFrame,
  onChangeGridSeed,
  onChangeGlassFrame,
  onChangeGlassSillFrame,
  onChangeBandFrame,
  onChangeFlutedFrame,
  onChangeTextField,
  onChangeFont,
  onApplyGlassSystemBacking,
  onApplyGlassSillSystemBacking,
  onApplyBandSystemColor
}: MobileInspectorPanelProps) {
  const activeTemplate = getTemplateById(project.templateId);
  const refinedFrame =
    activeTemplate.family === "refined-blur-frame" ? project.templateParams.refinedFrame : undefined;
  const gridFrame = activeTemplate.family === "grid-frame" ? project.templateParams.gridFrame : undefined;
  const glassFrame = activeTemplate.family === "glass-frame" ? project.templateParams.glassFrame : undefined;
  const glassSillFrame =
    activeTemplate.family === "glass-sill-frame" ? project.templateParams.glassSillFrame : undefined;
  const bandFrame = activeTemplate.family === "band-frame" ? project.templateParams.bandFrame : undefined;
  const flutedFrame = activeTemplate.family === "fluted-frame" ? project.templateParams.flutedFrame : undefined;

  const tabs = useMemo(() => {
    if (refinedFrame) {
      return buildRefinedMobileTabs({
        frame: refinedFrame,
        credit: project.templateParams.text.credit ?? "",
        font: activeFont,
        onChangeFrame: onChangeRefinedFrame,
        onChangeCredit: (value) => onChangeTextField("credit", value, 48),
        onChangeFont
      });
    }

    if (gridFrame) {
      return buildGridMobileTabs({
        frame: gridFrame,
        title: project.templateParams.text.title ?? "",
        font: activeFont,
        onChangeFrame: onChangeGridFrame,
        onChangeSeed: onChangeGridSeed,
        onChangeTitle: (value) => onChangeTextField("title", value, 10),
        onChangeFont
      });
    }

    if (glassFrame) {
      return buildGlassMobileTabs({
        frame: glassFrame,
        title: project.templateParams.text.title ?? "",
        subtitle: project.templateParams.text.subtitle ?? "",
        font: activeFont,
        onChangeFrame: onChangeGlassFrame,
        onChangeText: (field, value) => onChangeTextField(field, value, field === "title" ? 24 : 48),
        onChangeFont,
        onApplySystemBacking: onApplyGlassSystemBacking
      });
    }

    if (glassSillFrame) {
      return buildGlassSillMobileTabs({
        frame: glassSillFrame,
        caption: project.templateParams.text.title ?? "",
        font: activeFont,
        onChangeFrame: onChangeGlassSillFrame,
        onChangeCaption: (value) => onChangeTextField("title", value, 40),
        onChangeFont,
        onApplySystemBacking: onApplyGlassSillSystemBacking
      });
    }

    if (bandFrame) {
      return buildBandMobileTabs({
        frame: bandFrame,
        title: project.templateParams.text.title ?? "",
        subtitle: project.templateParams.text.subtitle ?? "",
        font: activeFont,
        onChangeFrame: onChangeBandFrame,
        onChangeText: (field, value) => onChangeTextField(field, value, field === "title" ? 40 : 24),
        onChangeFont,
        onApplySystemColor: onApplyBandSystemColor
      });
    }

    if (flutedFrame) {
      return buildFlutedMobileTabs({
        frame: flutedFrame,
        onChangeFrame: onChangeFlutedFrame
      });
    }

    return [];
  }, [
    activeFont,
    bandFrame,
    flutedFrame,
    glassFrame,
    glassSillFrame,
    gridFrame,
    onApplyBandSystemColor,
    onApplyGlassSillSystemBacking,
    onApplyGlassSystemBacking,
    onChangeBandFrame,
    onChangeFlutedFrame,
    onChangeFont,
    onChangeGlassFrame,
    onChangeGlassSillFrame,
    onChangeGridFrame,
    onChangeGridSeed,
    onChangeRefinedFrame,
    onChangeTextField,
    project.templateParams.text.credit,
    project.templateParams.text.subtitle,
    project.templateParams.text.title,
    refinedFrame
  ]);

  return <MobileTabbedInspector key={project.templateId} tabs={tabs} />;
}
