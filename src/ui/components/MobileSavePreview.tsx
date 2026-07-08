type MobileSavePreviewProps = {
  imageUrl: string;
  onClose: () => void;
};

export function MobileSavePreview({ imageUrl, onClose }: MobileSavePreviewProps) {
  return (
    <div className="mobile-save-preview" role="dialog" aria-modal="true" aria-label="保存结果图">
      <div className="mobile-save-preview-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="mobile-save-preview-sheet">
        <div className="mobile-save-preview-header">
          <p>长按图片保存到相册</p>
          <button className="mobile-save-preview-close" type="button" onClick={onClose}>
            关闭
          </button>
        </div>
        <img alt="导出结果" className="mobile-save-preview-image" src={imageUrl} />
      </div>
    </div>
  );
}
