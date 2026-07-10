import { Dices } from "lucide-react";
import type { DotFrameConfig } from "../../types";
import { DOT_FRAME_LIMITS } from "../../templates/dotFrame";
import { RangeControl, RatioControl } from "./controls";

export function DotFrameControls({
  frame,
  onChangeFrame,
  onChangeSeed
}: {
  frame: DotFrameConfig;
  onChangeFrame: (frame: DotFrameConfig) => void;
  onChangeSeed: (seed: number) => void;
}) {
  return (
    <>
      <RatioControl value={frame.canvasRatio} onChange={(canvasRatio) => onChangeFrame({ ...frame, canvasRatio })} />
      <RangeControl
        label="边缘间距"
        max={DOT_FRAME_LIMITS.windowMargin.max}
        min={DOT_FRAME_LIMITS.windowMargin.min}
        step={1}
        suffix="%"
        value={frame.windowMargin}
        onChange={(value) => onChangeFrame({ ...frame, windowMargin: value })}
      />
      <RangeControl
        label="中央圆角"
        max={DOT_FRAME_LIMITS.innerRadius.max}
        min={DOT_FRAME_LIMITS.innerRadius.min}
        step={2}
        suffix="px"
        value={frame.innerRadius}
        onChange={(value) => onChangeFrame({ ...frame, innerRadius: value })}
      />
      <RangeControl
        label="描边宽度"
        max={DOT_FRAME_LIMITS.borderWidth.max}
        min={DOT_FRAME_LIMITS.borderWidth.min}
        step={1}
        suffix="px"
        value={frame.borderWidth}
        onChange={(value) => onChangeFrame({ ...frame, borderWidth: value })}
      />
      <div className="field field-control seed-control">
        <span>随机波点</span>
        <div className="seed-value-row">
          <strong>{frame.seed}</strong>
          <button
            aria-label="重掷波点参数"
            className="seed-dice"
            title="重掷波点参数"
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
