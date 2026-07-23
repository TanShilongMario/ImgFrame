import type { StampFrameConfig } from "../../types";
import type { TextFontId } from "../../templates/fonts";
import { STAMP_FRAME_LIMITS } from "../../templates/stampFrame";
import {
  FieldCaption,
  FontControl,
  LocalizedDiceButton,
  RangeControl,
  RatioControl,
  TextAreaControl
} from "./controls";

export function StampFrameControls({
  frame,
  title,
  date,
  postmark,
  font,
  onChangeFrame,
  onChangeSeed,
  onChangeText,
  onChangeFont
}: {
  frame: StampFrameConfig;
  title: string;
  date: string;
  postmark: string;
  font: TextFontId;
  onChangeFrame: (frame: StampFrameConfig) => void;
  onChangeSeed: (seed: number) => void;
  onChangeText: (field: "title" | "subtitle" | "credit", value: string) => void;
  onChangeFont: (font: TextFontId) => void;
}) {
  return (
    <>
      <RatioControl value={frame.canvasRatio} onChange={(canvasRatio) => onChangeFrame({ ...frame, canvasRatio })} />
      <RangeControl label="邮票大小" min={STAMP_FRAME_LIMITS.stampSize.min} max={STAMP_FRAME_LIMITS.stampSize.max} step={1} suffix="%" value={frame.stampSize} onChange={(stampSize) => onChangeFrame({ ...frame, stampSize })} />
      <RangeControl label="图像留白" min={STAMP_FRAME_LIMITS.stampPadding.min} max={STAMP_FRAME_LIMITS.stampPadding.max} step={0.5} suffix="%" value={frame.stampPadding} onChange={(stampPadding) => onChangeFrame({ ...frame, stampPadding })} />
      <RangeControl label="齿孔大小" min={STAMP_FRAME_LIMITS.perforationSize.min} max={STAMP_FRAME_LIMITS.perforationSize.max} step={1} suffix="px" value={frame.perforationSize} onChange={(perforationSize) => onChangeFrame({ ...frame, perforationSize })} />
      <RangeControl label="文字字号" min={STAMP_FRAME_LIMITS.captionSize.min} max={STAMP_FRAME_LIMITS.captionSize.max} step={1} suffix="px" value={frame.captionSize} onChange={(captionSize) => onChangeFrame({ ...frame, captionSize })} />
      <FontControl value={font} onChange={onChangeFont} />
      <TextAreaControl label="底部文字" maxLength={48} value={title} onChange={(value) => onChangeText("title", value)} />
      <TextAreaControl label="日期时间" maxLength={32} value={date} onChange={(value) => onChangeText("subtitle", value)} />
      <TextAreaControl label="邮戳文字（支持换行）" maxLength={64} value={postmark} onChange={(value) => onChangeText("credit", value)} />
      <div className="field field-control seed-control">
        <FieldCaption>随机角度</FieldCaption>
        <div className="seed-value-row">
          <strong>{frame.seed}</strong>
          <LocalizedDiceButton label="重掷邮票角度" onClick={() => onChangeSeed(Math.floor(Math.random() * 100000))} />
        </div>
      </div>
    </>
  );
}
