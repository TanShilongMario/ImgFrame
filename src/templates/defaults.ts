import type { TemplateParams } from "../types";

export const defaultTemplateParams: TemplateParams = {
  canvas: {
    ratio: "4:5",
    background: "#e9e7e2",
    padding: 64
  },
  media: {
    radius: 28,
    borderWidth: 8,
    borderColor: "#ffffff",
    shadow: {
      blur: 30,
      offsetX: 0,
      offsetY: 16,
      opacity: 0.18
    },
    crop: {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0
    }
  },
  text: {
    title: "高级展示卡片",
    subtitle: "上传素材后自动生成",
    credit: "Made with ImgVideoFrame",
    titleColor: "#dd684f"
  }
};

export const starterTemplate = {
  id: "minimal-poster-card",
  name: "极简海报卡",
  family: "minimal-card"
};

