import { Dices } from "lucide-react";
import type {
  BandFrameConfig,
  FlutedFrameConfig,
  GlassFrameConfig,
  GlassSillFrameConfig,
  GridFrameConfig,
  RefinedFrameConfig
} from "../../types";
import { BAND_FRAME_LIMITS } from "../../templates/bandFrame";
import { FLUTED_FRAME_LIMITS } from "../../templates/flutedFrame";
import { GLASS_FRAME_LIMITS } from "../../templates/glassFrame";
import { GLASS_SILL_FRAME_LIMITS } from "../../templates/glassSillFrame";
import { GRID_LINE_LIMITS } from "../../templates/gridFrame";
import type { TextFontId } from "../../templates/fonts";
import {
  FontControl,
  PresetColorControl,
  RangeControl,
  RatioControl,
  SegmentedControl,
  TextAreaControl,
  type SegmentedOption
} from "./controls";
import type { MobileInspectorTab } from "./MobileTabbedInspector";

const GRADIENT_TONE_OPTIONS: SegmentedOption<"white" | "black">[] = [
  { value: "white", label: "白" },
  { value: "black", label: "黑" }
];

const LINE_TONE_OPTIONS: SegmentedOption<"white" | "black">[] = [
  { value: "white", label: "白" },
  { value: "black", label: "黑" }
];

const GLASS_TEXT_TONE_OPTIONS: SegmentedOption<"white" | "black" | "gray">[] = [
  { value: "white", label: "白" },
  { value: "black", label: "黑" },
  { value: "gray", label: "灰" }
];

export function buildRefinedMobileTabs({
  frame,
  credit,
  font,
  onChangeFrame,
  onChangeCredit,
  onChangeFont
}: {
  frame: RefinedFrameConfig;
  credit: string;
  font: TextFontId;
  onChangeFrame: (frame: RefinedFrameConfig) => void;
  onChangeCredit: (value: string) => void;
  onChangeFont: (font: TextFontId) => void;
}): MobileInspectorTab[] {
  return [
    {
      id: "ratio",
      label: "比例",
      content: <RatioControl value={frame.canvasRatio} onChange={(canvasRatio) => onChangeFrame({ ...frame, canvasRatio })} />
    },
    {
      id: "crop-width",
      label: "裁剪宽",
      content: (
        <RangeControl
          label="裁剪宽度"
          max={50}
          min={0}
          step={1}
          suffix="%"
          value={frame.cropWidth}
          onChange={(value) => onChangeFrame({ ...frame, cropWidth: value })}
        />
      )
    },
    {
      id: "crop-height",
      label: "裁剪高",
      content: (
        <RangeControl
          label="裁剪高度"
          max={50}
          min={0}
          step={1}
          suffix="%"
          value={frame.cropHeight}
          onChange={(value) => onChangeFrame({ ...frame, cropHeight: value })}
        />
      )
    },
    {
      id: "blur",
      label: "模糊",
      content: (
        <RangeControl
          label="背景模糊度"
          max={60}
          min={0}
          step={1}
          suffix="px"
          value={frame.backgroundBlur}
          onChange={(value) => onChangeFrame({ ...frame, backgroundBlur: value })}
        />
      )
    },
    {
      id: "gradient",
      label: "渐变",
      content: (
        <div className="field field-control">
          <span>渐变颜色</span>
          <SegmentedControl
            options={GRADIENT_TONE_OPTIONS}
            value={frame.gradientTone}
            onChange={(gradientTone) => onChangeFrame({ ...frame, gradientTone })}
          />
        </div>
      )
    },
    {
      id: "font",
      label: "字体",
      content: <FontControl value={font} onChange={onChangeFont} />
    },
    {
      id: "credit",
      label: "署名",
      content: <TextAreaControl label="文字内容" maxLength={48} value={credit} onChange={onChangeCredit} />
    }
  ];
}

