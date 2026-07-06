# Vercel AI SDK 接入方案

> 目标：为个人旅游记录网站接入 AI 能力，利用 Vercel 平台优势，最小化运维成本。

---

## 1. 现状与技术选型

### 1.1 已具备的条件

| 维度 | 现状 |
|------|------|
| **部署平台** | Vercel（免费套餐） |
| **前端框架** | Next.js 16 + React 19.2 |
| **AI SDK** | `ai` v7 已安装（`package.json` 中 `"ai": "^7.0.14"`） |
| **数据库** | Supabase（trip / photos / comments / map_points） |
| **AI 相关代码** | 无（纯空白） |
| **现有 AI 切入点** | `TripForm`（行程创建表单）、`GuideEditor`（行程攻略编辑器） |

### 1.2 待安装依赖

```bash
npm install @ai-sdk/openai
# 或 Anthropic
npm install @ai-sdk/anthropic
# 或通过 Vercel AI Gateway 统一调用（无需额外 provider）
```

### 1.3 Provider 选择

| Provider | 模型 | 费用 | 优势 |
|----------|------|------|------|
| **Vercel AI Gateway** | Claude Sonnet 5 / Opus 4.8 / GPT-4o 等 | 按量（见 §6） | 无需单独 API Key，统一计费，Vercel 原生 |
| OpenAI | GPT-4o / GPT-4o-mini | 按量 | 生态最成熟，中文能力强 |
| Anthropic | Claude Sonnet 5 / Haiku | 按量 | 长文写作优秀，适合攻略生成 |
| DeepSeek | DeepSeek-V3 / R1 | 极低 | 性价比最高，中文原生支持 |

**推荐**：开发阶段用 **DeepSeek**（便宜，中文好），生产可选 **Vercel AI Gateway + Claude**（Vercel 原生集成，零配置）。

---

## 2. AI 功能场景设计

### 2.1 场景总览

```
┌─────────────────────────────────────────────────────────┐
│                      用户触点                            │
├──────────────┬──────────────────┬───────────────────────┤
│  管理后台     │  公开页面         │  内部                  │
├──────────────┼──────────────────┼───────────────────────┤
│ ① AI 生成行程 │ ③ AI 目的地推荐  │ ④ 图片自动标签（可选） │
│ ② AI 润色攻略 │                  │                       │
└──────────────┴──────────────────┴───────────────────────┘
```

### 2.2 场景 ①：AI 生成行程（核心）

**入口**：`TripForm` 底部增加「🤖 AI 规划行程」按钮

**用户输入**（自动采集表单已填内容）：
- 目的地（已有）→ 如"大理"
- 日期范围（已有）→ 如 2026-08-01 ~ 2026-08-05
- 行程风格（新增的标签选择器）→ 如"休闲模式 + 美食之旅"
- 人数（可选，未来扩展）

**AI 输出**（结构化 JSON → Markdown 填入 content 字段）：
```json
{
  "overview": "5天4晚大理休闲美食之旅",
  "days": [
    {
      "day": 1,
      "title": "抵达大理，古城初探",
      "activities": [
        { "time": "14:00", "title": "入住古城民宿", "notes": "推荐洱海门附近" },
        { "time": "16:00", "title": "逛大理古城", "notes": "人民路、洋人街" },
        { "time": "19:00", "title": "古城美食夜", "notes": "烤饵块、凉鸡米线" }
      ]
    }
  ],
  "mapPoints": [
    { "name": "大理古城", "latitude": 25.68, "longitude": 100.16, "type": "visited" },
    { "name": "洱海", "latitude": 25.75, "longitude": 100.18, "type": "highlight" }
  ],
  "tips": ["大理海拔约2000m，注意防晒", "早晚温差大，带外套"]
}
```

**交互流程**：
```
用户点击「🤖 AI 规划行程」
  → 前端收集表单数据 → POST /api/ai/generate-itinerary
    → streamText() 流式生成
      → 前端实时渲染 Markdown 预览（打字机效果）
        → 用户确认 → 自动填入表单 content + mapPoints
```

### 2.3 场景 ②：AI 润色攻略

**入口**：`TripForm` 正文 textarea 旁增加「✨ AI 润色」按钮

**流程**：
```
选中已有文本（或留空自动基于已有字段生成）
  → POST /api/ai/polish-content
    → streamText() 返回润色后 Markdown
      → 用户确认替换
```

