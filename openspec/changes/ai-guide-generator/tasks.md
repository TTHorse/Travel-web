## 1. 基础设施

- [x] 1.1 安装 `@ai-sdk/openai` 依赖
- [x] 1.2 环境变量 `DEEPSEEK_API_KEY` 加入 `.env.local`
- [x] 1.3 创建 `src/types/ai-guide.ts` 类型定义（`AIGuide`, `GenerateGuideInput` + Zod schema）
- [ ] 1.4 在 Supabase 控制台执行 migration SQL，创建 `ai_guides` 表

## 2. 数据层 + AI 层

- [x] 2.1 创建 `src/lib/data/ai-guides.ts` — `createAIGuide()`, `getAllGeneratedGuides()`, `getGeneratedGuideById()`
- [x] 2.2 创建 `src/lib/ai/guide-generator.ts` — system prompt 模板 + `generateGuide()` 调用 DeepSeek via AI SDK

## 3. API Route

- [x] 3.1 创建 `src/app/api/ai/generate-guide/route.ts` — POST handler，Zod 校验 → 调用 guide-generator → streaming 响应 → 存储到 Supabase

## 4. GuidePage 表单增强

- [x] 4.1 在 `src/app/admin/guide/page.tsx` 增加参数表单区（日期范围选择、预算输入、人数输入、关键词标签选择器 + 自定义输入）
- [x] 4.2 实现「生成攻略」按钮 + streaming 输出展示（选中目的地后显示表单区，流式渲染 AI 输出）
- [x] 4.3 生成完成后显示「查看攻略列表」链接

## 5. 攻略列表页 + 预览页

- [x] 5.1 创建 `src/app/admin/guide/generated/page.tsx` — Server Component，查询 `ai_guides` 表，卡片网格展示
- [x] 5.2 创建 `src/components/admin/GuideCard.tsx` — 卡片组件（目的地、日期、预算、关键词标签、时间）
- [x] 5.3 创建 `src/app/admin/guide/generated/[id]/page.tsx` — Server Component，查询单条攻略，Markdown 渲染预览

## 6. Verification

- [x] 6.1 `npx tsc --noEmit` — 0 errors
- [x] 6.2 `npm run build` — 编译通过
- [ ] 6.3 手动测试：填写参数 → 点击生成 → 确认 streaming 输出 → 确认存入 Supabase
- [ ] 6.4 手动测试：访问 `/admin/guide/generated` → 确认卡片列表 → 点击卡片 → 确认 Markdown 预览
- [ ] 6.5 手动测试：未选目的地时表单区不显示 → 确认表单流程正确