export function buildGridMobileTabs({
  frame,
  title,
  font,
  onChangeFrame,
  onChangeSeed,
  onChangeTitle,
  onChangeFont
}: {
  frame: GridFrameConfig;
  title: string;
  font: TextFontId;
  onChangeFrame: (frame: GridFrameConfig) => void;
  onChangeSeed: (seed: number) => void;
  onChangeTitle: (title: string) => void;
  onChangeFont: (font: TextFontId) => void;
}): MobileInspectorTab[] {
  return [
    {
      id: "ratio",
      label: "比例",
      content: <RatioControl value={frame.canvasRatio} onChange={(canvasRatio) => onChangeFrame({ ...frame, canvasRatio })} />
    },
    {
      id: "line-tone",
      label: "线色",
      content: (
        <div className="field field-control">
          <span>线与文字</span>
          <SegmentedControl
            options={LINE_TONE_OPTIONS}
            value={frame.lineTone}
            onChange={(lineTone) => onChangeFrame({ ...frame, lineTone })}
          />
        </div>
      )
    },
    {
      id: "line-x1",
      label: "竖线1",
      content: (
        <RangeControl
          label="竖线 X1"
          max={GRID_LINE_LIMITS.lineX1.max}
          min={GRID_LINE_LIMITS.lineX1.min}
          step={1}
          suffix="%"
          value={frame.lineX1}
          onChange={(value) => onChangeFrame({ ...frame, lineX1: value })}
        />
      )
    },
    {
      id: "line-x2",
      label: "竖线2",
      content: (
        <RangeControl
          label="竖线 X2"
          max={GRID_LINE_LIMITS.lineX2.max}
          min={GRID_LINE_LIMITS.lineX2.min}
          step={1}
          suffix="%"
          value={frame.lineX2}
          onChange={(value) => onChangeFrame({ ...frame, lineX2: value })}
        />
      )
    },
    {
      id: "line-y1",
      label: "横线1",
      content: (
        <RangeControl
          label="横线 Y1"
          max={GRID_LINE_LIMITS.lineY1.max}
          min={GRID_LINE_LIMITS.lineY1.min}
          step={1}
          suffix="%"
          value={frame.lineY1}
          onChange={(value) => onChangeFrame({ ...frame, lineY1: value })}
        />
      )
    },
    {
      id: "line-y2",
      label: "横线2",
      content: (
        <RangeControl
          label="横线 Y2"
          max={GRID_LINE_LIMITS.lineY2.max}
          min={GRID_LINE_LIMITS.lineY2.min}
          step={1}
          suffix="%"
          value={frame.lineY2}
          onChange={(value) => onChangeFrame({ ...frame, lineY2: value })}
        />
      )
    },
    {
      id: "seed",
      label: "种子",
      content: (
        <div className="field field-control seed-control mobile-seed-pane">
          <span>随机种子</span>
          <div className="seed-value-row">
            <strong>{frame.seed}</strong>
            <button
              aria-label="重掷随机种子"
              className="seed-dice"
              title="重掷随机种子"
              type="button"
              onClick={() => onChangeSeed(Math.floor(Math.random() * 100000))}
            >
              <Dices aria-hidden="true" size={15} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      )
    },
    {
      id: "font",
      label: "字体",
      content: <FontControl value={font} onChange={onChangeFont} />
    },
    {
      id: "title",
      label: "标题",
      content: <TextAreaControl label="标题（右下格）" maxLength={10} value={title} onChange={onChangeTitle} />
    }
  ];
}

