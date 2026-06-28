# FrameForge 技术架构文档

## 1. 架构目标

FrameForge 的技术架构需要服务三个核心目标：

1. 快速生成高质量预览。
2. 稳定导出高清图片和视频。
3. 支持模板参数化和后续模板生态扩展。

产品不是复杂设计工具，因此架构应保持克制。前期优先完成图片生成闭环，后续再扩展视频渲染、AI 推荐和模板制作器。

## 2. 总体架构

推荐采用前后端分离架构。

```text
用户界面
  |
  | 上传素材、调整参数、预览
  v
前端编辑器
  |
  | 模板 JSON、素材、导出请求
  v
应用后端
  |
  | 图片导出、视频渲染、任务队列、文件存储
  v
渲染服务 / 存储服务 / AI 服务
```

P0 阶段可以先以前端为主，后端只保留扩展接口。进入视频导出后，应引入后端渲染服务。

## 3. 前端架构

### 3.1 推荐技术栈

- React 或 Next.js
- TypeScript
- Canvas / SVG / DOM 混合渲染
- Zustand 或 Jotai 管理编辑状态
- Tailwind CSS 或轻量设计系统

如果第一阶段追求快速原型，可以使用 Vite + React。若后续考虑账户、模板市场、SEO 和服务端能力，建议直接使用 Next.js。

### 3.2 前端模块

```text
src/
  app/
  components/
  editor/
    canvas/
    panels/
    toolbar/
  templates/
    definitions/
    renderer/
    presets/
  media/
    upload/
    crop/
    analysis/
  export/
  store/
  utils/
```

### 3.3 编辑器布局

编辑器采用三段式结构：

- 左侧：模板、历史记录、素材入口
- 中间：画布预览
- 右侧：参数编辑

Magic Mode 可以作为进入编辑器前的独立页面，也可以作为编辑器的初始空状态。

## 4. 模板系统

### 4.1 模板定义

模板应使用 JSON 或 TypeScript 对象描述。模板定义包含：

- 模板元信息
- 适配比例
- 默认参数
- 参数安全范围
- 可暴露给用户的参数
- 图层结构
- 渲染逻辑引用

示例：

```ts
type TemplateDefinition = {
  id: string;
  name: string;
  family: string;
  supportedMedia: Array<"image" | "video">;
  supportedRatios: string[];
  defaults: TemplateParams;
  randomRules: RandomRule[];
  exposedControls: ControlDefinition[];
  render: TemplateRenderer;
};
```

### 4.2 模板参数

模板参数分为三层：

```text
系统参数：模板内部使用，不直接给用户改。
生成参数：Magic Mode 自动选择或随机生成。
用户参数：右侧面板暴露给用户调整。
```

这样可以保持内部能力充足，同时避免用户界面变复杂。

### 4.2.1 模板与参数的关系

FrameForge 的模板系统遵循“模板定义决定结构，模板参数决定表现”的关系。

```text
TemplateDefinition
  ├─ id / name / family：模板身份与模板族
  ├─ baseParams：该模板的默认安全参数
  ├─ exposedControls：右侧面板允许用户调整的参数定义
  ├─ randomRules：随机按钮可修改的参数范围
  └─ renderer：该模板族对应的渲染组件或渲染分支

Project
  ├─ templateId：当前使用哪个模板定义
  └─ templateParams：当前项目保存的一份参数快照
```

后续新增模板时，不应把所有模板都塞进同一个巨型预览组件。推荐按模板族扩展：

1. 在 `templateRegistry` 增加一个 `TemplateDefinition`，声明模板 id、名称、family 和 `baseParams`。
2. 如果是新结构模板，给它新增专属参数段，例如 `refinedFrame`；通用参数仍放在 `canvas`、`media`、`text`。
3. 在随机规则里只随机该模板允许变化的参数，避免生成破坏设计的组合。
4. 在右侧参数面板只暴露 `exposedControls` 对应的用户参数，内部参数保持不可见。
5. 在预览层按 `family` 分发到对应 renderer，模板变体优先通过参数变化实现，而不是复制大量相似模板。

