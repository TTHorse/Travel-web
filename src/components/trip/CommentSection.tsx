"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Send, User, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Comment } from "@/types/comment";

const commentSchema = z.object({
  content: z.string().min(1, "请输入评论内容").max(1000, "评论不能超过1000字"),
});

type CommentFormData = z.infer<typeof commentSchema>;

export function CommentSection({ tripId }: { tripId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const mountedRef = useRef(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  });

  // 检查登录状态
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      if (mountedRef.current) setLoggedIn(!!data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mountedRef.current) setLoggedIn(!!session);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadComments() {
      try {
        const res = await fetch(`/api/comments?trip_id=${encodeURIComponent(tripId)}`);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) {
          setComments(json.data || []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    loadComments();
    return () => { cancelled = true; };
  }, [tripId]);

  const onSubmit = useCallback(
    async (formData: CommentFormData) => {
      if (!loggedIn) return;
      setSubmitting(true);
      try {
        const res = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trip_id: tripId, content: formData.content }),
        });
        if (res.ok) {
          reset();
          setSuccessMsg("评论发表成功");
          setTimeout(() => {
            if (mountedRef.current) setSuccessMsg("");
          }, 3000);
          // 刷新评论列表
          const refreshRes = await fetch(`/api/comments?trip_id=${encodeURIComponent(tripId)}`);
          if (refreshRes.ok) {
            const json = await refreshRes.json();
            if (mountedRef.current) setComments(json.data || []);
          }
        } else {
          const err = await res.json();
          setSuccessMsg(err.error || "评论提交失败");
        }
      } catch {
        // 静默失败
      }
      setSubmitting(false);
    },
    [tripId, reset, loggedIn]
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        评论{loading ? "" : ` (${comments.length})`}
      </h2>

      {/* 评论表单 — 仅登录用户可见 */}
      {loggedIn ? (
        <form onSubmit={handleSubmit(onSubmit)} className="mb-10 space-y-4">
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
            <p className={`text-sm ${
              successMsg.includes("失败") ? "text-red-400" : "text-green-400"
            }`}>
              {successMsg}
            </p>
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
      ) : (
        <div className="mb-10 p-6 rounded-xl bg-white/[0.02] border border-white/5 text-center">
          <p className="text-white/40 text-sm">登录后参与评论</p>
          <Link
            href="/admin/login"
            className="inline-block mt-3 text-sm text-orange-400 hover:text-orange-300 transition-colors"
          >
            前往登录 →
          </Link>
        </div>
      )}

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
