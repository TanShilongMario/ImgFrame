import { useEffect, useState, type CSSProperties } from "react";
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

function getStepDecimals(step: number) {
  if (!String(step).includes(".")) {
    return 0;
  }

  return String(step).split(".")[1]?.length ?? 0;
}

function formatRangeValue(value: number, step: number) {
  const decimals = getStepDecimals(step);
  return decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
}

function snapRangeValue(value: number, min: number, max: number, step: number) {
  const decimals = getStepDecimals(step);
  const snapped = Math.round((value - min) / step) * step + min;
  const clamped = Math.min(max, Math.max(min, snapped));
  return Number(clamped.toFixed(decimals));
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
  const ratio = max === min ? 0 : (value - min) / (max - min);
  const [draft, setDraft] = useState(() => formatRangeValue(value, step));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setDraft(formatRangeValue(value, step));
    }
  }, [value, step, isEditing]);

  function commitDraft(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      setDraft(formatRangeValue(value, step));
      return;
    }

    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) {
      setDraft(formatRangeValue(value, step));
      return;
    }

    onChange(snapRangeValue(parsed, min, max, step));
  }

  return (
    <div className="field field-control range-control">
      <span>{label}</span>
      <div className="range-control-row">
        <div className="range-track-shell">
          <div className="range-track-inner">
            <div aria-hidden="true" className="range-track-fill-clip" style={{ width: `${ratio * 100}%` }}>
              <div className="range-track-fill" />
            </div>
            <input
              aria-label={label}
              className="range-track-input"
              max={max}
              min={min}
              step={step}
              type="range"
              value={value}
              onChange={(event) => onChange(Number(event.target.value))}
            />
          </div>
        </div>
        <div className="range-control-value">
          <input
            aria-label={`${label}数值`}
            className="range-control-value-input"
            inputMode="decimal"
            type="text"
            value={draft}
            onBlur={() => {
              setIsEditing(false);
              commitDraft(draft);
            }}
            onChange={(event) => {
              const next = event.target.value;
              if (next === "" || /^-?\d*\.?\d*$/.test(next)) {
                setDraft(next);
              }
            }}
            onFocus={() => setIsEditing(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
          />
          {suffix ? <span className="range-control-value-suffix">{suffix}</span> : null}
        </div>
      </div>
    </div>
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
    <div className="field text-control">
      <span>{label}</span>
      <div className="range-track-shell text-control-shell">
        <textarea maxLength={maxLength} value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    </div>
  );
}
