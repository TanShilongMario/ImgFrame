import { useEffect, useRef, useState } from "react";
import { analyzeImageFile } from "../media/analyzeImage";
import { createMediaAsset } from "../media/metadata";
import {
  createProjectFromMedia,
  normalizeProject,
  replaceProjectMedia,
  shuffleProjectParams,
  switchProjectTemplate
} from "../project/createProject";
import { applyMagicModeParams } from "../project/magicMode";
import { getTemplateById } from "../templates/registry";
import { mediaRepository, projectRepository, settingsRepository } from "../storage/repositories";
import type { MediaAsset, Project, TemplateParams } from "../types";
import { downloadBlob, sanitizeFilename, saveImageBlob } from "../export/canvasUtils";
import { exportProjectGif, shouldExportAsGif } from "../export/exportProjectGif";
import { exportProjectImage } from "../export/exportProjectImage";
import { preloadFfmpeg } from "../export/transcodeToMp4";
import type { HeroUploadOptions } from "../ui/HeroPage";

/** 高频/初始状态不弹 toast，避免拖动滑杆时提示不断闪现 */
const QUIET_STATUSES = new Set(["等待上传素材", "项目已更新，尚未保存", "status.waiting", "status.updated"]);

type UseWorkspaceStateOptions = {
  imagesOnly?: boolean;
};

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export function useWorkspaceState({ imagesOnly = false }: UseWorkspaceStateOptions = {}) {
  const [project, setProject] = useState<Project | null>(null);
  const [mediaAsset, setMediaAsset] = useState<MediaAsset | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState("等待上传素材");
  const [toastVisible, setToastVisible] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [savePreviewUrl, setSavePreviewUrl] = useState<string | undefined>(undefined);
  const autosaveTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (QUIET_STATUSES.has(status)) {
      setToastVisible(false);
      return;
    }

    setToastVisible(true);
    const timer = window.setTimeout(() => setToastVisible(false), 2400);
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    void restoreLastSession();
  }, []);

  useEffect(() => {
    if (!project) {
      return;
    }

    window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => {
      void settingsRepository.saveDefault({
        id: "default",
        lastProject: project,
        preferredRatio: project.templateParams.canvas.ratio,
        updatedAt: new Date().toISOString()
      });
    }, 600);

    return () => window.clearTimeout(autosaveTimerRef.current);
  }, [project]);

  useEffect(() => {
    if (!mediaAsset) {
      setMediaUrl(undefined);
      return;
    }

    const url = URL.createObjectURL(mediaAsset.blob);
    setMediaUrl(url);

    if (!imagesOnly && mediaAsset.type === "video") {
      preloadFfmpeg();
    }

    return () => URL.revokeObjectURL(url);
  }, [imagesOnly, mediaAsset]);

  async function restoreLastSession() {
    const [settings, projects] = await Promise.all([
      settingsRepository.getDefault(),
      projectRepository.list()
    ]);

    void projects;

    if (settings?.lastProject) {
      const restored = normalizeProject(settings.lastProject);
      setProject(restored);

      if (restored.mediaAssetId) {
        const asset = await mediaRepository.get(restored.mediaAssetId);
        if (imagesOnly && asset?.type === "video") {
          setMediaAsset(null);
          setStatus("手机版仅支持图片，请重新上传");
          return;
        }

        setMediaAsset(asset ?? null);
      }

      setStatus("已恢复上次项目");
    }
  }

  function rejectNonImage(file: File): boolean {
    if (!imagesOnly || isImageFile(file)) {
      return false;
    }

    setStatus("手机版仅支持图片");
    return true;
  }

  async function ingestFile(file: File) {
    if (rejectNonImage(file)) {
      return;
    }

    setIsBusy(true);
    setStatus("正在读取素材");

    try {
      const asset = await createMediaAsset(file);
      await mediaRepository.save(asset);

      if (project) {
        setProject(replaceProjectMedia(project, asset));
        setMediaAsset(asset);
        setStatus("已替换素材");
        return;
      }

      const nextProject = createProjectFromMedia(asset);
      setProject(nextProject);
      setMediaAsset(asset);
      setStatus("已创建当前项目");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "素材读取失败");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleMagicFrame(file: File, options: HeroUploadOptions) {
    if (rejectNonImage(file)) {
      return;
    }

    setIsBusy(true);
    setStatus("正在生成展示卡片");

    try {
      const asset = await createMediaAsset(file);
      let templateParams = options.previewParams;
      const analysis = await analyzeImageFile(file);
      templateParams = applyMagicModeParams(templateParams, analysis);

      const nextProject = createProjectFromMedia(asset, {
        templateId: options.templateId,
        templateParams
      });
      await mediaRepository.save(asset);
      setProject(nextProject);
      setMediaAsset(asset);
      setStatus("生成完成");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "素材读取失败");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleUpload(file?: File) {
    if (!file) {
      return;
    }

    await ingestFile(file);
  }

  function updateProject(nextProject: Project) {
    setProject(nextProject);
    setStatus("项目已更新，尚未保存");
  }

  function handleShuffleParams() {
    if (!project) {
      return;
    }

    updateProject(shuffleProjectParams(project));
    setStatus("已在当前模板内随机参数");
  }

  function handleSelectTemplate(templateId: string) {
    if (!project || project.templateId === templateId) {
      return;
    }

    const template = getTemplateById(templateId);
    const nextProject = switchProjectTemplate(project, templateId);
    updateProject(nextProject);
    setStatus(`status.switched|${template.id}`);
  }

  function handleUpdateTemplateParams(params: TemplateParams) {
    if (!project) {
      return;
    }

    updateProject({
      ...project,
      templateParams: params,
      updatedAt: new Date().toISOString()
    });
  }

  useEffect(() => {
    return () => {
      if (savePreviewUrl) {
        URL.revokeObjectURL(savePreviewUrl);
      }
    };
  }, [savePreviewUrl]);

  function dismissSavePreview() {
    setSavePreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return undefined;
    });
  }

  async function handleDownloadResult() {
    if (!project) {
      return;
    }

    if (!mediaAsset || !mediaUrl) {
      setStatus("请先上传素材后再下载");
      return;
    }

    if (imagesOnly && mediaAsset.type === "video") {
      setStatus("手机版仅支持下载图片");
      return;
    }

    setIsBusy(true);

    try {
      if (await shouldExportAsGif(mediaAsset)) {
        setStatus("正在导出 GIF...");

        const result = await exportProjectGif(project, mediaAsset, mediaUrl, {
          onProgress: (progress, label) => {
            if (label) {
              setStatus(label);
              return;
            }

            setStatus(`正在导出 GIF ${Math.round(progress * 100)}%...`);
          }
        });

        const filename = `${sanitizeFilename(project.name)}.gif`;
        const saveResult = await saveImageBlob(result.blob, filename, { preferNativeSave: imagesOnly });

        if (saveResult === "preview") {
          dismissSavePreview();
          setSavePreviewUrl(URL.createObjectURL(result.blob));
          setStatus("长按 GIF 保存到相册");
          return;
        }

        const sizeMb = (result.byteSize / (1024 * 1024)).toFixed(1);
        setStatus(saveResult === "shared" ? `已分享 GIF（${sizeMb}MB）` : `结果 GIF 已保存（${sizeMb}MB）`);
        return;
      }

      setStatus("正在导出结果图...");

      const blob = await exportProjectImage(project, mediaAsset, mediaUrl, { format: "png" });
      const filename = `${sanitizeFilename(project.name)}.png`;
      const result = await saveImageBlob(blob, filename, { preferNativeSave: imagesOnly });

      if (result === "preview") {
        dismissSavePreview();
        setSavePreviewUrl(URL.createObjectURL(blob));
        setStatus("长按图片保存到相册");
        return;
      }

      setStatus(result === "shared" ? "已分享，可选择保存到相册" : "结果图已保存");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("已取消保存");
        return;
      }
      setStatus(error instanceof Error ? error.message : "导出失败");
    } finally {
      setIsBusy(false);
    }
  }

  return {
    project,
    mediaAsset,
    mediaUrl,
    status,
    toastVisible,
    isBusy,
    savePreviewUrl,
    dismissSavePreview,
    handleMagicFrame,
    handleUpload,
    handleShuffleParams,
    handleSelectTemplate,
    handleUpdateTemplateParams,
    handleDownloadResult
  };
}
