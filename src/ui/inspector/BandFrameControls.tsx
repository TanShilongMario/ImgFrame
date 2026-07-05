import { Dices } from "lucide-react";
import type { BandColorChoice, BandFrameConfig } from "../../types";
import { BAND_FIXED_COLORS, BAND_FRAME_LIMITS } from "../../templates/bandFrame";
import type { TextFontId } from "../../templates/fonts";
import { FontControl, RangeControl, RatioControl, TextAreaControl } from "./controls";

function BandColorControl({
  label,
  value,
  onPick,
  onSystem
}: {
  label: string;
  value: BandColorChoice;
  onPick: (choice: BandColorChoice) => void;
  onSystem: () => void;
}) {
  return (
    <div className="field field-control band-color-field">
      <span>{label}</span>
      <div className="band-color-control">
        <div className="segmented-control segmented-control-colors band-color-row">
          {BAND_FIXED_COLORS.map((option) => (
            <button
              key={option.id}
              aria-label={option.label}
              aria-pressed={value === option.id}
              className={`band-color-swatch${value === option.id ? " is-active" : ""}`}
              title={option.label}
              type="button"
              onClick={() => onPick(option.id)}
            >
              <span aria-hidden="true" className="band-color-swatch-chip" style={{ background: option.hex }} />
            </button>
          ))}
        </div>
        <div className="segmented-control band-color-system-row">
          <button
            aria-pressed={value === "system"}
            className={value === "system" ? "is-active" : ""}
            type="button"
            onClick={onSystem}
          >
            <Dices aria-hidden="true" size={14} strokeWidth={2.2} />
            系统配色
          </button>
        </div>
      </div>
    </div>
  );
}

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
      <BandColorControl
        label="腰封颜色"
        value={frame.bandColor}
        onPick={(choice) => onChangeFrame({ ...frame, bandColor: choice })}
        onSystem={() => onApplySystemColor("band")}
      />
      <BandColorControl
        label="衬底颜色"
        value={frame.backingColor}
        onPick={(choice) => onChangeFrame({ ...frame, backingColor: choice })}
        onSystem={() => onApplySystemColor("backing")}
      />
      <FontControl value={font} onChange={onChangeFont} />
      <TextAreaControl label="标题句" maxLength={40} value={title} onChange={(value) => onChangeText("title", value)} />
      <TextAreaControl
        label="副标题"
        maxLength={24}
        value={subtitle}
        onChange={(value) => onChangeText("subtitle", value)}
      />
    </>
  );
}
