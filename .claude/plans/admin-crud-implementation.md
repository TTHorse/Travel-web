# Admin CRUD & 图片上传功能实现计划

## 一、现状分析

| 已有 | 缺失 |
|------|------|
| ✅ 管理后台首页 `/admin` + 登录 `/admin/login` | ❌ `/admin/trips` 行程列表管理 |
| ✅ `proxy.ts` 中间件拦截 `/admin` 路由做认证 | ❌ `/admin/trips/new` 新建行程 |
| ✅ Trip 类型定义完整 | ❌ `/admin/trips/[id]/edit` 编辑行程 |
| ✅ Supabase 服务端/客户端已封装 | ❌ 创建/编辑/删除 API（trips 仅 GET） |
| ✅ `next-cloudinary` 依赖已安装 | ❌ Cloudinary 图片上传组件 |
| ✅ UI 组件 Button / Modal / Skeleton | ❌ 照片 / 地图标记点管理 |

## 二、新增文件清单

```
src/
├── app/admin/
│   ├── layout.tsx                    # [新增] admin 共享布局：认证检查 + 侧边导航
│   └── trips/
│       ├── page.tsx                  # [新增] 行程列表管理页
│       ├── new/page.tsx              # [新增] 新建行程页
│       └── [id]/edit/page.tsx        # [新增] 编辑行程页
├── components/admin/
│   ├── TripForm.tsx                  # [新增] 行程表单（公共组件）
│   ├── TripList.tsx                  # [新增] 行程列表（客户端交互：删除确认）
│   ├── MapPointsEditor.tsx           # [新增] 地图标记点编辑器
│   └── CloudinaryUpload.tsx          # [新增] Cloudinary 图片上传组件
└── app/api/trips/
    └── route.ts                      # [修改] 新增 POST / PUT / DELETE
```

## 三、文件详细设计

### 3.1 Admin 布局 `admin/layout.tsx`
- **类型**：服务端组件
- **功能**：
  - 从 Supabase 获取当前用户
  - 未登录 → 重定向 `/admin/login`
  - 已登录 → 渲染侧边导航栏 + 内容区域
- **导航项**：后台首页、行程管理、新建行程、图库、地图

### 3.2 行程列表 `admin/trips/page.tsx`
- **类型**：服务端组件包裹客户端交互
- **功能**：
  - 从 Supabase 拉取全部 trips（含草稿）
  - 表格展示：标题、目的地、状态（已发布/草稿）、日期、操作
  - 操作按钮：编辑（跳转）、删除（弹窗确认）

### 3.3 行程表单 `components/admin/TripForm.tsx`
- **类型**：客户端组件（`"use client"`）
- **Props**：`{ initialData?: Trip; isEdit: boolean }`
- **表单字段**：
  - `title` — 文本输入（必填）
  - `slug` — 文本输入（必填，从 title 自动生成拼音或英文，可手动改）
  - `destination` — 文本输入（必填）
  - `country` — 文本输入（必填）
  - `cover_image` — **CloudinaryUpload 组件** + 手动 URL 输入框
  - `description` — 文本域
  - `content` — 文本域（Markdown，大输入框）
  - `start_date` / `end_date` — 日期选择器
  - `tags` — 逗号分隔文本输入
  - `is_published` — 切换开关
  - `map_points` — **MapPointsEditor 组件**（内嵌列表编辑器）
- **提交逻辑**：
  - 新建 → `POST /api/trips`
  - 编辑 → `PUT /api/trips`
  - 成功后跳转回 `/admin/trips`

### 3.4 新建行程 `admin/trips/new/page.tsx`
- **类型**：服务端组件
- **内容**：包裹 `<TripForm isEdit={false} />`

### 3.5 编辑行程 `admin/trips/[id]/edit/page.tsx`
- **类型**：服务端组件
- **内容**：
  - 从 Supabase 根据 id 获取 trip 数据
  - 包裹 `<TripForm initialData={trip} isEdit={true} />`
  - 如果找不到 trip → notFound()

### 3.6 行程列表组件 `TripList.tsx`
- **类型**：客户端组件
- **功能**：
  - 接收 trips 数组渲染表格
  - 删除按钮 → Modal 确认 → 调用 DELETE API → 刷新
  - 编辑按钮 → `router.push('/admin/trips/${id}/edit')`

### 3.7 Cloudinary 上传 `CloudinaryUpload.tsx`
- **类型**：客户端组件
- **依赖**：`next-cloudinary` 的 `CldUploadWidget`
- **功能**：
  - 点击按钮 → 弹出 Cloudinary 上传弹窗
  - 上传成功后回调返回 secure_url
  - 显示已上传图片预览
- **Props**：`{ value: string; onChange: (url: string) => void }`

### 3.8 地图标记编辑器 `MapPointsEditor.tsx`
- **类型**：客户端组件
- **功能**：
  - 标记点列表（name, latitude, longitude, type）
  - 添加/删除行
  - type 下拉选择：visited / highlight / wishlist
- **Props**：`{ value: MapPoint[]; onChange: (points: MapPoint[]) => void }`

### 3.9 API 路由扩展 `api/trips/route.ts`
- **GET**（已有）→ 保持不变
- **POST**（新增）→ 创建行程，需认证
- **PUT**（新增）→ 接收 `{ id, ...fields }` 更新行程，需认证
- **DELETE**（新增）→ 接收 `{ id }` 删除行程及相关联数据，需认证

## 四、技术要点

1. **认证**：API 的 POST/PUT/DELETE 使用 `createServerSupabase()` → `getUser()` 验证身份
2. **slug 生成**：前端根据 title 简单转换（小写 + 空格换横线 + 去特殊字符），允许手动修改
3. **Cloudinary**：使用 unsigned upload preset，上传成功后拿到 public_id 和 secure_url 存到 photos 表
4. **删除级联**：数据库已设置 `ON DELETE CASCADE`，删除 trip 时 photos/comments/map_points 自动清理
5. **样式**：沿用项目暗色主题（`bg-white/5 border border-white/10` 等），表单控件复用登录页风格
6. **中间件已有**：`src/proxy.ts` 已配置 `/admin/:path*` 的认证拦截，新增路由自动受保护

## 五、执行顺序

1. 创建 `CloudinaryUpload.tsx` — 上传组件（基础依赖）
2. 创建 `MapPointsEditor.tsx` — 标记点编辑器
3. 创建 `TripForm.tsx` — 表单主组件（依赖 1、2）
4. 创建 `TripList.tsx` — 列表客户端组件
5. 扩展 `api/trips/route.ts` — POST/PUT/DELETE
6. 创建 `admin/layout.tsx` — 认证布局
7. 创建 `admin/trips/page.tsx` — 列表页
8. 创建 `admin/trips/new/page.tsx` — 新建页
9. 创建 `admin/trips/[id]/edit/page.tsx` — 编辑页