### 2.4 场景 ③：AI 目的地推荐

**入口**：公开首页或旅行列表页，增加「🤖 想去哪里？」搜索增强

**流程**：
```
用户输入模糊需求（如"适合冬天去的温暖海滨城市"）
  → POST /api/ai/recommend-destinations
    → generateObject() 返回结构化推荐列表
      → 卡片展示：目的地名 + 理由 + 最佳季节
```

### 2.5 功能优先级

| 优先级 | 功能 | 工时 | 依赖 |
|--------|------|------|------|
| P0 | ① AI 生成行程 | 4-6h | `@ai-sdk/openai`（或 Anthropic） |
| P1 | ② AI 润色攻略 | 2-3h | 与①共用 API 层 |
| P2 | ③ AI 目的地推荐 | 2-3h | 与①共用 API 层 |
| P3 | ④ 图片自动标签 | 3-4h | 需要 `@ai-sdk/openai` vision |

---

## 3. 技术架构

### 3.1 项目结构

```
src/
├── app/api/ai/
│   ├── generate-itinerary/route.ts    # [新建] AI 生成行程（streamText + tool calling）
│   ├── polish-content/route.ts        # [新建] AI 润色攻略
│   └── recommend-destinations/route.ts # [新建] AI 目的地推荐
├── lib/
│   └── ai/
│       ├── client.ts                  # [新建] AI SDK 客户端封装
│       ├── prompts/
│       │   ├── itinerary.ts           # [新建] 行程生成 Prompt 模板
│       │   ├── polish.ts              # [新建] 润色 Prompt 模板
│       │   └── recommend.ts           # [新建] 推荐 Prompt 模板
│       └── schemas/
│           └── itinerary.ts           # [新建] Zod Schema（结构化输出校验）
├── components/
│   ├── admin/
│   │   ├── AiGenerateButton.tsx       # [新建] AI 生成按钮 + 流式预览
│   │   └── AiPolishButton.tsx         # [新建] AI 润色按钮
│   └── ai/
│       ├── AiStreamPreview.tsx        # [新建] 流式内容预览组件（通用）
│       └── DestinationRecommend.tsx   # [新建] AI 推荐目的地卡片
└── hooks/
    └── useAiStream.ts                 # [新建] 通用流式请求 Hook
```

### 3.2 核心 API 设计

#### `POST /api/ai/generate-itinerary`

```typescript
// app/api/ai/generate-itinerary/route.ts
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { itineraryPrompt } from "@/lib/ai/prompts/itinerary";

export async function POST(req: Request) {
  const { destination, startDate, endDate, styles, peopleCount } =
    await req.json();

  // 从 Supabase 验证用户登录（仅管理员可调用）
  // ...

  const result = streamText({
    model: openai("gpt-4o-mini"), // 成本优先
    system: itineraryPrompt,
    prompt: `
      目的地：${destination}
      日期：${startDate} ~ ${endDate}
      风格：${styles.join("、")}
      人数：${peopleCount || "不限"}
    `,
    temperature: 0.7,
    maxTokens: 4096,
  });

  return result.toDataStreamResponse();
}
```

#### `POST /api/ai/polish-content`

```typescript
// app/api/ai/polish-content/route.ts
export async function POST(req: Request) {
  const { content, instruction } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system:
      "你是旅行攻略写作助手。根据用户指令润色文本，保持 Markdown 格式。",
    prompt: instruction
      ? `指令：${instruction}\n\n原文：\n${content}`
      : `请润色以下旅行攻略，使其更生动、结构更清晰：\n\n${content}`,
  });

  return result.toDataStreamResponse();
}
```

#### `POST /api/ai/recommend-destinations`

```typescript
// app/api/ai/recommend-destinations/route.ts
import { generateObject } from "ai";
import { z } from "zod";

const RecommendationSchema = z.object({
  destinations: z.array(
    z.object({
      name: z.string(),
      country: z.string(),
      reason: z.string(),
      bestSeason: z.string(),
      budget: z.enum(["low", "medium", "high"]),
    })
  ),
});

export async function POST(req: Request) {
  const { query } = await req.json();

  const result = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: RecommendationSchema,
    prompt: `用户需求：${query}。推荐 5 个合适的目的地。`,
  });

  return Response.json(result.object);
}
```

