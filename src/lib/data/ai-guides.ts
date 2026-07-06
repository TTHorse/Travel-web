import { createServiceSupabase } from "@/lib/supabase/server";
import type { AIGuide } from "@/types/ai-guide";

// ============================================================
// AI 攻略数据访问层
// ============================================================

/**
 * 创建一条 AI 生成的攻略记录（使用 service role 绕过 RLS）
 */
export async function createAIGuide(input: {
  destination: string;
  adcode: string;
  startDate: string;
  endDate: string;
  budget: number;
  travelerCount: string;
  keywords: string[];
  content: string;
}): Promise<AIGuide | null> {
  const supabase = await createServiceSupabase();

  const { data, error } = await supabase
    .from("ai_guides")
    .insert({
      destination: input.destination,
      adcode: input.adcode,
      start_date: input.startDate,
      end_date: input.endDate,
      budget: input.budget,
      traveler_count: input.travelerCount,
      keywords: input.keywords,
      content: input.content,
      status: "published",
    })
    .select()
    .single();

  if (error) {
    console.error("[ai-guides] 创建失败:", error.message);
    return null;
  }

  return data as AIGuide;
}

/**
 * 获取所有 AI 攻略，按创建时间倒序
 */
export async function getAllGeneratedGuides(): Promise<AIGuide[]> {
  const supabase = await createServiceSupabase();

  const { data, error } = await supabase
    .from("ai_guides")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[ai-guides] 查询列表失败:", error.message);
    return [];
  }

  return (data ?? []) as AIGuide[];
}

/**
 * 获取单条 AI 攻略
 */
export async function getGeneratedGuideById(
  id: string
): Promise<AIGuide | null> {
  const supabase = await createServiceSupabase();

  const { data, error } = await supabase
    .from("ai_guides")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return data as AIGuide;
}
