"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, User, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Comment } from "@/types/comment";

const commentSchema = z.object({
  author_name: z
    .string()
    .min(1, "请输入昵称")
    .max(50, "昵称不能超过50字"),
  content: z
    .string()
    .min(1, "请输入评论内容")
    .max(1000, "评论不能超过1000字"),
});

type CommentFormData = z.infer<typeof commentSchema>;

export function CommentSection({ tripId }: { tripId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  });

  useEffect(() => {
    async function loadComments() {
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("trip_id", tripId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (data) setComments(data);
      setLoading(false);
    }
    loadComments();
  }, [tripId, supabase]);

  const onSubmit = useCallback(
    async (formData: CommentFormData) => {
      setSubmitting(true);
      const { error } = await supabase.from("comments").insert({
        trip_id: tripId,
        author_name: formData.author_name,
        content: formData.content,
      });

      if (!error) {
        reset();
        setSuccessMsg("评论已提交，审核后将显示");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
      setSubmitting(false);
    },
    [tripId, supabase, reset]
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        评论{loading ? "" : ` (${comments.length})`}
      </h2>

      {/* 评论表单 */}
      <form onSubmit={handleSubmit(onSubmit)} className="mb-10 space-y-4">
        <div>
          <input
            {...register("author_name")}
            placeholder="你的昵称"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
          />
          {errors.author_name && (
            <p className="text-red-400 text-sm mt-1">
              {errors.author_name.message}
            </p>
          )}
        </div>

        <div>
          <textarea
            {...register("content")}
            placeholder="分享你的想法..."
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors resize-none"
          />
          {errors.content && (
            <p className="text-red-400 text-sm mt-1">
              {errors.content.message}
            </p>
          )}
        </div>

        {successMsg && (
          <p className="text-green-400 text-sm">{successMsg}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          {submitting ? "提交中..." : "发表评论"}
        </button>
      </form>

      {/* 评论列表 */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-white/30" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-white/30 text-center py-8">
          还没有评论，来说两句吧
        </p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-white/40" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-white text-sm">
                    {comment.author_name}
                  </span>
                  <span className="text-xs text-white/30">
                    {new Date(comment.created_at).toLocaleDateString("zh-CN")}
                  </span>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
