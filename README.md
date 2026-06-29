# ImgFrame / FrameForge

面向图片与视频素材的高质感展示卡片生成工具。上传一张图，选模板、调参数，导出可直接发布的封面或展示图。

> 上传素材，自动生成高级展示卡片。

仓库地址：[github.com/TanShilongMario/ImgFrame](https://github.com/TanShilongMario/ImgFrame)

## 功能概览

- **首页 Hero**：拖拽 / 点击上传，即时预览包装效果
- **编辑器**：三栏布局（模板列表 · 舞台预览 · 参数面板）
- **模板画廊 / 画册**：浏览示例与本地保存的项目
- **2K 导出**：Canvas 渲染，预览与下载参数对齐
- **Magic Mode**：根据素材比例与亮度自动调整部分模板参数
- **本地持久化**：IndexedDB 保存项目、素材与偏好

## 内置模板

| 名称 | ID | 说明 |
|------|-----|------|
| 雾纱 | `frameforge-signature` | 背景模糊 + 居中画幅 + 底部渐变署名 |
| 格叙 | `grid-editorial` | 九宫格编辑线 + 单元格明暗 + 右下标题 |
| 空璃 | `glass-plate` | 圆角磨砂底 + 内窗清晰图 + 标题副标题 |
| 题序 | `caption-band` | 圆角图像 + 底部腰封文字 + 衬底色块 |

各模板支持画布比例（含随原图）、字体（黑体 / 衬线 / 宋体 / 楷体 / 毛笔 / 手写）及模板专属参数。题序模板另支持固定配色与基于图像平均色的「系统配色」。

## 技术栈

- [Vite](https://vite.dev/) 7 + [React](https://react.dev/) 19 + TypeScript
- 原生 Canvas 2D 导出（无服务端）
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
├── export/          # Canvas 渲染与 PNG 导出
├── templates/       # 模板注册、参数 clamp、随机化
├── ui/              # 页面与编辑器组件
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
