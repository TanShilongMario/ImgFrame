import { Copy, FolderOpen, PencilLine, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Project } from "../../types";
import { mediaRepository } from "../../storage/repositories";
import { CardPreview } from "./CardPreview";

type AlbumCardProps = {
  project: Project;
  onOpen: (project: Project) => void;
  onRename: (projectId: string, name: string) => void;
  onDelete: (projectId: string) => void;
  onDuplicate: (projectId: string) => void;
};

export function AlbumCard({ project, onOpen, onRename, onDelete, onDuplicate }: AlbumCardProps) {
  const [mediaUrl, setMediaUrl] = useState<string | undefined>();
  const [nameDraft, setNameDraft] = useState(project.name);
  const [isRenaming, setIsRenaming] = useState(false);

  function commitRename() {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameDraft(project.name);
      setIsRenaming(false);
      return;
    }
    onRename(project.id, trimmed);
    setIsRenaming(false);
  }

  useEffect(() => {
    if (!project.mediaAssetId) {
      setMediaUrl(undefined);
      return;
    }

    let url: string | undefined;
    let cancelled = false;

    void mediaRepository.get(project.mediaAssetId).then((asset) => {
      if (cancelled || !asset) {
        return;
      }

      url = URL.createObjectURL(asset.blob);
      setMediaUrl(url);
    });

    return () => {
      cancelled = true;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [project.mediaAssetId]);

  useEffect(() => {
    setNameDraft(project.name);
    setIsRenaming(false);
  }, [project.name]);

  return (
    <article className="gallery-card album-card">
      <div className="album-card-preview-wrap">
        <button className="album-card-preview" type="button" onClick={() => onOpen(project)}>
          <CardPreview
            mediaUrl={mediaUrl}
            params={project.templateParams}
            templateId={project.templateId}
            variant="gallery"
          />
        </button>

        <div className={`album-card-overlay${isRenaming ? " is-renaming" : ""}`}>
          <div className="album-card-overlay-bottom">
            {isRenaming ? (
              <input
                aria-label="画册名称"
                autoFocus
                className="album-card-name-input"
                maxLength={32}
                value={nameDraft}
                onBlur={commitRename}
                onChange={(event) => setNameDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                  if (event.key === "Escape") {
                    setNameDraft(project.name);
                    setIsRenaming(false);
                  }
                }}
              />
            ) : (
              <span className="album-card-title-text" title={project.name}>{project.name}</span>
            )}

            <div className="album-card-actions">
              <button
                aria-label="重命名"
                className="album-card-icon-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRenaming(true);
                }}
              >
                <PencilLine size={15} strokeWidth={2.1} />
              </button>
              <button
                aria-label="打开项目"
                className="album-card-icon-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen(project);
                }}
              >
                <FolderOpen size={15} strokeWidth={2.1} />
              </button>
              <button
                aria-label="新建副本"
                className="album-card-icon-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(project.id);
                }}
              >
                <Copy size={15} strokeWidth={2.1} />
              </button>
              <button
                aria-label="删除项目"
                className="album-card-icon-btn is-danger"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project.id);
                }}
              >
                <Trash2 size={15} strokeWidth={2.1} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