### 3.3 客户端组件设计

#### `useAiStream` Hook（通用流式 Hook）

```typescript
// hooks/useAiStream.ts
"use client";

import { useState, useCallback } from "react";

interface UseAiStreamOptions {
  api: string;
  onFinish?: (fullText: string) => void;
}

export function useAiStream({ api, onFinish }: UseAiStreamOptions) {
  const [streaming, setStreaming] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const trigger = useCallback(
    async (body: Record<string, unknown>) => {
      setStreaming(true);
      setText("");
      setError("");

      try {
        const res = await fetch(api, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error(`请求失败 (${res.status})`);

        const reader = res.body?.getReader();
        if (!reader) throw new Error("不支持流式响应");

        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Vercel AI SDK 流格式：纯文本（toDataStreamResponse 默认）
          fullText += decoder.decode(value, { stream: true });
          setText(fullText);
        }

        onFinish?.(fullText);
      } catch (err) {
        setError(err instanceof Error ? err.message : "未知错误");
      } finally {
        setStreaming(false);
      }
    },
    [api, onFinish]
  );

  return { trigger, streaming, text, error };
}
```

> **注意**：更完善的做法是使用 AI SDK 提供的 `useChat` / `useCompletion` hook，直接消费 `toDataStreamResponse()` 格式。上述手动实现主要用于理解流式原理。推荐方案见 §3.4。

#### `AiGenerateButton` 组件

```tsx
// components/admin/AiGenerateButton.tsx
"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { AiStreamPreview } from "@/components/ai/AiStreamPreview";

interface Props {
  formData: {
    destination: string;
    startDate: string;
    endDate: string;
    styles: string[];
  };
  onApply: (markdown: string, mapPoints: MapPoint[]) => void;
}

export function AiGenerateButton({ formData, onApply }: Props) {
  const [streaming, setStreaming] = useState(false);
  const [text, setText] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  async function handleGenerate() {
    setStreaming(true);
    setShowPreview(true);
    setText("");

    const res = await fetch("/api/ai/generate-itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let full = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      full += decoder.decode(value, { stream: true });
      setText(full);
    }
    setStreaming(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={streaming || !formData.destination}
        className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500
                   text-white px-5 py-2.5 rounded-full font-medium
                   hover:from-purple-400 hover:to-pink-400
                   disabled:opacity-40 transition-all"
      >
        {streaming ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Sparkles size={18} />
        )}
        {streaming ? "AI 生成中..." : "🤖 AI 规划行程"}
      </button>

      {showPreview && (
        <AiStreamPreview
          text={text}
          streaming={streaming}
          onApply={() => onApply(text, [])}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}
```

### 3.4 AI SDK 原生 Hook 方案（推荐）

用 `useChat` 替代手动 fetch 流式：

```bash
npm install @ai-sdk/react
```

```tsx
// 使用 AI SDK 原生 useChat（更简洁）
import { useChat } from "@ai-sdk/react";

export function AiGenerateButton({ formData }: Props) {
  const { messages, sendMessage, isLoading } = useChat({
    api: "/api/ai/generate-itinerary",
    onFinish: (message) => {
      // message.content 即生成结果
    },
  });

  function handleGenerate() {
    sendMessage({
      role: "user",
      content: `请为以下行程生成攻略：${JSON.stringify(formData)}`,
    });
  }
}
```

**推荐使用 `useChat`**，因为：
- 自动处理数据流解析（无需手动 `getReader()`）
- 内置错误重试
- 支持 `onToolCall` 回调（结构化输出场景）
- 单行集成，代码量减少 60%+

---

## 4. 与现有功能集成

### 4.1 TripForm 集成点

```
TripForm 底部现有：
┌─────────────────────────────┐
│ [保存] 按钮                  │
└─────────────────────────────┘

改造后：
┌─────────────────────────────┐
│ [🤖 AI 规划行程]  [保存]     │
└─────────────────────────────┘

点击 AI 规划行程 →
  弹出 Modal 流式展示生成内容 →
    用户确认 → 自动填入 content（Markdown）+ mapPoints
```

### 4.2 GuideEditor 集成点