export function buildGlassMobileTabs({
  frame,
  title,
  subtitle,
  font,
  onChangeFrame,
  onChangeText,
  onChangeFont,
  onApplySystemBacking
}: {
  frame: GlassFrameConfig;
  title: string;
  subtitle: string;
  font: TextFontId;
  onChangeFrame: (frame: GlassFrameConfig) => void;
  onChangeText: (field: "title" | "subtitle", value: string) => void;
  onChangeFont: (font: TextFontId) => void;
  onApplySystemBacking: () => void;
}): MobileInspectorTab[] {
  return [
    {
      id: "ratio",
      label: "比例",
      content: <RatioControl value={frame.canvasRatio} onChange={(canvasRatio) => onChangeFrame({ ...frame, canvasRatio })} />
    },
    {
      id: "backing",
      label: "底色",
      content: (
        <PresetColorControl
          label="底色"
          value={frame.backingColor}
          onPick={(backingColor) => onChangeFrame({ ...frame, backingColor })}
          onSystem={onApplySystemBacking}
        />
      )
    },
    {
      id: "edge",
      label: "边缘",
      content: (
        <RangeControl
          label="边缘宽度"
          max={GLASS_FRAME_LIMITS.edgeWidth.max}
          min={GLASS_FRAME_LIMITS.edgeWidth.min}
          step={0.5}
          suffix="%"
          value={frame.edgeWidth}
          onChange={(value) => onChangeFrame({ ...frame, edgeWidth: value })}
        />
      )
    },
    {
      id: "bottom",
      label: "底边",
      content: (
        <RangeControl
          label="底边加厚"
          max={GLASS_FRAME_LIMITS.bottomExtra.max}
          min={GLASS_FRAME_LIMITS.bottomExtra.min}
          step={0.5}
          suffix="%"
          value={frame.bottomExtra}
          onChange={(value) => onChangeFrame({ ...frame, bottomExtra: value })}
        />
      )
    },
    {
      id: "radius",
      label: "圆角",
      content: (
        <RangeControl
          label="圆角大小"
          max={GLASS_FRAME_LIMITS.outerRadius.max}
          min={GLASS_FRAME_LIMITS.outerRadius.min}
          step={2}
          suffix="px"
          value={frame.outerRadius}
          onChange={(value) => onChangeFrame({ ...frame, outerRadius: value })}
        />
      )
    },
    {
      id: "blur",
      label: "磨砂",
      content: (
        <RangeControl
          label="磨砂模糊"
          max={GLASS_FRAME_LIMITS.blur.max}
          min={GLASS_FRAME_LIMITS.blur.min}
          step={1}
          suffix="px"
          value={frame.blur}
          onChange={(value) => onChangeFrame({ ...frame, blur: value })}
        />
      )
    },
    {
      id: "text-tone",
      label: "字色",
      content: (
        <div className="field field-control">
          <span>文字颜色</span>
          <SegmentedControl
            wrap
            options={GLASS_TEXT_TONE_OPTIONS}
            value={frame.textTone}
            onChange={(textTone) => onChangeFrame({ ...frame, textTone })}
          />
        </div>
      )
    },
    {
      id: "font",
      label: "字体",
      content: <FontControl value={font} onChange={onChangeFont} />
    },
    {
      id: "title",
      label: "标题",
      content: <TextAreaControl label="标题" maxLength={24} value={title} onChange={(value) => onChangeText("title", value)} />
    },
    {
      id: "subtitle",
      label: "副标题",
      content: (
        <TextAreaControl label="副标题" maxLength={48} value={subtitle} onChange={(value) => onChangeText("subtitle", value)} />
      )
    }
  ];
}

