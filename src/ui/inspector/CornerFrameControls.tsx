import type { BandColorChoice, CornerFrameConfig, GlassTextTone } from "../../types";
import { CORNER_FRAME_LIMITS, CORNER_TEXT_ANCHOR_OPTIONS } from "../../templates/cornerFrame";
import type { TextFontId } from "../../templates/fonts";
import {
  FieldCaption,
  FontControl,
  PresetColorControl,
  RangeControl,
  RatioControl,
  SegmentedControl,
  TextAreaControl,
  type SegmentedOption
} from "./controls";

const TEXT_TONE_OPTIONS: SegmentedOption<GlassTextTone>[] = [
  { value: "white", label: "白" },
  { value: "black", label: "黑" },
  { value: "gray", label: "灰" }
];

export function CornerFrameControls({
  frame,
  title,
  subtitle,
  font,
  onChangeFrame,
  onChangeText,
  onChangeFont,
  onApplySystemBacking
}: {
  frame: CornerFrameConfig;
  title: string;
  subtitle: string;
  font: TextFontId;
  onChangeFrame: (frame: CornerFrameConfig) => void;
  onChangeText: (field: "title" | "subtitle", value: string) => void;
  onChangeFont: (font: TextFontId) => void;
  onApplySystemBacking: () => void;
}) {
  return (
    <>
      <RatioControl value={frame.canvasRatio} onChange={(canvasRatio) => onChangeFrame({ ...frame, canvasRatio })} />
      <RangeControl
        label="外边缘"
        max={CORNER_FRAME_LIMITS.outerMargin.max}
        min={CORNER_FRAME_LIMITS.outerMargin.min}
        step={0.5}
        suffix="%"
        value={frame.outerMargin}
        onChange={(value) => onChangeFrame({ ...frame, outerMargin: value })}
      />
      <RangeControl
        label="图片圆角"
        max={CORNER_FRAME_LIMITS.mediaRadius.max}
        min={CORNER_FRAME_LIMITS.mediaRadius.min}
        step={2}
        suffix="px"
        value={frame.mediaRadius}
        onChange={(value) => onChangeFrame({ ...frame, mediaRadius: value })}
      />
      <RangeControl
        label="描边宽度"
        max={CORNER_FRAME_LIMITS.borderWidth.max}
        min={CORNER_FRAME_LIMITS.borderWidth.min}
        step={1}
        suffix="px"
        value={frame.borderWidth}
        onChange={(value) => onChangeFrame({ ...frame, borderWidth: value })}
      />
      <div className="field field-control">
        <FieldCaption>文字位置</FieldCaption>
        <SegmentedControl
          options={CORNER_TEXT_ANCHOR_OPTIONS}
          value={frame.textCorner}
          onChange={(textCorner) => onChangeFrame({ ...frame, textCorner })}
        />
      </div>
      <div className="field field-control">
        <FieldCaption>文字颜色</FieldCaption>
        <SegmentedControl
          options={TEXT_TONE_OPTIONS}
          value={frame.textTone}
          onChange={(textTone) => onChangeFrame({ ...frame, textTone })}
        />
      </div>
      <RangeControl
        label="副标题字号"
        max={CORNER_FRAME_LIMITS.subtitleSize.max}
        min={CORNER_FRAME_LIMITS.subtitleSize.min}
        step={1}
        suffix="px"
        value={frame.subtitleSize}
        onChange={(value) => onChangeFrame({ ...frame, subtitleSize: value })}
      />
      <RangeControl
        label="标题字号"
        max={CORNER_FRAME_LIMITS.titleSize.max}
        min={CORNER_FRAME_LIMITS.titleSize.min}
        step={1}
        suffix="px"
        value={frame.titleSize}
        onChange={(value) => onChangeFrame({ ...frame, titleSize: value })}
      />
      <PresetColorControl
        label="衬底颜色"
        value={frame.backingColor}
        onPick={(choice: BandColorChoice) => onChangeFrame({ ...frame, backingColor: choice })}
        onSystem={onApplySystemBacking}
      />
      <FontControl value={font} onChange={onChangeFont} />
      <TextAreaControl label="标题句" maxLength={64} value={title} onChange={(value) => onChangeText("title", value)} />
      <TextAreaControl
        label="副标题"
        maxLength={40}
        value={subtitle}
        onChange={(value) => onChangeText("subtitle", value)}
      />
    </>
  );
}
