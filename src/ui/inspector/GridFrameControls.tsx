import type { GridFrameConfig, GridLineTone } from "../../types";
import { GRID_LINE_LIMITS } from "../../templates/gridFrame";
import type { TextFontId } from "../../templates/fonts";
import {
  FieldCaption,
  FontControl,
  LocalizedDiceButton,
  RangeControl,
  RatioControl,
  SegmentedControl,
  TextAreaControl,
  type SegmentedOption
} from "./controls";

const LINE_TONE_OPTIONS: SegmentedOption<GridLineTone>[] = [
  { value: "white", label: "白" },
  { value: "black", label: "黑" }
];

export function GridFrameControls({
  frame,
  title,
  font,
  onChangeFrame,
  onChangeSeed,
  onChangeTitle,
  onChangeFont
}: {
  frame: GridFrameConfig;
  title: string;
  font: TextFontId;
  onChangeFrame: (frame: GridFrameConfig) => void;
  onChangeSeed: (seed: number) => void;
  onChangeTitle: (title: string) => void;
  onChangeFont: (font: TextFontId) => void;
}) {
  return (
    <>
      <RatioControl value={frame.canvasRatio} onChange={(canvasRatio) => onChangeFrame({ ...frame, canvasRatio })} />
      <div className="field field-control">
        <FieldCaption>线与文字</FieldCaption>
        <SegmentedControl
          options={LINE_TONE_OPTIONS}
          value={frame.lineTone}
          onChange={(lineTone) => onChangeFrame({ ...frame, lineTone })}
        />
      </div>
      <RangeControl
        label="竖线 X1"
        max={GRID_LINE_LIMITS.lineX1.max}
        min={GRID_LINE_LIMITS.lineX1.min}
        step={1}
        suffix="%"
        value={frame.lineX1}
        onChange={(value) => onChangeFrame({ ...frame, lineX1: value })}
      />
      <RangeControl
        label="竖线 X2"
        max={GRID_LINE_LIMITS.lineX2.max}
        min={GRID_LINE_LIMITS.lineX2.min}
        step={1}
        suffix="%"
        value={frame.lineX2}
        onChange={(value) => onChangeFrame({ ...frame, lineX2: value })}
      />
      <RangeControl
        label="横线 Y1"
        max={GRID_LINE_LIMITS.lineY1.max}
        min={GRID_LINE_LIMITS.lineY1.min}
        step={1}
        suffix="%"
        value={frame.lineY1}
        onChange={(value) => onChangeFrame({ ...frame, lineY1: value })}
      />
      <RangeControl
        label="横线 Y2"
        max={GRID_LINE_LIMITS.lineY2.max}
        min={GRID_LINE_LIMITS.lineY2.min}
        step={1}
        suffix="%"
        value={frame.lineY2}
        onChange={(value) => onChangeFrame({ ...frame, lineY2: value })}
      />
      <div className="field field-control seed-control">
        <FieldCaption>随机种子</FieldCaption>
        <div className="seed-value-row">
          <strong>{frame.seed}</strong>
          <LocalizedDiceButton label="重掷随机种子" onClick={() => onChangeSeed(Math.floor(Math.random() * 100000))} />
        </div>
      </div>
      <RangeControl
        label="标题字号"
        max={GRID_LINE_LIMITS.titleSize.max}
        min={GRID_LINE_LIMITS.titleSize.min}
        step={1}
        suffix="px"
        value={frame.titleSize}
        onChange={(titleSize) => onChangeFrame({ ...frame, titleSize })}
      />
      <FontControl value={font} onChange={onChangeFont} />
      <TextAreaControl label="标题（右下格）" maxLength={20} value={title} onChange={onChangeTitle} />
    </>
  );
}
