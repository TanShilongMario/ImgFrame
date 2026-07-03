import type { GlassFrameConfig, GlassTextTone } from "../../types";
import { GLASS_FRAME_LIMITS } from "../../templates/glassFrame";
import type { TextFontId } from "../../templates/fonts";
import { FontControl, RangeControl, RatioControl, SegmentedControl, TextAreaControl, type SegmentedOption } from "./controls";

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
  onChangeFont
}: {
  frame: GlassFrameConfig;
  title: string;
  subtitle: string;
  font: TextFontId;
  onChangeFrame: (frame: GlassFrameConfig) => void;
  onChangeText: (field: "title" | "subtitle", value: string) => void;
  onChangeFont: (font: TextFontId) => void;
}) {
  return (
    <>
      <RatioControl value={frame.canvasRatio} onChange={(canvasRatio) => onChangeFrame({ ...frame, canvasRatio })} />
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
      <FontControl value={font} onChange={onChangeFont} />
      <TextAreaControl label="标题" maxLength={24} value={title} onChange={(value) => onChangeText("title", value)} />
      <TextAreaControl
        label="副标题"
        maxLength={48}
        value={subtitle}
        onChange={(value) => onChangeText("subtitle", value)}
      />
    </>
  );
}
