import type { GlassFrameConfig, GlassTextTone } from "../../types";
import { GLASS_FRAME_LIMITS } from "../../templates/glassFrame";
import type { TextFontId } from "../../templates/fonts";
import { FontControl, PresetColorControl, RangeControl, RatioControl, SegmentedControl, TextAreaControl, type SegmentedOption } from "./controls";

const TEXT_TONE_OPTIONS: SegmentedOption<GlassTextTone>[] = [
  { value: "white", label: "白" },
  { value: "black", label: "黑" },
  { value: "gray", label: "灰" }
];

export function GlassFrameControls({
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
}) {
  return (
    <>
      <RatioControl value={frame.canvasRatio} onChange={(canvasRatio) => onChangeFrame({ ...frame, canvasRatio })} />
      <PresetColorControl
        label="底色"
        value={frame.backingColor}
        onPick={(backingColor) => onChangeFrame({ ...frame, backingColor })}
        onSystem={onApplySystemBacking}
      />
      <RangeControl
        label="边缘宽度"
        max={GLASS_FRAME_LIMITS.edgeWidth.max}
        min={GLASS_FRAME_LIMITS.edgeWidth.min}
        step={0.5}
        suffix="%"
        value={frame.edgeWidth}
        onChange={(value) => onChangeFrame({ ...frame, edgeWidth: value })}
      />
      <RangeControl
        label="底边加厚"
        max={GLASS_FRAME_LIMITS.bottomExtra.max}
        min={GLASS_FRAME_LIMITS.bottomExtra.min}
        step={0.5}
        suffix="%"
        value={frame.bottomExtra}
        onChange={(value) => onChangeFrame({ ...frame, bottomExtra: value })}
      />
      <RangeControl
        label="圆角大小"
        max={GLASS_FRAME_LIMITS.outerRadius.max}
        min={GLASS_FRAME_LIMITS.outerRadius.min}
        step={2}
        suffix="px"
        value={frame.outerRadius}
        onChange={(value) => onChangeFrame({ ...frame, outerRadius: value })}
      />
      <RangeControl
        label="磨砂模糊"
        max={GLASS_FRAME_LIMITS.blur.max}
        min={GLASS_FRAME_LIMITS.blur.min}
        step={1}
        suffix="px"
        value={frame.blur}
        onChange={(value) => onChangeFrame({ ...frame, blur: value })}
      />
      <div className="field field-control">
        <span>文字颜色</span>
        <SegmentedControl
          wrap
          options={TEXT_TONE_OPTIONS}
          value={frame.textTone}
          onChange={(textTone) => onChangeFrame({ ...frame, textTone })}
        />
      </div>
      <RangeControl
        label="标题字号"
        max={GLASS_FRAME_LIMITS.titleSize.max}
        min={GLASS_FRAME_LIMITS.titleSize.min}
        step={1}
        suffix="px"
        value={frame.titleSize}
        onChange={(titleSize) => onChangeFrame({ ...frame, titleSize })}
      />
      <RangeControl
        label="副标题字号"
        max={GLASS_FRAME_LIMITS.subtitleSize.max}
        min={GLASS_FRAME_LIMITS.subtitleSize.min}
        step={1}
        suffix="px"
        value={frame.subtitleSize}
        onChange={(subtitleSize) => onChangeFrame({ ...frame, subtitleSize })}
      />
      <FontControl value={font} onChange={onChangeFont} />
      <TextAreaControl label="标题" maxLength={40} value={title} onChange={(value) => onChangeText("title", value)} />
      <TextAreaControl
        label="副标题"
        maxLength={72}
        value={subtitle}
        onChange={(value) => onChangeText("subtitle", value)}
      />
    </>
  );
}
