import type { Project } from "../types";
import { AlbumCard } from "./components/AlbumCard";

type AlbumSectionProps = {
  projects: Project[];
  onOpenProject: (project: Project) => void;
  onRenameProject: (projectId: string, name: string) => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onNavigate: (section: "hero" | "editor" | "gallery" | "album") => void;
};

export function AlbumSection({
  projects,
  onOpenProject,
  onRenameProject,
  onDeleteProject,
  onDuplicateProject,
  onNavigate
}: AlbumSectionProps) {
  return (
    <div className="album-page">
      <header className="gallery-header">
        <div>
          <p className="gallery-eyebrow">My Frames</p>
          <p className="gallery-lead">
            {projects.length > 0
              ? `${projects.length} 张已保存作品 · 点击打开继续编辑`
              : "在 Design 页面保存作品后，这里会展示你的画册"}
          </p>
        </div>
        <div className="gallery-header-actions">
          <button className="stage-action stage-action-primary nav-action" type="button" onClick={() => onNavigate("editor")}>
            前往设计 ↑
          </button>
        </div>
      </header>

      {projects.length > 0 ? (
        <div className="album-scroll-container">
          <div className="album-grid">
            {projects.map((item) => (
              <AlbumCard
                key={item.id}
                project={item}
                onDelete={onDeleteProject}
                onDuplicate={onDuplicateProject}
                onOpen={onOpenProject}
                onRename={onRenameProject}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="album-empty">
          <p className="album-empty-text">暂无保存作品</p>
          <button className="stage-action stage-action-primary nav-action" type="button" onClick={() => onNavigate("hero")}>
            从首页开始 →
          </button>
        </div>
      )}
    </div>
  );
}
