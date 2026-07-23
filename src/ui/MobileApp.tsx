import { useEffect } from "react";
import { useAppTheme } from "../hooks/useAppTheme";
import { useWorkspaceState } from "../hooks/useWorkspaceState";
import { useLocale } from "../i18n/LocaleContext";
import { translateStatus } from "../i18n/translateStatus";
import { EditorSection } from "./EditorSection";
import { LanguageToggle } from "./components/LanguageToggle";
import { MobileSavePreview } from "./components/MobileSavePreview";

export function MobileApp() {
  useAppTheme();
  const { locale, templateName } = useLocale();
  const workspace = useWorkspaceState({ imagesOnly: true });

  useEffect(() => {
    document.documentElement.dataset.layout = "mobile";
    return () => {
      delete document.documentElement.dataset.layout;
    };
  }, []);

  return (
    <div className="mobile-app">
      <LanguageToggle variant="mobile" />

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
        {translateStatus(workspace.status, locale, templateName)}
      </div>

      {workspace.savePreviewUrl ? (
        <MobileSavePreview imageUrl={workspace.savePreviewUrl} onClose={workspace.dismissSavePreview} />
      ) : null}
    </div>
  );
}
