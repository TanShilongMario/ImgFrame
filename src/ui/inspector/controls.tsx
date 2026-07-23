import { useEffect, useState, type CSSProperties } from "react";
import { Dices } from "lucide-react";
import { useLocale } from "../../i18n/LocaleContext";
import type { BandColorChoice, PrintPaperColor, RefinedCanvasRatio } from "../../types";
import { BAND_FIXED_COLORS } from "../../templates/bandFrame";
import { PRINT_PAPER_COLORS } from "../../templates/printFrame";
import { TEXT_FONT_OPTIONS, type TextFontId } from "../../templates/fonts";

/** 将中文控件标签按当前语言显示 */
export function ControlLabel({ children }: { children: string }) {
  const { tl } = useLocale();
  return <>{tl(children)}</>;
}

/** 字段标题（替换原 <span>中文</span>） */
export function FieldCaption({ children }: { children: string }) {
  const { tl } = useLocale();
  return <span>{tl(children)}</span>;
}

/** 骰子重掷按钮，自动翻译 aria/title */
export function LocalizedDiceButton({
  label,
  onClick,
  className = "seed-dice"
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  const { tl } = useLocale();
  const text = tl(label);
  return (
    <button aria-label={text} className={className} title={text} type="button" onClick={onClick}>
      <Dices aria-hidden="true" size={15} strokeWidth={2.2} />
    </button>
  );
}

export function Field({ label, value }: { label: string; value: string }) {
  const { tl } = useLocale();
  return (
    <div className="field">
      <span>{tl(label)}</span>
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
  const { tl } = useLocale();
  const displayLabel = tl(label);
  const displaySuffix = suffix ? tl(suffix) : "";
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
      <span>{displayLabel}</span>
      <div className="range-control-row">
        <div className="range-track-shell">
          <div className="range-track-inner">
            <div aria-hidden="true" className="range-track-fill-clip" style={{ width: `${ratio * 100}%` }}>
              <div className="range-track-fill" />
            </div>
            <input
              aria-label={displayLabel}
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
            aria-label={`${displayLabel} ${tl("数值")}`}
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
          {displaySuffix ? <span className="range-control-value-suffix">{displaySuffix}</span> : null}
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
  const { tl } = useLocale();

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
          {tl(option.label)}
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
  const { tl } = useLocale();

  return (
    <div className="field field-control">
      <span>{tl("画布比例")}</span>
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
  const { tl } = useLocale();

  return (
    <div className="field field-control">
      <span>{tl("字体")}</span>
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
  const { tl } = useLocale();

  return (
    <div className="field text-control">
      <span>{tl(label)}</span>
      <div className="range-track-shell text-control-shell">
        <textarea maxLength={maxLength} value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    </div>
  );
}

export function PresetColorControl({
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
  const { tl } = useLocale();

  return (
    <div className="field field-control band-color-field">
      <span>{tl(label)}</span>
      <div className="band-color-control">
        <div className="segmented-control segmented-control-colors band-color-row">
          {BAND_FIXED_COLORS.map((option) => {
            const optionLabel = tl(option.label);
            return (
              <button
                key={option.id}
                aria-label={optionLabel}
                aria-pressed={value === option.id}
                className={`band-color-swatch${value === option.id ? " is-active" : ""}`}
                title={optionLabel}
                type="button"
                onClick={() => onPick(option.id)}
              >
                <span aria-hidden="true" className="band-color-swatch-chip" style={{ background: option.hex }} />
              </button>
            );
          })}
        </div>
        <div className="segmented-control band-color-system-row">
          <button
            aria-pressed={value === "system"}
            className={value === "system" ? "is-active" : ""}
            type="button"
            onClick={() => {
              if (value !== "system") {
                onPick("system");
              }
              onSystem();
            }}
          >
            <Dices aria-hidden="true" size={14} strokeWidth={2.2} />
            {tl("系统配色")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PaperColorControl({
  value,
  onChange
}: {
  value: PrintPaperColor;
  onChange: (value: PrintPaperColor) => void;
}) {
  const { tl } = useLocale();

  return (
    <div className="field field-control band-color-field">
      <span>{tl("衬底纸张")}</span>
      <div className="band-color-control">
        <div className="segmented-control segmented-control-colors band-color-row">
          {PRINT_PAPER_COLORS.map((option) => {
            const optionLabel = tl(option.label);
            return (
              <button
                key={option.id}
                aria-label={optionLabel}
                aria-pressed={value === option.id}
                className={`band-color-swatch${value === option.id ? " is-active" : ""}`}
                title={optionLabel}
                type="button"
                onClick={() => onChange(option.id)}
              >
                <span aria-hidden="true" className="band-color-swatch-chip" style={{ background: option.hex }} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}