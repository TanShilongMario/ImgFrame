import type { MediaAsset, MediaType } from "../types";
import { createId } from "../utils/id";

export async function createMediaAsset(file: File): Promise<MediaAsset> {
  const type = getMediaType(file);
  const baseAsset = {
    id: createId("media"),
    type,
    name: file.name,
    mimeType: file.type,
    size: file.size,
    blob: file,
    createdAt: new Date().toISOString()
  };

  if (type === "image") {
    const dimensions = await readImageDimensions(file);
    return { ...baseAsset, ...dimensions };
  }

  const metadata = await readVideoMetadata(file);
  return { ...baseAsset, ...metadata };
}

function getMediaType(file: File): MediaType {
  if (file.type.startsWith("video/")) {
    return "video";
  }

  return "image";
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("无法读取图片尺寸。"));
    };

    image.src = url;
  });
}

function readVideoMetadata(file: File): Promise<{
  width: number;
  height: number;
  duration: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration
      });
      URL.revokeObjectURL(url);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("无法读取视频信息。"));
    };

    video.preload = "metadata";
    video.src = url;
  });
}

