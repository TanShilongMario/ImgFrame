import { captureVideoFirstFrameUrl } from "./videoPoster";

export type ImageAnalysis = {
  width: number;
  height: number;
  aspectRatio: number;
  averageBrightness: number;
};

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("无法分析图片。"));
    image.src = url;
  });
}

export async function analyzeImageUrl(url: string): Promise<ImageAnalysis> {
  const image = await loadImage(url);
  const width = image.naturalWidth;
  const height = image.naturalHeight;

  const canvas = document.createElement("canvas");
  const sampleSize = 64;
  canvas.width = sampleSize;
  canvas.height = sampleSize;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("无法分析图片。");
  }

  context.drawImage(image, 0, 0, sampleSize, sampleSize);
  const pixels = context.getImageData(0, 0, sampleSize, sampleSize).data;

  let brightnessTotal = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index] / 255;
    const green = pixels[index + 1] / 255;
    const blue = pixels[index + 2] / 255;
    brightnessTotal += red * 0.2126 + green * 0.7152 + blue * 0.0722;
  }

  return {
    width,
    height,
    aspectRatio: width / height,
    averageBrightness: brightnessTotal / (pixels.length / 4)
  };
}

export async function analyzeImageFile(file: File): Promise<ImageAnalysis> {
  if (file.type.startsWith("video/")) {
    const posterUrl = await captureVideoFirstFrameUrl(file);

    try {
      return await analyzeImageUrl(posterUrl);
    } finally {
      URL.revokeObjectURL(posterUrl);
    }
  }

  const url = URL.createObjectURL(file);

  try {
    return await analyzeImageUrl(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}
