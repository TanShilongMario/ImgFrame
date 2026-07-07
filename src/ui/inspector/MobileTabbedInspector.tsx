import { useEffect, useState, type ReactNode } from "react";

export type MobileInspectorTab = {
  id: string;
  label: string;
  content: ReactNode;
};

type MobileTabbedInspectorProps = {
  tabs: MobileInspectorTab[];
};

export function MobileTabbedInspector({ tabs }: MobileTabbedInspectorProps) {
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? "");

  useEffect(() => {
    if (!tabs.length) {
      setActiveTabId("");
      return;
    }

    if (!tabs.some((tab) => tab.id === activeTabId)) {
      setActiveTabId(tabs[0].id);
    }
  }, [activeTabId, tabs]);

  if (!tabs.length) {
    return null;
  }

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

  return (
    <div className="mobile-tabbed-inspector">
      <div className="mobile-inspector-tabs" role="tablist" aria-label="参数分类">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            aria-selected={tab.id === activeTab.id}
            className={`mobile-inspector-tab${tab.id === activeTab.id ? " is-active" : ""}`}
            role="tab"
            type="button"
            onClick={() => setActiveTabId(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mobile-param-pane" role="tabpanel">
        {activeTab.content}
      </div>
    </div>
  );
}
