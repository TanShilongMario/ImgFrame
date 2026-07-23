import type { BandColorChoice, BandFrameConfig } from "../../types";
import { BAND_FRAME_LIMITS } from "../../templates/bandFrame";
import type { TextFontId } from "../../templates/fonts";
import { FontControl, PresetColorControl, RangeControl, RatioControl, TextAreaControl } from "./controls";

export function BandFrameControls({
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
}) {
  return (
    <>
      <RatioControl value={frame.canvasRatio} onChange={(canvasRatio) => onChangeFrame({ ...frame, canvasRatio })} />
      <RangeControl
        label="外边缘"
        max={BAND_FRAME_LIMITS.outerMargin.max}
        min={BAND_FRAME_LIMITS.outerMargin.min}
        step={0.5}
        suffix="%"
        value={frame.outerMargin}
        onChange={(value) => onChangeFrame({ ...frame, outerMargin: value })}
      />
      <RangeControl
        label="腰封高度"
        max={BAND_FRAME_LIMITS.bandHeight.max}
        min={BAND_FRAME_LIMITS.bandHeight.min}
        step={1}
        suffix="%"
        value={frame.bandHeight}
        onChange={(value) => onChangeFrame({ ...frame, bandHeight: value })}
      />
      <RangeControl
        label="副标题字号"
        max={BAND_FRAME_LIMITS.subtitleSize.max}
        min={BAND_FRAME_LIMITS.subtitleSize.min}
        step={1}
        suffix="px"
        value={frame.subtitleSize}
        onChange={(value) => onChangeFrame({ ...frame, subtitleSize: value })}
      />
      <RangeControl
        label="标题字号"
        max={BAND_FRAME_LIMITS.titleSize.max}
        min={BAND_FRAME_LIMITS.titleSize.min}
        step={1}
        suffix="px"
        value={frame.titleSize}
        onChange={(value) => onChangeFrame({ ...frame, titleSize: value })}
      />
      <PresetColorControl
        label="腰封颜色"
        value={frame.bandColor}
        onPick={(choice) => onChangeFrame({ ...frame, bandColor: choice })}
        onSystem={() => onApplySystemColor("band")}
      />
      <PresetColorControl
        label="衬底颜色"
        value={frame.backingColor}
        onPick={(choice) => onChangeFrame({ ...frame, backingColor: choice })}
        onSystem={() => onApplySystemColor("backing")}
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
