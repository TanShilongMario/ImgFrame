import { Image as ImageIcon } from "lucide-react";
import { templateRegistry } from "../../templates/registry";

/**
 * 新增模板族时：在 buildMobileInspectorTabs.tsx 增加 buildXMobileTabs，
 * 并在 MobileInspectorPanel.tsx 增加对应分支（桌面端仍用 *FrameControls）。
 */

type MobileTemplateRailProps = {
  activeTemplateId?: string;
  onSelectTemplate: (templateId: string) => void;
};

export function MobileTemplateRail({ activeTemplateId, onSelectTemplate }: MobileTemplateRailProps) {
  return (
    <div className="mobile-template-rail" role="listbox" aria-label="模板">
      {templateRegistry.map((template) => {
        const imageOnly = template.supportsVideo === false;

        return (
          <button
            key={template.id}
            aria-selected={activeTemplateId === template.id}
            className={`mobile-template-chip${activeTemplateId === template.id ? " is-active" : ""}`}
            role="option"
            title={imageOnly ? `${template.name}（建议使用图片）` : template.name}
            type="button"
            onClick={() => onSelectTemplate(template.id)}
          >
            <span>{template.name}</span>
            {imageOnly ? (
              <ImageIcon aria-hidden="true" className="mobile-template-chip-badge" size={12} strokeWidth={2.2} />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
