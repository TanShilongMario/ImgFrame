import type { FlutedFrameConfig } from "../../types";
import { FLUTED_FRAME_LIMITS } from "../../templates/flutedFrame";
import { RangeControl, RatioControl } from "./controls";

export function FlutedFrameControls({
  frame,
  onChangeFrame
}: {
  frame: FlutedFrameConfig;
  onChangeFrame: (frame: FlutedFrameConfig) => void;
}) {
  return (
    <>
      <RatioControl value={frame.canvasRatio} onChange={(canvasRatio) => onChangeFrame({ ...frame, canvasRatio })} />
      <RangeControl
        label="边缘间距"
        max={FLUTED_FRAME_LIMITS.windowMargin.max}
        min={FLUTED_FRAME_LIMITS.windowMargin.min}
        step={1}
        suffix="%"
        value={frame.windowMargin}
        onChange={(value) => onChangeFrame({ ...frame, windowMargin: value })}
      />
      <RangeControl
        label="中央圆角"
        max={FLUTED_FRAME_LIMITS.innerRadius.max}
        min={FLUTED_FRAME_LIMITS.innerRadius.min}
        step={2}
        suffix="px"
        value={frame.innerRadius}
        onChange={(value) => onChangeFrame({ ...frame, innerRadius: value })}
      />
      <RangeControl
        label="描边宽度"
        max={FLUTED_FRAME_LIMITS.borderWidth.max}
        min={FLUTED_FRAME_LIMITS.borderWidth.min}
        step={1}
        suffix="px"
        value={frame.borderWidth}
        onChange={(value) => onChangeFrame({ ...frame, borderWidth: value })}
      />
    </>
  );
}
