import { useLocale } from "../../i18n/LocaleContext";

type MobileSavePreviewProps = {
  imageUrl: string;
  onClose: () => void;
};

export function MobileSavePreview({ imageUrl, onClose }: MobileSavePreviewProps) {
  const { t } = useLocale();

  return (
    <div className="mobile-save-preview" role="dialog" aria-modal="true" aria-label={t("save.dialog")}>
      <div className="mobile-save-preview-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="mobile-save-preview-sheet">
        <div className="mobile-save-preview-header">
          <p>{t("save.longPress")}</p>
          <button className="mobile-save-preview-close" type="button" onClick={onClose}>
            {t("save.close")}
          </button>
        </div>
        <img alt={t("save.exportAlt")} className="mobile-save-preview-image" src={imageUrl} />
      </div>
    </div>
  );
}
