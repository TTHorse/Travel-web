## Why

当前行程攻略页面只提供目的地搜索和地图定位，用户需要手动编写全部攻略内容。引入 AI 自动生成能力，用户只需选择目的地、填写旅行参数（日期、预算、人数、关键词），即可获得一份结构化的 Markdown 攻略，大幅降低内容创作门槛。

## What Changes

- **新增 AI 攻略生成**：GuidePage 增加旅行参数表单（日期、预算、人数、关键词标签），提交后由 DeepSeek 按固定模板生成结构化 Markdown 攻略
- **新增 `ai_guides` 数据表**：独立存储 AI 生成的攻略，字段涵盖目的地、日期、预算、人数、关键词、生成内容
- **新增攻略列表页**：`/admin/guide/generated`，以卡片形式展示所有已生成攻略
- **新增攻略预览页**：`/admin/guide/generated/[id]`，Markdown 渲染预览（不支持编辑）
- **新增依赖**：`@ai-sdk/openai`（指向 DeepSeek API），环境变量 `DEEPSEEK_API_KEY`

## Capabilities

### New Capabilities
- `ai-guide-generation`: DeepSeek AI 驱动的旅行攻略自动生成，包含 API Route、system prompt 模板、streaming 响应、Supabase 存储
- `ai-guide-browser`: 攻略卡片列表页 + Markdown 预览详情页

### Modified Capabilities
- `data`: 新增 `ai_guides` 表及对应数据访问层 `src/lib/data/ai-guides.ts`
- `external-apis`: 新增 DeepSeek API 集成（通过 `@ai-sdk/openai` 兼容接口）
- `ui`: GuidePage 增强 — 新增旅行参数表单区块（日期、预算、人数、关键词标签选择器）

## Impact

| 影响范围 | 文件 |
|----------|------|
| 新 API | `src/app/api/ai/generate-guide/route.ts` |
| 新页面 | `src/app/admin/guide/generated/page.tsx`、`src/app/admin/guide/generated/[id]/page.tsx` |
| 修改页面 | `src/app/admin/guide/page.tsx` |
| 新组件 | `src/components/admin/GuideGenerateForm.tsx`、`src/components/admin/GuideCard.tsx` |
| 新数据层 | `src/lib/data/ai-guides.ts` |
| 新 AI 层 | `src/lib/ai/guide-generator.ts` |
| 新类型 | `src/types/ai-guide.ts` |
| 新依赖 | `@ai-sdk/openai` |
| 新环境变量 | `DEEPSEEK_API_KEY` |
| 数据库 | Supabase 新增 `ai_guides` 表（需执行 migration SQL） |
