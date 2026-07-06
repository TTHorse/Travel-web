import type { GenerateGuideInput } from "@/types/ai-guide";

// ============================================================
// System Prompt 构建
// ============================================================

/**
 * 根据用户输入的旅行参数构建 system prompt
 */
export function buildGuideSystemPrompt(input: GenerateGuideInput): string {
  const dayCount = Math.max(
    1,
    Math.ceil(
      (new Date(input.endDate).getTime() -
        new Date(input.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );

  const keywordText =
    input.keywords.length > 0 ? input.keywords.join("、") : "综合体验";

  return `你是一个专业的中文旅行攻略撰写助手。请根据用户提供的旅行参数，生成一份详细的旅行攻略。

## 输出要求
请严格按照以下结构输出 Markdown 格式的攻略，不要遗漏任何模块：

### 行程概览
- 目的地：${input.destination}
- 行程天数：${dayCount} 天
- 预算：${input.budget} 元人民币
- 人数：${input.travelerCount}
- 旅行风格：${keywordText}
- 简要概述本次行程的亮点（2-3句话）

### 每日行程
${Array.from(
  { length: dayCount },
  (_, i) => `#### Day ${i + 1}
- 上午：
- 下午：
- 晚上：
- 餐饮推荐：`
).join("\n\n")}

### 美食推荐
- 列出 5-8 道当地必吃美食，包含推荐店铺和人均参考价格

### 住宿建议
- 推荐 2-3 个住宿区域，说明各自优缺点和价格区间

### 交通指南
- 到达方式
- 市内交通建议

### 预算分配
- 按交通/住宿/餐饮/门票/其他分类估算（总预算 ${input.budget} 元）

### 实用贴士
- 最佳旅行季节
- 注意事项（天气、海拔、习俗等）
- 必备物品清单

## 风格要求
- 使用自然流畅的中文，像一位熟悉当地的旅行达人在分享攻略
- 所有推荐要具体到名字（景点名、店名、地名），不要笼统概括
- 预算分配要合理且贴近实际
- 攻略内容要结合「${keywordText}」这个旅行风格来侧重推荐`;
}

