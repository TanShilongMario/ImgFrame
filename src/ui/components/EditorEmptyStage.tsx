import { useUploadCardFlow } from "../../hooks/useUploadCardFlow";
import type { HeroUploadOptions } from "../HeroPage";
import { HeroUploadCard } from "./HeroUploadCard";

type EditorEmptyStageProps = {
  isBusy: boolean;
  onMagicFrame: (file: File, options: HeroUploadOptions) => void | Promise<void>;
};

export function EditorEmptyStage({ isBusy, onMagicFrame }: EditorEmptyStageProps) {
  const flow = useUploadCardFlow({ isBusy, onMagicFrame });

  return (
    <div className="stage-empty-upload">
      <HeroUploadCard
        ceremonyLabel={flow.ceremonyLabel}
        ceremonyPhase={flow.ceremonyPhase}
        isBusy={isBusy}
        isDragOver={flow.isDragOver}
        previewUrl={flow.previewUrl}
        variant="inline"
        onDragEnter={flow.handlePanelDragEnter}
        onDragLeave={flow.handlePanelDragLeave}
        onDrop={() => undefined}
        onFileSelect={flow.handleFileSelect}
        onMagicFrame={() => void flow.handleMagicFrame()}
      />
    </div>
  );
}
