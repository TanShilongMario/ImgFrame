import { useMemo } from "react";
import { useLocale } from "../../i18n/LocaleContext";
import { getTemplateById } from "../../templates/registry";
import type { Project } from "../../types";
import type { TextFontId } from "../../templates/fonts";
import {
  buildBandMobileTabs,
  buildCornerMobileTabs,
  buildPrintMobileTabs,
  buildStampMobileTabs,
  buildDotMobileTabs,
  buildFlutedMobileTabs,
  buildSwatchMobileTabs,
  buildGlassMobileTabs,
  buildGlassSillMobileTabs,
  buildGridMobileTabs,
  buildRefinedMobileTabs
} from "./buildMobileInspectorTabs";
import { MobileTabbedInspector } from "./MobileTabbedInspector";
import type {
  BandFrameConfig,
  CornerFrameConfig,
  DotFrameConfig,
  FlutedFrameConfig,
  PrintFrameConfig,
  StampFrameConfig,
  SwatchFrameConfig,
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
  onChangeCornerFrame: (frame: CornerFrameConfig) => void;
  onChangeFlutedFrame: (frame: FlutedFrameConfig) => void;
  onChangeFlutedSeed: (seed: number) => void;
  onChangeSwatchFrame: (frame: SwatchFrameConfig) => void;
  onChangeSwatchSeed: (seed: number) => void;
  onChangePrintFrame: (frame: PrintFrameConfig) => void;
  onChangePrintSeed: (seed: number) => void;
  onChangeStampFrame: (frame: StampFrameConfig) => void;
  onChangeStampSeed: (seed: number) => void;
  onChangeDotFrame: (frame: DotFrameConfig) => void;
  onChangeDotSeed: (seed: number) => void;
  onChangeTextField: (field: "title" | "subtitle" | "credit", value: string, maxLength: number) => void;
  onChangeFont: (font: TextFontId) => void;
  onApplyGlassSystemBacking: () => void;
  onApplyGlassSillSystemBacking: () => void;
  onApplyBandSystemColor: (target: "band" | "backing") => void;
  onApplyCornerSystemBacking: () => void;
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
  onChangeCornerFrame,
  onChangeFlutedFrame,
  onChangeFlutedSeed,
  onChangeSwatchFrame,
  onChangeSwatchSeed,
  onChangePrintFrame,
  onChangePrintSeed,
  onChangeStampFrame,
  onChangeStampSeed,
  onChangeDotFrame,
  onChangeDotSeed,
  onChangeTextField,
  onChangeFont,
  onApplyGlassSystemBacking,
  onApplyGlassSillSystemBacking,
  onApplyBandSystemColor,
  onApplyCornerSystemBacking
}: MobileInspectorPanelProps) {
  const { tl, locale } = useLocale();
  const activeTemplate = getTemplateById(project.templateId);
  const refinedFrame =
    activeTemplate.family === "refined-blur-frame" ? project.templateParams.refinedFrame : undefined;
  const gridFrame = activeTemplate.family === "grid-frame" ? project.templateParams.gridFrame : undefined;
  const glassFrame = activeTemplate.family === "glass-frame" ? project.templateParams.glassFrame : undefined;
  const glassSillFrame =
    activeTemplate.family === "glass-sill-frame" ? project.templateParams.glassSillFrame : undefined;
  const bandFrame = activeTemplate.family === "band-frame" ? project.templateParams.bandFrame : undefined;
  const cornerFrame = activeTemplate.family === "corner-frame" ? project.templateParams.cornerFrame : undefined;
  const flutedFrame = activeTemplate.family === "fluted-frame" ? project.templateParams.flutedFrame : undefined;
  const swatchFrame = activeTemplate.family === "swatch-frame" ? project.templateParams.swatchFrame : undefined;
  const printFrame = activeTemplate.family === "print-frame" ? project.templateParams.printFrame : undefined;
  const stampFrame = activeTemplate.family === "stamp-frame" ? project.templateParams.stampFrame : undefined;
  const dotFrame = activeTemplate.family === "dot-frame" ? project.templateParams.dotFrame : undefined;

  const tabs = useMemo(() => {
    if (refinedFrame) {
      return buildRefinedMobileTabs({
        frame: refinedFrame,
        credit: project.templateParams.text.credit ?? "",
        font: activeFont,
        onChangeFrame: onChangeRefinedFrame,
        onChangeCredit: (value) => onChangeTextField("credit", value, 72),
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
        onChangeTitle: (value) => onChangeTextField("title", value, 20),
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
        onChangeText: (field, value) => onChangeTextField(field, value, field === "title" ? 40 : 72),
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
        onChangeCaption: (value) => onChangeTextField("title", value, 64),
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
        onChangeText: (field, value) => onChangeTextField(field, value, field === "title" ? 64 : 40),
        onChangeFont,
        onApplySystemColor: onApplyBandSystemColor
      });
    }

    if (cornerFrame) {
      return buildCornerMobileTabs({
        frame: cornerFrame,
        title: project.templateParams.text.title ?? "",
        subtitle: project.templateParams.text.subtitle ?? "",
        font: activeFont,
        onChangeFrame: onChangeCornerFrame,
        onChangeText: (field, value) => onChangeTextField(field, value, field === "title" ? 64 : 40),
        onChangeFont,
        onApplySystemBacking: onApplyCornerSystemBacking
      });
    }

    if (flutedFrame) {
      return buildFlutedMobileTabs({
        frame: flutedFrame,
        onChangeFrame: onChangeFlutedFrame,
        onChangeSeed: onChangeFlutedSeed
      });
    }

    if (swatchFrame) {
      return buildSwatchMobileTabs({
        frame: swatchFrame,
        onChangeFrame: onChangeSwatchFrame,
        onChangeSeed: onChangeSwatchSeed
      });
    }

    if (printFrame) {
      return buildPrintMobileTabs({
        frame: printFrame,
        onChangeFrame: onChangePrintFrame,
        onChangeSeed: onChangePrintSeed
      });
    }

    if (stampFrame) {
      return buildStampMobileTabs({
        frame: stampFrame,
        title: project.templateParams.text.title ?? "",
        date: project.templateParams.text.subtitle ?? "",
        postmark: project.templateParams.text.credit ?? "",
        font: activeFont,
        onChangeFrame: onChangeStampFrame,
        onChangeSeed: onChangeStampSeed,
        onChangeText: (field, value) => onChangeTextField(field, value, field === "title" ? 48 : field === "subtitle" ? 32 : 64),
        onChangeFont
      });
    }

    if (dotFrame) {
      return buildDotMobileTabs({
        frame: dotFrame,
        onChangeFrame: onChangeDotFrame,
        onChangeSeed: onChangeDotSeed
      });
    }

    return [];
  }, [
    activeFont,
    bandFrame,
    cornerFrame,
    printFrame,
    stampFrame,
    dotFrame,
    flutedFrame,
    swatchFrame,
    glassFrame,
    glassSillFrame,
    gridFrame,
    onApplyBandSystemColor,
    onApplyCornerSystemBacking,
    onApplyGlassSillSystemBacking,
    onApplyGlassSystemBacking,
    onChangeBandFrame,
    onChangeCornerFrame,
    onChangeFlutedFrame,
    onChangeFlutedSeed,
    onChangePrintFrame,
    onChangePrintSeed,
    onChangeStampFrame,
    onChangeStampSeed,
    onChangeDotFrame,
    onChangeDotSeed,
    onChangeSwatchFrame,
    onChangeSwatchSeed,
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

  const localizedTabs = useMemo(
    () => tabs.map((tab) => ({ ...tab, label: tl(tab.label) })),
    [tabs, tl, locale]
  );

  return <MobileTabbedInspector key={project.templateId} tabs={localizedTabs} />;
}
