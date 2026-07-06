import { z } from "zod";

// ============================================================
// AI 攻略数据库记录
// ============================================================

export interface AIGuide {
  id: string;
  destination: string;
  adcode: string;
  start_date: string;
  end_date: string;
  budget: number;
  traveler_count: string;
  keywords: string[];
  content: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
}

// ============================================================
// 生成请求 Zod Schema
// ============================================================

export const GenerateGuideInputSchema = z.object({
  destination: z.string().min(1, "目的地不能为空"),
  adcode: z.string().default(""),
  startDate: z.string().min(1, "开始日期不能为空"),
  endDate: z.string().min(1, "结束日期不能为空"),
  budget: z.number().int().min(0, "预算不能为负数"),
  travelerCount: z.string().min(1, "人数不能为空"),
  keywords: z.array(z.string()).default([]),
});

export type GenerateGuideInput = z.infer<typeof GenerateGuideInputSchema>;
