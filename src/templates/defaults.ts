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
    credit: "光影札记",
    titleColor: "#dd684f",
    fontFamily: "sans"
  }
};

export const starterTemplate = {
  id: "frameforge-signature",
  name: "雾纱",
  family: "refined-blur-frame"
};

