import type { Project } from "../../types";

type SidebarProps = {
  isBusy: boolean;
  recentProjects: Project[];
  activeProjectId?: string;
  templateListOpen: boolean;
  historyOpen: boolean;
  archiveOpen: boolean;
  onUpload: (file?: File) => void;
  onSelectProject: (project: Project) => void;
  onRenameProject: (projectId: string, name: string) => void;
  onToggleTemplateList: () => void;
  onToggleHistory: () => void;
  onToggleArchive: () => void;
  projectsCount: number;
  mediaType?: string;
};

export function Sidebar({
  isBusy,
  recentProjects,
  activeProjectId,
  templateListOpen,
  historyOpen,
  archiveOpen,
  onUpload,
  onSelectProject,
  onRenameProject,
  onToggleTemplateList,
  onToggleHistory,
  onToggleArchive,
  projectsCount,
  mediaType
}: SidebarProps) {
  return (
    <aside className="sidebar workspace-rail">
      <div className="workspace-rail-panel">
        <div className="workspace-rail-scroll">
      <div className="brand">
        <div>
          <h1>FrameForge</h1>
          <p>High resolution frame</p>
        </div>
      </div>

      <label className="upload-button">
        <input
          accept="image/*,video/*"
          disabled={isBusy}
          type="file"
          onChange={(event) => onUpload(event.target.files?.[0])}
        />
        上传素材
      </label>

      <section className={`panel template-panel ${templateListOpen ? "is-expanded" : "is-collapsed"}`}>
        <button className="panel-heading" type="button" onClick={onToggleTemplateList}>
          <span>模板画廊</span>
          <span className="panel-chevron" aria-hidden="true" />
        </button>
        <div className="template-list">
          <button className="template-item is-active" type="button">
            FrameForge Signature
          </button>
          <button className="template-item" type="button">
            Minimalist
          </button>
          <button className="template-item" type="button">
            Glass Card
          </button>
        </div>
      </section>

      <section className={`panel history-panel ${historyOpen ? "is-expanded" : "is-collapsed"}`}>
        <button className="panel-heading" type="button" onClick={onToggleHistory}>
          <span>画册</span>
          <span className="panel-chevron" aria-hidden="true" />
        </button>
        <div className="history-list">
          {recentProjects.length === 0 ? (
            <div className="history-item is-empty">暂无保存作品</div>
          ) : (
            recentProjects.slice(0, 5).map((item) => (
              <div
                className={`history-item${activeProjectId === item.id ? " is-active" : ""}`}
                key={item.id}
              >
                <input
                  aria-label="画册名称"
                  className="history-name-input"
                  defaultValue={item.name}
                  maxLength={32}
                  onBlur={(event) => onRenameProject(item.id, event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.currentTarget.blur();
                    }
                  }}
                />
                <button className="history-open-button" type="button" onClick={() => onSelectProject(item)}>
                  打开
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className={`panel control-panel ${archiveOpen ? "is-expanded" : "is-collapsed"}`}>
        <button className="panel-heading" type="button" onClick={onToggleArchive}>
          <span>Archive</span>
          <span className="panel-chevron" aria-hidden="true" />
        </button>
        <div className="panel-content">
          <Field label="Database" value="IndexedDB" />
          <Field label="Projects" value={`${projectsCount}`} />
          <Field label="Media" value={mediaType ?? "-"} />
        </div>
      </section>
      </div>
      </div>
    </aside>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