export function buildGlassSillMobileTabs({
  frame,
  caption,
  font,
  onChangeFrame,
  onChangeCaption,
  onChangeFont,
  onApplySystemBacking
}: {
  frame: GlassSillFrameConfig;
  caption: string;
  font: TextFontId;
  onChangeFrame: (frame: GlassSillFrameConfig) => void;
  onChangeCaption: (value: string) => void;
  onChangeFont: (font: TextFontId) => void;
  onApplySystemBacking: () => void;
}): MobileInspectorTab[] {
  return [
    {
      id: "ratio",
      label: "比例",
      content: <RatioControl value={frame.canvasRatio} onChange={(canvasRatio) => onChangeFrame({ ...frame, canvasRatio })} />
    },
    {
      id: "backing",
      label: "底色",
      content: (
        <PresetColorControl
          label="底色"
          value={frame.backingColor}
          onPick={(backingColor) => onChangeFrame({ ...frame, backingColor })}
          onSystem={onApplySystemBacking}
        />
      )
    },
    {
      id: "edge",
      label: "边缘",
      content: (
        <RangeControl
          label="边缘宽度"
          max={GLASS_SILL_FRAME_LIMITS.edgeWidth.max}
          min={GLASS_SILL_FRAME_LIMITS.edgeWidth.min}
          step={0.5}
          suffix="%"
          value={frame.edgeWidth}
          onChange={(value) => onChangeFrame({ ...frame, edgeWidth: value })}
        />
      )
    },
    {
      id: "bottom",
      label: "底边",
      content: (
        <RangeControl
          label="底边厚度"
          max={GLASS_SILL_FRAME_LIMITS.bottomBand.max}
          min={GLASS_SILL_FRAME_LIMITS.bottomBand.min}
          step={0.5}
          suffix="%"
          value={frame.bottomBand}
          onChange={(value) => onChangeFrame({ ...frame, bottomBand: value })}
        />
      )
    },
    {
      id: "radius",
      label: "圆角",
      content: (
        <RangeControl
          label="圆角大小"
          max={GLASS_SILL_FRAME_LIMITS.outerRadius.max}
          min={GLASS_SILL_FRAME_LIMITS.outerRadius.min}
          step={2}
          suffix="px"
          value={frame.outerRadius}
          onChange={(value) => onChangeFrame({ ...frame, outerRadius: value })}
        />
      )
    },
    {
      id: "blur",
      label: "磨砂",
      content: (
        <RangeControl
          label="磨砂模糊"
          max={GLASS_SILL_FRAME_LIMITS.blur.max}
          min={GLASS_SILL_FRAME_LIMITS.blur.min}
          step={1}
          suffix="px"
          value={frame.blur}
          onChange={(value) => onChangeFrame({ ...frame, blur: value })}
        />
      )
    },
    {
      id: "text-tone",
      label: "字色",
      content: (
        <div className="field field-control">
          <span>文字颜色</span>
          <SegmentedControl
            wrap
            options={GLASS_TEXT_TONE_OPTIONS}
            value={frame.textTone}
            onChange={(textTone) => onChangeFrame({ ...frame, textTone })}
          />
        </div>
      )
    },
    {
      id: "font",
      label: "字体",
      content: <FontControl value={font} onChange={onChangeFont} />
    },
    {
      id: "caption",
      label: "文字",
      content: <TextAreaControl label="底边文字" maxLength={40} value={caption} onChange={onChangeCaption} />
    }
  ];
}

