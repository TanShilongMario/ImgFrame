import type { GradientTone, RefinedFrameConfig } from "../../types";
import type { TextFontId } from "../../templates/fonts";
import {
  FieldCaption,
  FontControl,
  RangeControl,
  RatioControl,
  SegmentedControl,
  TextAreaControl,
  type SegmentedOption
} from "./controls";

const GRADIENT_TONE_OPTIONS: SegmentedOption<GradientTone>[] = [
  { value: "white", label: "白" },
  { value: "black", label: "黑" }
];

export function RefinedFrameControls({
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
  onChangeCredit: (credit: string) => void;
  onChangeFont: (font: TextFontId) => void;
}) {
  return (
    <>
      <RatioControl value={frame.canvasRatio} onChange={(canvasRatio) => onChangeFrame({ ...frame, canvasRatio })} />
      <RangeControl
        label="裁剪宽度"
        max={50}
        min={0}
        step={1}
        suffix="%"
        value={frame.cropWidth}
        onChange={(value) => onChangeFrame({ ...frame, cropWidth: value })}
      />
      <RangeControl
        label="裁剪高度"
        max={50}
        min={0}
        step={1}
        suffix="%"
        value={frame.cropHeight}
        onChange={(value) => onChangeFrame({ ...frame, cropHeight: value })}
      />
      <RangeControl
        label="背景模糊度"
        max={60}
        min={0}
        step={1}
        suffix="px"
        value={frame.backgroundBlur}
        onChange={(value) => onChangeFrame({ ...frame, backgroundBlur: value })}
      />
      <div className="field field-control">
        <FieldCaption>渐变颜色</FieldCaption>
        <SegmentedControl
          options={GRADIENT_TONE_OPTIONS}
          value={frame.gradientTone}
          onChange={(gradientTone) => onChangeFrame({ ...frame, gradientTone })}
        />
      </div>
      <RangeControl
        label="署名字号"
        max={24}
        min={9}
        step={1}
        suffix="px"
        value={frame.creditSize}
        onChange={(creditSize) => onChangeFrame({ ...frame, creditSize })}
      />
      <FontControl value={font} onChange={onChangeFont} />
      <TextAreaControl label="文字内容" maxLength={72} value={credit} onChange={onChangeCredit} />
    </>
  );
}
