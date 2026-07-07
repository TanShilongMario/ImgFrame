import { useEffect } from "react";
import { useAppTheme } from "../hooks/useAppTheme";
import { useWorkspaceState } from "../hooks/useWorkspaceState";
import { EditorSection } from "./EditorSection";

export function MobileApp() {
  useAppTheme();
  const workspace = useWorkspaceState({ imagesOnly: true });

  useEffect(() => {
    document.documentElement.dataset.layout = "mobile";
    return () => {
      delete document.documentElement.dataset.layout;
    };
  }, []);

  return (
    <div className="mobile-app">
      <EditorSection
        imagesOnly
        isBusy={workspace.isBusy}
        mediaAsset={workspace.mediaAsset}
        mediaUrl={workspace.mediaUrl}
        project={workspace.project}
        variant="mobile"
        onDownloadResult={() => void workspace.handleDownloadResult()}
        onMagicFrame={(file, options) => void workspace.handleMagicFrame(file, options)}
        onShuffleParams={workspace.handleShuffleParams}
        onSelectTemplate={workspace.handleSelectTemplate}
        onUpdateTemplateParams={workspace.handleUpdateTemplateParams}
        onUpload={(file) => void workspace.handleUpload(file)}
      />

      <div aria-live="polite" className={`app-toast${workspace.toastVisible ? " is-visible" : ""}`} role="status">
        {workspace.status}
      </div>
    </div>
  );
}