当前 `FrameForge Signature` 的参数语义：

```text
画布比例：不使用固定的 canvas.ratio，而是从原图的实际宽高比动态计算，确保出图比例与原图一致。
cropWidth: 0-50，表示横向裁掉的总百分比；0 = 不裁剪、撑满，33 = 中间图显示 67% 宽。
cropHeight: 0-50，表示纵向裁掉的总百分比；0 = 上下贴满，20 = 上下各裁 10%。
backgroundBlur: 背景层高斯模糊强度。
gradientTone: 渐变为 white 或 black，并联动底部文字颜色。
text.credit: 模板底部文字内容，受字符数限制。
```

### 4.3 图层模型

建议采用固定图层类型，而不是自由图形编辑器。

基础图层：

- canvasBackground
- media
- border
- shadow
- overlay
- glass
- blur
- text
- watermark
- decoration

每个模板由这些受控图层组合而成。

### 4.4 模板族

模板族用于管理相同结构下的多个变体。

例如“极简白边卡片”模板族可以包含：

- 顶部留白版
- 底部标题版
- 居中卡片版
- 大边距版
- 强阴影版

这些不是完全独立模板，而是同一模板族的预设参数。

## 5. Magic Mode 生成逻辑

### 5.1 P0 规则生成

P0 不依赖 AI，使用规则系统完成自动生成。

输入：

- 图片尺寸
- 图片比例
- 主色调
- 平均亮度
- 饱和度
- 简单复杂度

输出：

- 模板族
- 具体预设
- 背景色
- 标题色
- 边框参数
- 圆角参数
- 阴影参数

流程：

```text
读取素材
  -> 分析尺寸与色彩
  -> 过滤适配模板
  -> 根据规则打分
  -> 选择模板族
  -> 选择预设
  -> 在安全范围内扰动参数
  -> 生成画布状态
```

### 5.2 图片分析

P0 可在前端完成基础分析：

- 使用 Canvas 采样缩略图
- 计算主色或调色板
- 计算平均亮度
- 计算平均饱和度
- 判断横图、竖图、方图

复杂识别留到 P2。

### 5.3 P2 AI 推荐

AI 推荐只负责选择，不负责生成自由设计。

可识别：

- 图片类型：人像、建筑、风景、产品、插画、截图
- 视觉情绪：安静、科技、复古、明亮、暗调、可爱
- 适合模板族
- 标题建议
- 裁剪焦点

## 6. 渲染方案

### 6.1 预览渲染

前端预览需要足够快。推荐采用：

- DOM 负责界面
- Canvas 或 SVG 负责画布主体
- CSS 负责编辑器 UI

P0 阶段可以使用 DOM + CSS 先实现模板预览，再逐步统一到 Canvas 渲染，以保证导出一致性。

### 6.2 图片导出

图片导出推荐前端完成：

1. 根据模板状态创建离屏画布。
2. 按目标分辨率绘制所有图层。
3. 加载字体与图片资源。
4. 绘制背景、媒体、边框、阴影、文字等。
5. 导出 PNG 或 JPG。

关键要求：

- 支持 2x、4x。
- 圆角裁剪必须清晰。
- 阴影不能被截断。
- 文字渲染要稳定。
- 导出结果应与预览尽量一致。

### 6.3 视频预览

视频预览可以由前端完成：

- video 元素播放用户视频。
- 模板层叠加在视频外。
- 用户调整参数时实时更新模板层。

P1 阶段不需要前端逐帧合成视频。

### 6.4 视频导出

视频导出建议放到后端。

候选方案：

- FFmpeg：适合稳定合成、转码和导出。
- Remotion：适合 React 化模板和复杂画布动画。
- Headless Chromium + FFmpeg：适合复用前端渲染逻辑。

推荐路线：

```text
P1：FFmpeg 合成简单模板层。
P2：评估 Remotion 或 Headless Chromium，统一图片与视频模板渲染逻辑。
```

