import type { GlassSillFrameConfig, GlassTextTone } from "../../types";
import { GLASS_SILL_FRAME_LIMITS } from "../../templates/glassSillFrame";
import type { TextFontId } from "../../templates/fonts";
import { FontControl, PresetColorControl, RangeControl, RatioControl, SegmentedControl, TextAreaControl, type SegmentedOption } from "./controls";

const TEXT_TONE_OPTIONS: SegmentedOption<GlassTextTone>[] = [
  { value: "white", label: "白" },
  { value: "black", label: "黑" },
  { value: "gray", label: "灰" }
];

export function GlassSillFrameControls({
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
        max={GLASS_SILL_FRAME_LIMITS.edgeWidth.max}
        min={GLASS_SILL_FRAME_LIMITS.edgeWidth.min}
        step={0.5}
        suffix="%"
        value={frame.edgeWidth}
        onChange={(value) => onChangeFrame({ ...frame, edgeWidth: value })}
      />
      <RangeControl
        label="底边厚度"
        max={GLASS_SILL_FRAME_LIMITS.bottomBand.max}
        min={GLASS_SILL_FRAME_LIMITS.bottomBand.min}
        step={0.5}
        suffix="%"
        value={frame.bottomBand}
        onChange={(value) => onChangeFrame({ ...frame, bottomBand: value })}
      />
      <RangeControl
        label="圆角大小"
        max={GLASS_SILL_FRAME_LIMITS.outerRadius.max}
        min={GLASS_SILL_FRAME_LIMITS.outerRadius.min}
        step={2}
        suffix="px"
        value={frame.outerRadius}
        onChange={(value) => onChangeFrame({ ...frame, outerRadius: value })}
      />
      <RangeControl
        label="磨砂模糊"
        max={GLASS_SILL_FRAME_LIMITS.blur.max}
        min={GLASS_SILL_FRAME_LIMITS.blur.min}
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
      <TextAreaControl label="底边文字" maxLength={40} value={caption} onChange={onChangeCaption} />
    </>
  );
}
