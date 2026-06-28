export type ImageDot = {
  x: number;
  y: number;
  color: string;
  radius: number;
};

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("无法采样图片色彩。"));
    image.src = url;
  });
}

export async function sampleImageDots(
  url: string,
  columns = 28,
  rows = 36
): Promise<ImageDot[]> {
  const image = await loadImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = columns;
  canvas.height = rows;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("无法采样图片色彩。");
  }

  context.drawImage(image, 0, 0, columns, rows);
  const pixels = context.getImageData(0, 0, columns, rows).data;
  const dots: ImageDot[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = (row * columns + column) * 4;
      const alpha = pixels[index + 3];
      if (alpha < 32) {
        continue;
      }

      dots.push({
        x: (column + 0.5) / columns,
        y: (row + 0.5) / rows,
        color: `rgb(${pixels[index]}, ${pixels[index + 1]}, ${pixels[index + 2]})`,
        radius: 0.011 + ((column + row) % 5) * 0.0012
      });
    }
  }

  return dots;
}
