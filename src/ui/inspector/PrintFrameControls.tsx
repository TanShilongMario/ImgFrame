import type { PrintFrameConfig } from "../../types";
import { PRINT_FRAME_LIMITS } from "../../templates/printFrame";
import { FieldCaption, LocalizedDiceButton, PaperColorControl, RangeControl, RatioControl } from "./controls";

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
      <PaperColorControl
        value={frame.backingColor}
        onChange={(backingColor) => onChangeFrame({ ...frame, backingColor })}
      />
      <div className="field field-control seed-control">
        <FieldCaption>随机网点</FieldCaption>
        <div className="seed-value-row">
          <strong>{frame.seed}</strong>
          <LocalizedDiceButton label="重掷网点参数" onClick={() => onChangeSeed(Math.floor(Math.random() * 100000))} />
        </div>
      </div>
    </>
  );
}
