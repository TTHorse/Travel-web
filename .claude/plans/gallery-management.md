# Plan: 控制台新增维护画廊页面

## 概述
在管理后台 `/admin/gallery` 新增画廊管理页面，支持查看所有照片、上传新照片、删除照片。同时更新侧边栏导航和仪表盘入口。

## 涉及文件

### 1. 新建 `src/app/admin/gallery/page.tsx` — 画廊管理页面（服务端 + 客户端组件）

**服务端部分（page.tsx）**：
- 验证用户登录状态，未登录则 redirect 到 `/admin/login`
- 从 Supabase 查询所有 photos，按 `sort_order` 排序
- 同时查询所有 trips（用于下拉选择关联行程）
- 渲染客户端组件 `GalleryManager`

**客户端组件 `GalleryManager`**（同目录下 `gallery-manager.tsx`）：
- **照片网格**：以网格展示所有照片缩略图，每个卡片显示：
  - 缩略图
  - caption（如有）
  - 关联的行程名称（通过 trip_id 关联 trips 表）
  - 删除按钮（带确认）
- **上传区域**：
  - 行程下拉选择（必选，因为 photos 表有 trip_id 外键）
  - CloudinaryUpload 组件上传图片
  - caption 输入框（可选）
  - 提交按钮，调用 API 写入 Supabase
- **加载与空状态**：loading 骨架屏 / 空状态提示
- **错误处理**：上传失败、删除失败的 toast 提示

### 2. 更新 `src/app/api/photos/route.ts` — 新增 POST 和 DELETE

- **POST**：接收 `{ trip_id, url, cloudinary_id, caption, width, height }` 写入 photos 表
- **DELETE**：接收 `{ id }` 删除 photos 记录

### 3. 更新 `src/app/admin/layout.tsx` — 侧边栏导航

在 navItems 中新增 `{ href: "/admin/gallery", label: "画廊管理", icon: Image }`

### 4. 更新 `src/app/admin/page.tsx` — 仪表盘入口

"图片管理" 卡片链接从 `/gallery` 改为 `/admin/gallery`

## 数据流

```
上传：Cloudinary Widget → 获取 secure_url → POST /api/photos (trip_id, url, ...) → Supabase INSERT
删除：确认对话框 → DELETE /api/photos (id) → Supabase DELETE → 刷新列表
列表：page.tsx SSR → Supabase SELECT photos JOIN trips → GalleryManager 渲染
```

## UI 风格
- 沿用 admin 现有风格：暗色背景、白色半透明边框、圆角卡片
- 照片网格 3-4 列，鼠标悬停显示删除按钮
- 上传区域用虚线边框区分，与 CloudinaryUpload 组件风格一致
