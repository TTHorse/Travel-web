import { NextResponse } from "next/server";
import { GenerateGuideInputSchema } from "@/types/ai-guide";
import { buildGuideSystemPrompt } from "@/lib/ai/guide-generator";
import { createAIGuide } from "@/lib/data/ai-guides";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY ?? "";
const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

/**
 * POST /api/ai/generate-guide
 * 接收旅行参数，流式返回 AI 生成的攻略，完成后存入 Supabase
 *
 * 直接调 DeepSeek Chat Completions API（SSE streaming），
 * 避免 @ai-sdk/openai v4 默认走 /v1/responses 不兼容 DeepSeek 的问题
 */
export async function POST(request: Request) {
  // ── 解析 & 校验 ──
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const parsed = GenerateGuideInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "参数校验失败", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const input = parsed.data;

  // ── 构建请求 ──
  const systemPrompt = buildGuideSystemPrompt(input);
  const userPrompt = `请为${input.destination}生成一份${
    input.keywords.length > 0 ? input.keywords.join("、") + "风格的" : ""
  }旅行攻略。`;

  const deepseekRes = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
      stream: true,
    }),
  });

  if (!deepseekRes.ok) {
    const errText = await deepseekRes.text().catch(() => "");
    console.error("[generate-guide] DeepSeek API 错误:", deepseekRes.status, errText);
    return NextResponse.json(
      { error: `AI 服务返回错误 (${deepseekRes.status})` },
      { status: 502 }
    );
  }

  // ── 流式转发 + 收集全文 ──
  const reader = deepseekRes.body?.getReader();
  if (!reader) {
    return NextResponse.json({ error: "无法读取 AI 响应流" }, { status: 502 });
  }

  const encoder = new TextEncoder();
  let fullContent = "";

  const stream = new ReadableStream({
    async start(controller) {
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            const data = trimmed.slice(6);
            if (data === "[DONE]") continue;

            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                fullContent += delta;
                controller.enqueue(encoder.encode(delta));
              }
            } catch {
              // 跳过非 JSON 行
            }
          }
        }

        // 处理 buffer 中剩余数据
        if (buffer.trim()) {
          const data = buffer.trim().slice(6);
          if (data && data !== "[DONE]") {
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                fullContent += delta;
                controller.enqueue(encoder.encode(delta));
              }
            } catch {
              // ignore
            }
          }
        }
      } catch (err) {
        console.error("[generate-guide] 流读取错误:", err);
      } finally {
        controller.close();

        // 流完成后异步存入 Supabase
        if (fullContent) {
          try {
            await createAIGuide({
              destination: input.destination,
              adcode: input.adcode,
              startDate: input.startDate,
              endDate: input.endDate,
              budget: input.budget,
              travelerCount: input.travelerCount,
              keywords: input.keywords,
              content: fullContent,
            });
          } catch (err) {
            console.error("[generate-guide] 存储失败:", err);
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