视频导出流程：

```text
用户提交导出
  -> 后端创建任务
  -> 下载或读取素材
  -> 根据模板参数生成渲染配置
  -> 合成视频
  -> 上传结果
  -> 返回下载链接
```

## 7. 数据模型

### 7.1 Project

```ts
type Project = {
  id: string;
  name: string;
  media: MediaAsset;
  templateId: string;
  templateParams: TemplateParams;
  canvas: CanvasConfig;
  createdAt: string;
  updatedAt: string;
};
```

### 7.2 MediaAsset

```ts
type MediaAsset = {
  id: string;
  type: "image" | "video";
  url: string;
  width: number;
  height: number;
  duration?: number;
  crop: CropConfig;
};
```

### 7.3 TemplateParams

```ts
type TemplateParams = {
  canvas: {
    ratio: string;
    background: string;
    padding: number;
  };
  media: {
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
    borderWidth: number;
    borderColor: string;
    shadow: ShadowConfig;
  };
  text?: Record<string, TextLayerConfig>;
  overlay?: Record<string, OverlayConfig>;
};
```

## 8. 后端架构

### 8.1 P0 后端

P0 可以非常轻：

- 用户账户可暂缓
- 项目保存可先用本地存储
- 图片导出可前端完成
- 模板定义可静态打包

### 8.2 P1/P2 后端

后续需要：

- 用户系统
- 素材上传
- 项目保存
- 视频渲染任务
- 导出记录
- 参数分享
- 模板管理
- 支付订阅

推荐服务模块：

```text
API Service
Render Worker
Storage Service
Template Service
Auth Service
Billing Service
AI Recommend Service
```

## 9. 存储设计

### 9.1 本地阶段

- 模板：代码仓库静态文件
- 项目：浏览器 localStorage 或 IndexedDB
- 素材：浏览器临时对象 URL

### 9.2 云端阶段

- 素材文件：对象存储
- 导出文件：对象存储
- 项目数据：数据库
- 模板定义：数据库或版本化 JSON
- 渲染任务：队列系统

## 10. 导出质量策略

### 10.1 图片

- 使用原图作为绘制源。
- 按目标尺寸重新绘制。
- 不压缩 PNG。
- JPG 提供质量参数。
- 避免用屏幕截图方式导出最终文件。

### 10.2 视频

- 保留原视频帧率或合理转换。
- 默认使用高质量编码参数。
- 避免重复压缩多次。
- 根据模板目标尺寸决定输出分辨率。
- 对长视频设置时长限制和任务队列。

## 11. 模板制作策略

第一阶段不做模板制作器。

推荐流程：

1. 设计师在 Figma 中制作模板。
2. 从 Figma 稿中拆解结构和参数。
3. 工程侧手写模板定义。
4. 重复 10-20 个模板后抽象公共能力。
5. 再建设内部模板制作器。

内部模板制作器应晚于模板 Schema 稳定后再做。

## 12. 风险与对策

### 12.1 预览与导出不一致

对策：

- 尽早统一渲染逻辑。
- 导出前使用同一套模板参数。
- 对关键模板做截图对比测试。

### 12.2 模板随机效果不稳定

对策：

- 随机范围必须由设计师预设。
- 优先随机预设，不随机任意值。
- 保留模板适配评分。

### 12.3 视频导出成本高

对策：

- P0 先不做视频导出。
- P1 限制视频时长。
- 使用任务队列。
- Pro 版限制额度。

### 12.4 模板数量增长后维护困难

对策：

- 以模板族管理。
- 参数 Schema 版本化。
- 建立模板 QA 流程。
- 后续建设内部模板制作器。

## 13. 推荐开发顺序

1. 项目脚手架
2. 三段式编辑器 UI
3. 图片上传与裁剪
4. 模板定义格式
5. 第一个模板手写实现
6. 图片导出
7. Magic Mode 规则生成
8. 10 个模板扩展
9. 参数面板
10. 历史记录
11. 视频预览
12. 后端视频导出