```
GuideEditor 顶部现有：
┌─────────────────────────────┐
│ 行程攻略                      │
│ [表单区域]                    │
└─────────────────────────────┘

改造后：
表单区域底部增加 [🤖 AI 规划行程] 按钮
  → 生成内容的同时，右侧高德地图同步显示 mapPoints
```

### 4.3 数据流

```
┌─ TripForm ───────────────────────────────────────┐
│  destination: "大理"                              │
│  startDate: "2026-08-01"                          │
│  endDate: "2026-08-05"                            │
│  styles: ["休闲模式", "美食之旅"]                   │
│                                                    │
│  [🤖 AI 规划行程] ─────────┐                       │
└────────────────────────────┼───────────────────────┘
                             │ POST /api/ai/generate-itinerary
                             ▼
┌─ API Route ───────────────────────────────────────┐
│  streamText({                                      │
│    model: openai("gpt-4o-mini"),                   │
│    prompt: buildPrompt(formData),                  │
│  })                                                │
│    → toDataStreamResponse()                        │
└──────────────────────────┬─────────────────────────┘
                             │ SSE stream
                             ▼
┌─ AiGenerateButton ────────────────────────────────┐
│  Modal 中流式渲染 Markdown                          │
│  用户点击「应用」→                                    │
│    tripForm.setContent(markdown)                   │
│    tripForm.setMapPoints(extractedPoints)          │
└────────────────────────────────────────────────────┘
```

---

## 5. Prompt 工程

### 5.1 行程生成 System Prompt

```typescript
// lib/ai/prompts/itinerary.ts

export const ITINERARY_SYSTEM_PROMPT = `你是专业旅行规划师。根据用户提供的旅行信息，生成详细的行程攻略。

## 输出格式

用 Markdown 格式输出，包含以下结构：

### 概述
一段话概括本次旅行。

### 每日行程
\`\`\`
## Day N：标题
- **上午**：活动描述
- **下午**：活动描述
- **晚上**：活动描述
- 🍜 美食推荐：餐厅/小吃
- 💡 贴士：实用建议
\`\`\`

### 地图标记点
用 JSON 代码块输出推荐的地点坐标：
\`\`\`json
[{"name":"地点名","latitude":25.6,"longitude":100.2,"type":"visited"}]
\`\`\`

### 旅行贴士
- 交通建议
- 天气/穿衣
- 预算参考

## 风格指南
- 语言生动有趣，像朋友推荐
- 兼顾热门景点和小众体验
- 美食部分要具体（店名、招牌菜）
- 行程节奏合理，不要太赶`;
```

### 5.2 结构化输出（方案二）

如果希望 AI 返回严格的 JSON 结构（便于提取 mapPoints），用 `generateObject`：

```typescript
import { generateObject } from "ai";
import { z } from "zod";

const ItinerarySchema = z.object({
  overview: z.string(),
  content: z.string(), // 完整 Markdown
  days: z.array(
    z.object({
      day: z.number(),
      title: z.string(),
      activities: z.array(
        z.object({
          time: z.string(),
          title: z.string(),
          notes: z.string().optional(),
        })
      ),
    })
  ),
  mapPoints: z.array(
    z.object({
      name: z.string(),
      latitude: z.number(),
      longitude: z.number(),
      type: z.enum(["visited", "highlight", "wishlist"]),
    })
  ),
  tips: z.array(z.string()),
});

const result = await generateObject({
  model: openai("gpt-4o-mini"),
  schema: ItinerarySchema,
  prompt: `目的地：${destination}...`,
});

// result.object 是严格类型化的 Itinerary
```

---

## 6. 费用分析

### 6.1 各模型费用对比（每 1M token）

| 模型 | 输入 | 输出 | 适用 |
|------|------|------|------|
| GPT-4o-mini | $0.15 | $0.60 | 默认推荐，性价比高 |
| GPT-4o | $2.50 | $10.00 | 复杂行程（偶尔用） |
| DeepSeek-V3 | ~$0.27 | ~$1.10 | 中文最优，极低成本 |
| Claude Sonnet 5 (Vercel Gateway) | $2.00 | $10.00 | 高质量长文 |
| Claude Haiku 4.5 | $0.80 | $4.00 | 快速简单任务 |

### 6.2 预估用量与费用

假设：
- 每次行程生成：~2K token 输出（约 1500 字中文）
- 每月创建 20 篇行程

| 方案 | 模型 | 月费用 |
|------|------|--------|
| 省钱方案 | DeepSeek-V3 | < $0.05 |
| 均衡方案 | GPT-4o-mini | < $0.03 |
| 品质方案 | Claude Sonnet 5 | ~$0.24 |

**结论**：个人使用场景下，任何方案的月度 AI 费用都在 **$1 以内**，可以忽略不计。

### 6.3 Vercel AI Gateway 优势

使用 Vercel AI Gateway 时：
- **零额外 API Key**：通过 Vercel 控制台统一管理和计费
- **内置速率限制**：防止意外超量
- **使用量仪表盘**：Vercel Dashboard 可直接查看 Token 消耗
- **模型切换成本极低**：改一行字符串即可切换模型

---

## 7. 环境变量

```bash
# .env.local

