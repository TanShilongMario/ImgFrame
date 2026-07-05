export function isUploadableMediaFile(file: File): boolean {
  return file.type.startsWith("image/") || file.type.startsWith("video/");
}

export async function captureVideoFirstFrameUrl(file: File): Promise<string> {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  const objectUrl = URL.createObjectURL(file);

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("无法读取视频帧。"));
      video.src = objectUrl;
    });

    video.currentTime = 0;
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
    });

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("无法读取视频帧。");
    }

    context.drawImage(video, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) {
          resolve(result);
          return;
        }

        reject(new Error("无法读取视频帧。"));
      }, "image/png");
    });

    return URL.createObjectURL(blob);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function createMediaPreviewUrl(file: File): Promise<string> {
  if (file.type.startsWith("video/")) {
    return captureVideoFirstFrameUrl(file);
  }

  return URL.createObjectURL(file);
}
