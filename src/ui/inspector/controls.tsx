import type { CSSProperties } from "react";
import type { RefinedCanvasRatio } from "../../types";
import { TEXT_FONT_OPTIONS, type TextFontId } from "../../templates/fonts";

export function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function RangeControl({
  label,
  max,
  min,
  step,
  suffix,
  value,
  onChange
}: {
  label: string;
  max: number;
  min: number;
  step: number;
  suffix: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field field-control range-control">
      <span>{label}</span>
      <strong>
        {value}
        {suffix}
      </strong>
      <input
        max={max}
        min={min}
        step={step}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  style?: CSSProperties;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  wrap = false,
  onChange
}: {
  options: SegmentedOption<T>[];
  value: T;
  wrap?: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <div className={`segmented-control${wrap ? " segmented-control-wrap" : ""}`}>
      {options.map((option) => (
        <button
          key={option.value}
          aria-pressed={value === option.value}
          className={value === option.value ? "is-active" : ""}
          style={option.style}
          type="button"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

const RATIO_OPTIONS: SegmentedOption<RefinedCanvasRatio>[] = [
  { value: "16:9", label: "16:9" },
  { value: "4:3", label: "4:3" },
  { value: "1:1", label: "1:1" },
  { value: "3:4", label: "3:4" },
  { value: "9:16", label: "9:16" },
  { value: "auto", label: "随原图" }
];

export function RatioControl({
  value,
  onChange
}: {
  value: RefinedCanvasRatio;
  onChange: (value: RefinedCanvasRatio) => void;
}) {
  return (
    <div className="field field-control">
      <span>画布比例</span>
      <SegmentedControl wrap options={RATIO_OPTIONS} value={value} onChange={onChange} />
    </div>
  );
}

const FONT_OPTIONS: SegmentedOption<TextFontId>[] = TEXT_FONT_OPTIONS.map((option) => ({
  value: option.id,
  label: option.label,
  style: { fontFamily: option.stack }
}));

export function FontControl({
  value,
  onChange
}: {
  value: TextFontId;
  onChange: (value: TextFontId) => void;
}) {
  return (
    <div className="field field-control">
      <span>字体</span>
      <SegmentedControl wrap options={FONT_OPTIONS} value={value} onChange={onChange} />
    </div>
  );
}

export function TextAreaControl({
  label,
  maxLength,
  value,
  onChange
}: {
  label: string;
  maxLength: number;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field text-control">
      <span>{label}</span>
      <textarea maxLength={maxLength} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
