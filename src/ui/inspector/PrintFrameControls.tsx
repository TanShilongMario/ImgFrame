import { Dices } from "lucide-react";
import type { PrintFrameConfig, PrintPaperColor } from "../../types";
import { PRINT_FRAME_LIMITS, PRINT_PAPER_COLORS } from "../../templates/printFrame";
import { RangeControl, RatioControl } from "./controls";

export function PrintFrameControls({
  frame,
  onChangeFrame,
  onChangeSeed
}: {
  frame: PrintFrameConfig;
  onChangeFrame: (frame: PrintFrameConfig) => void;
  onChangeSeed: (seed: number) => void;
}) {
  return (
    <>
      <RatioControl value={frame.canvasRatio} onChange={(canvasRatio) => onChangeFrame({ ...frame, canvasRatio })} />
      <RangeControl
        label="边缘间距"
        max={PRINT_FRAME_LIMITS.windowMargin.max}
        min={PRINT_FRAME_LIMITS.windowMargin.min}
        step={1}
        suffix="%"
        value={frame.windowMargin}
        onChange={(value) => onChangeFrame({ ...frame, windowMargin: value })}
      />
      <RangeControl
        label="中央圆角"
        max={PRINT_FRAME_LIMITS.innerRadius.max}
        min={PRINT_FRAME_LIMITS.innerRadius.min}
        step={2}
        suffix="px"
        value={frame.innerRadius}
        onChange={(value) => onChangeFrame({ ...frame, innerRadius: value })}
      />
      <RangeControl
        label="描边宽度"
        max={PRINT_FRAME_LIMITS.borderWidth.max}
        min={PRINT_FRAME_LIMITS.borderWidth.min}
        step={1}
        suffix="px"
        value={frame.borderWidth}
        onChange={(value) => onChangeFrame({ ...frame, borderWidth: value })}
      />
      <div className="field field-control band-color-field">
        <span>衬底纸张</span>
        <div className="band-color-control">
          <div className="segmented-control segmented-control-colors band-color-row">
            {PRINT_PAPER_COLORS.map((option) => (
              <button
                key={option.id}
                aria-label={option.label}
                aria-pressed={frame.backingColor === option.id}
                className={`band-color-swatch${frame.backingColor === option.id ? " is-active" : ""}`}
                title={option.label}
                type="button"
                onClick={() => onChangeFrame({ ...frame, backingColor: option.id as PrintPaperColor })}
              >
                <span aria-hidden="true" className="band-color-swatch-chip" style={{ background: option.hex }} />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="field field-control seed-control">
        <span>随机网点</span>
        <div className="seed-value-row">
          <strong>{frame.seed}</strong>
          <button
            aria-label="重掷网点参数"
            className="seed-dice"
            title="重掷网点参数"
            type="button"
            onClick={() => onChangeSeed(Math.floor(Math.random() * 100000))}
          >
            <Dices aria-hidden="true" size={15} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </>
  );
}