# Provider 方式一：直接 API Key
OPENAI_API_KEY=sk-xxxxx
# 或
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Provider 方式二：Vercel AI Gateway（推荐，无需额外 API Key）
# 在 Vercel Dashboard → AI Gateway 中配置，SDK 自动读取
```

---

## 8. 实现路线图

### Phase 1：基础设施（1-2h）

| 步骤 | 任务 |
|------|------|
| 1.1 | 安装 Provider：`npm install @ai-sdk/openai`（或 anthropic） |
| 1.2 | 创建 `src/lib/ai/client.ts`：封装模型实例 |
| 1.3 | 创建 Prompt 模板目录 `src/lib/ai/prompts/` |
| 1.4 | 添加环境变量 |
| 1.5 | 验证：写一个简单的 `/api/ai/test` 测试连通性 |

### Phase 2：AI 生成行程（3-4h）

| 步骤 | 任务 |
|------|------|
| 2.1 | 编写行程生成 System Prompt |
| 2.2 | 创建 `POST /api/ai/generate-itinerary` |
| 2.3 | 创建 `AiGenerateButton` 组件 |
| 2.4 | 创建 `AiStreamPreview` 流式预览 Modal |
| 2.5 | 集成到 `TripForm`：AI 生成 → 填入 content |
| 2.6 | 解析 mapPoints 并填入 MapPointsEditor |

### Phase 3：AI 润色 + 推荐（3-4h）

| 步骤 | 任务 |
|------|------|
| 3.1 | 创建 `POST /api/ai/polish-content` |
| 3.2 | 创建 `AiPolishButton` 组件 |
| 3.3 | 创建 `POST /api/ai/recommend-destinations` |
| 3.4 | 创建公开页面 AI 推荐卡片组件 |

### Phase 4：优化与完善（2-3h）

| 步骤 | 任务 |
|------|------|
| 4.1 | 统一错误处理 + 超时兜底 |
| 4.2 | 增加生成历史（可选：保存到 Supabase） |
| 4.3 | 流式体验打磨（打字机光标、进度指示） |
| 4.4 | Token 用量监控（Vercel Dashboard） |

---

## 9. 注意事项

| 风险 | 应对 |
|------|------|
| **API Key 泄露** | Key 仅存 `.env.local`，不在客户端使用；API Route 是服务端代码 |
| **Vercel Function 超时** | 免费版 10s（Pro 60s）。使用 `streamText` 流式响应，首字节在 2s 内即满足要求 |
| **AI 输出格式不稳定** | 使用 `generateObject` + Zod Schema 强校验，或 Prompt 中明确要求 JSON 代码块 |
| **中文输出质量** | GPT-4o-mini 中文足够好；如需极致质量，选 DeepSeek-V3 或 Claude Sonnet 5 |
| **费用失控** | Vercel AI Gateway 设置月度预算上限；单个 Key 设 useage limit |
| **内容合规** | AI 生成内容仅供草稿参考，最终发布前需人工审核 |

---

## 10. 扩展方向（远期）

- **AI 图片分析**：上传旅行照片 → AI 自动生成描述、标签、拍摄地点推测（`@ai-sdk/openai` vision）
- **AI 语音导览**：生成行程后，一键转语音导游词（`ai` SDK speech 模块）
- **AI 翻译**：攻略中英文自动翻译（`generateText` 低成本场景）
- **AI 问答**：基于已有行程数据，训练/检索回答用户问题（RAG + `useChat`）

---

> **状态**：📋 待实施
>
> **创建时间**：2026-07-03
