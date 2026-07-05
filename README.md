# ImgFrame / FrameForge

面向图片与视频素材的高质感展示卡片生成工具。上传一张图或一段视频，选模板、调参数，导出可直接发布的封面、展示图或包装视频。

> 上传素材，自动生成高级展示卡片。

仓库地址：[github.com/TanShilongMario/ImgFrame](https://github.com/TanShilongMario/ImgFrame)

## 功能概览

- **首页 Hero**：支持图片 / 视频上传（视频取首帧预览），拖拽即开；上传仪式为波点呼吸动画
- **Magic Frame**：每次完成仪式后随机进入一款模板，并根据素材比例与亮度自动调参
- **编辑器**：暗色三栏布局（模板列表 · 舞台预览 · 参数面板）
- **模板画廊 / 画册**：浏览示例与本地保存的项目
- **2K 导出**：Canvas 渲染 PNG / JPEG；视频素材可导出带框 MP4（浏览器端 ffmpeg.wasm 转码）
- **系统配色**：题序、空璃、沉璃等模板支持预设色 + 基于素材色调的自动取色（视频取首帧）
- **本地持久化**：IndexedDB 保存项目、素材与偏好

## 内置模板

| 名称 | ID | 说明 |
|------|-----|------|
| 雾纱 | `frameforge-signature` | 背景模糊 + 居中画幅 + 底部渐变署名 |
| 格叙 | `grid-editorial` | 九宫格编辑线 + 单元格明暗 + 右下标题 |
| 空璃 | `glass-plate` | 圆角磨砂玻璃 + 内窗清晰图 + 标题副标题 |
| 沉璃 | `glass-sill` | 深色底 + 厚底边玻璃 + 焦散光 + 底边单行文字 |
| 题序 | `caption-band` | 圆角图像 + 底部腰封文字 + 衬底色块 |

各模板支持画布比例（含随原图 / 视频）、字体（黑体 / 衬线 / 宋体 / 楷体 / 毛笔 / 手写）及模板专属参数。

## 技术栈

- [Vite](https://vite.dev/) 7 + [React](https://react.dev/) 19 + TypeScript
- 原生 Canvas 2D 导出（无服务端）
- [ffmpeg.wasm](https://ffmpegwasm.netlify.app/) 浏览器端 MP4 转码
- 原生 IndexedDB（`projects` / `mediaAssets` / `history` / `settings`）

## 本地开发

```bash
# 安装依赖
npm install

# 开发（默认 http://127.0.0.1:5173）
npm run dev

# 类型检查
npm run typecheck

# 生产构建
npm run build

# 预览构建产物
npm run preview
```

## 项目结构（简要）

```
src/
├── export/          # Canvas 渲染、PNG/JPEG/MP4 导出
├── templates/       # 模板注册、参数 clamp、随机化
├── ui/              # 页面与编辑器组件
├── media/           # 素材元数据、视频首帧、Magic Mode 分析
├── preview/         # 舞台预览尺寸计算
├── project/         # 项目创建、切换模板、归一化
├── gallery/         # 画廊批次生成
└── storage/         # IndexedDB 封装
```

## 文档

- [产品需求文档](./docs/PRD.md)
- [技术架构文档](./docs/Architecture.md)

## 许可证

Private / 个人项目。使用前请自行确认素材与字体授权。