export function buildBandMobileTabs({
  frame,
  title,
  subtitle,
  font,
  onChangeFrame,
  onChangeText,
  onChangeFont,
  onApplySystemColor
}: {
  frame: BandFrameConfig;
  title: string;
  subtitle: string;
  font: TextFontId;
  onChangeFrame: (frame: BandFrameConfig) => void;
  onChangeText: (field: "title" | "subtitle", value: string) => void;
  onChangeFont: (font: TextFontId) => void;
  onApplySystemColor: (target: "band" | "backing") => void;
}): MobileInspectorTab[] {
  return [
    {
      id: "ratio",
      label: "比例",
      content: <RatioControl value={frame.canvasRatio} onChange={(canvasRatio) => onChangeFrame({ ...frame, canvasRatio })} />
    },
    {
      id: "margin",
      label: "外边缘",
      content: (
        <RangeControl
          label="外边缘"
          max={BAND_FRAME_LIMITS.outerMargin.max}
          min={BAND_FRAME_LIMITS.outerMargin.min}
          step={0.5}
          suffix="%"
          value={frame.outerMargin}
          onChange={(value) => onChangeFrame({ ...frame, outerMargin: value })}
        />
      )
    },
    {
      id: "band-height",
      label: "腰封",
      content: (
        <RangeControl
          label="腰封高度"
          max={BAND_FRAME_LIMITS.bandHeight.max}
          min={BAND_FRAME_LIMITS.bandHeight.min}
          step={1}
          suffix="%"
          value={frame.bandHeight}
          onChange={(value) => onChangeFrame({ ...frame, bandHeight: value })}
        />
      )
    },
    {
      id: "subtitle-size",
      label: "副字号",
      content: (
        <RangeControl
          label="副标题字号"
          max={BAND_FRAME_LIMITS.subtitleSize.max}
          min={BAND_FRAME_LIMITS.subtitleSize.min}
          step={1}
          suffix="px"
          value={frame.subtitleSize}
          onChange={(value) => onChangeFrame({ ...frame, subtitleSize: value })}
        />
      )
    },
    {
      id: "title-size",
      label: "主字号",
      content: (
        <RangeControl
          label="标题字号"
          max={BAND_FRAME_LIMITS.titleSize.max}
          min={BAND_FRAME_LIMITS.titleSize.min}
          step={1}
          suffix="px"
          value={frame.titleSize}
          onChange={(value) => onChangeFrame({ ...frame, titleSize: value })}
        />
      )
    },
    {
      id: "band-color",
      label: "腰封色",
      content: (
        <PresetColorControl
          label="腰封颜色"
          value={frame.bandColor}
          onPick={(choice) => onChangeFrame({ ...frame, bandColor: choice })}
          onSystem={() => onApplySystemColor("band")}
        />
      )
    },
    {
      id: "backing-color",
      label: "衬底色",
      content: (
        <PresetColorControl
          label="衬底颜色"
          value={frame.backingColor}
          onPick={(choice) => onChangeFrame({ ...frame, backingColor: choice })}
          onSystem={() => onApplySystemColor("backing")}
        />
      )
    },
    {
      id: "font",
      label: "字体",
      content: <FontControl value={font} onChange={onChangeFont} />
    },
    {
      id: "title",
      label: "标题",
      content: <TextAreaControl label="标题句" maxLength={40} value={title} onChange={(value) => onChangeText("title", value)} />
    },
    {
      id: "subtitle",
      label: "副标题",
      content: (
        <TextAreaControl label="副标题" maxLength={24} value={subtitle} onChange={(value) => onChangeText("subtitle", value)} />
      )
    }
  ];
}

export function buildFlutedMobileTabs({
  frame,
  onChangeFrame
}: {
  frame: FlutedFrameConfig;
  onChangeFrame: (frame: FlutedFrameConfig) => void;
}): MobileInspectorTab[] {
  return [
    {
      id: "ratio",
      label: "比例",
      content: <RatioControl value={frame.canvasRatio} onChange={(canvasRatio) => onChangeFrame({ ...frame, canvasRatio })} />
    },
    {
      id: "margin",
      label: "边距",
      content: (
        <RangeControl
          label="边缘间距"
          max={FLUTED_FRAME_LIMITS.windowMargin.max}
          min={FLUTED_FRAME_LIMITS.windowMargin.min}
          step={1}
          suffix="%"
          value={frame.windowMargin}
          onChange={(value) => onChangeFrame({ ...frame, windowMargin: value })}
        />
      )
    },
    {
      id: "inner-radius",
      label: "圆角",
      content: (
        <RangeControl
          label="中央圆角"
          max={FLUTED_FRAME_LIMITS.innerRadius.max}
          min={FLUTED_FRAME_LIMITS.innerRadius.min}
          step={2}
          suffix="px"
          value={frame.innerRadius}
          onChange={(value) => onChangeFrame({ ...frame, innerRadius: value })}
        />
      )
    },
    {
      id: "border",
      label: "描边",
      content: (
        <RangeControl
          label="描边宽度"
          max={FLUTED_FRAME_LIMITS.borderWidth.max}
          min={FLUTED_FRAME_LIMITS.borderWidth.min}
          step={1}
          suffix="px"
          value={frame.borderWidth}
          onChange={(value) => onChangeFrame({ ...frame, borderWidth: value })}
        />
      )
    }
  ];
}
