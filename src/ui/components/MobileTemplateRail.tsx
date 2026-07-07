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
      {templateRegistry.map((template) => (
        <button
          key={template.id}
          aria-selected={activeTemplateId === template.id}
          className={`mobile-template-chip${activeTemplateId === template.id ? " is-active" : ""}`}
          role="option"
          type="button"
          onClick={() => onSelectTemplate(template.id)}
        >
          {template.name}
        </button>
      ))}
    </div>
  );
}
