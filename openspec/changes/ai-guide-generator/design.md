## Context

当前 GuidePage（`/admin/guide`）仅提供目的地搜索 + 地图定位，用户需在 GuideEditor 中手动编写 Markdown 内容。本项目已安装 `ai` v7（Vercel AI SDK）但未配置任何 AI provider。

## Goals / Non-Goals

**Goals:**
- 用户填写旅行参数后一键生成结构化中文攻略
- 使用 DeepSeek API（便宜、中文好、OpenAI 兼容）
- Streaming 响应，用户实时看到生成进度
- 攻略持久化到 Supabase，列表页卡片展示，详情页 Markdown 预览
- 攻略生成参数（目的地、日期、预算、人数、关键词）全部可配置

**Non-Goals:**
- 不支持攻略编辑（只读预览）
- 不生成图片（纯文本 Markdown）
- 不接入多个 AI provider（仅 DeepSeek）
- 不在公开页面展示（仅 admin 后台）

## Decisions

### Decision 1: DeepSeek 通过 `@ai-sdk/openai` 对接

**选择**：安装 `@ai-sdk/openai`，使用 `createOpenAI({ baseURL: 'https://api.deepseek.com/v1', apiKey: ... })` 创建 provider。

**理由**：DeepSeek API 完全兼容 OpenAI 接口格式，Vercel AI SDK 原生支持。无需额外适配层或自定义 provider。

**备选**：直接 fetch DeepSeek API — 拒绝，因为会丢失 AI SDK 的 streaming、tool calling 等内置能力。

### Decision 2: 攻略数据独立 `ai_guides` 表

**选择**：新建 `ai_guides` 表，不复用 `trips` 表。

**理由**：
- 字段结构不同（budget、traveler_count、keywords 等 AI 专属字段）
- AI 攻略 ≠ 真实旅行记录，生命周期和管理方式不同
- 独立表便于后续扩展（评分、重新生成、分享等）

### Decision 3: 攻略内容固定 7 模块模板

**选择**：System prompt 约束 AI 按以下结构输出：

```
## 行程概览
## 每日行程（Day 1 ~ Day N）
## 美食推荐
## 住宿建议
## 交通指南
## 预算分配
## 实用贴士
```

**理由**：固定结构保证生成质量一致，便于预览页按模块渲染。天数由 `end_date - start_date` 自动计算。

### Decision 4: GuidePage 表单集成而非独立页面

**选择**：在现有 GuidePage 左侧面板中追加表单字段（日期、预算、人数、关键词），而非创建独立的表单页面。

**理由**：
- GuidePage 已有目的地搜索 + 地图，是自然的起点
- 用户边看地图边填参数，体验连贯
- 避免页面跳转打断流程

### Decision 5: Server Component 列表页 + Client Component 生成表单

**选择**：
- `/admin/guide` — Client Component（已有，增强表单）
- `/admin/guide/generated` — Server Component，服务端查询 `ai_guides` 表
- `/admin/guide/generated/[id]` — Server Component，服务端查询单条记录 + Markdown 渲染

**理由**：列表页和预览页无需客户端交互（只是查询+展示），用 Server Component 性能更好。生成表单需要 streaming + 状态管理，保持 Client Component。

## Risks / Trade-offs

- **[低] DeepSeek API 不稳定** → AI SDK 内置 retry 机制；API route 有 try-catch 兜底，失败时返回友好错误
- **[低] 生成内容过长超时** → 使用 streaming 模式，Vercel AI SDK 默认支持；前端做好 loading 状态
- **[低] `DEEPSEEK_API_KEY` 泄露** → API Key 仅用于服务端 API Route，不暴露到浏览器
- **[低] 数据库 migration** → `ai_guides` 表需手动在 Supabase 控制台执行 SQL，记录在 design 中
