"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Send, Loader2, Reply } from "lucide-react";
import type { Comment } from "@/types/comment";
import { UserAvatar } from "@/components/ui/UserAvatar";

const commentSchema = z.object({
  content: z.string().min(1, "请输入评论内容").max(1000, "评论不能超过1000字"),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface CommentSectionProps {
  tripId: string;
  loggedIn: boolean;
}

export function CommentSection({ tripId, loggedIn }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  });

  // 回复表单
  const {
    register: registerReply,
    handleSubmit: handleReplySubmit,
    reset: resetReply,
    formState: { errors: replyErrors },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  });

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 加载评论
  useEffect(() => {
    let cancelled = false;

    async function loadComments() {
      try {
        const res = await fetch(
          `/api/community/trips/${tripId}/comments`
        );
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
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  // 发表评论
  const onSubmit = useCallback(
    async (formData: CommentFormData) => {
      setSubmitting(true);
      try {
        const res = await fetch(
          `/api/community/trips/${tripId}/comments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: formData.content }),
          }
        );
        if (res.ok) {
          reset();
          setSuccessMsg("评论发表成功");
          setTimeout(() => {
            if (mountedRef.current) setSuccessMsg("");
          }, 3000);
          // 刷新评论列表
          const refreshRes = await fetch(
            `/api/community/trips/${tripId}/comments`
          );
          if (refreshRes.ok) {
            const json = await refreshRes.json();
            if (mountedRef.current) setComments(json.data || []);
          }
        } else {
          const err = await res.json();
          setSuccessMsg(err.error || "评论发表失败");
        }
      } catch {
        setSuccessMsg("网络错误，请重试");
      }
      setSubmitting(false);
    },
    [tripId, reset]
  );

  // 发表回复
  const onReplySubmit = useCallback(
    async (formData: CommentFormData, parentId: string) => {
      setSubmitting(true);
      try {
        const res = await fetch(
          `/api/community/trips/${tripId}/comments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: formData.content,
              parent_id: parentId,
            }),
          }
        );
        if (res.ok) {
          resetReply();
          setReplyTo(null);
          // 刷新评论列表
          const refreshRes = await fetch(
            `/api/community/trips/${tripId}/comments`
          );
          if (refreshRes.ok) {
            const json = await refreshRes.json();
            if (mountedRef.current) setComments(json.data || []);
          }
        }
      } catch {
        // 静默失败
      }
      setSubmitting(false);
    },
    [tripId, resetReply]
  );

  // 组织评论树：父评论 + 子回复
  const topLevelComments = comments.filter((c) => !c.parent_id);
  const replies = comments.filter((c) => c.parent_id);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        评论{loading ? "" : ` (${comments.length})`}
      </h2>

      {/* 评论表单 — 仅登录用户可见 */}
      {loggedIn ? (
        <form onSubmit={handleSubmit(onSubmit)} className="mb-10">
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
            <p
              className={`text-sm mt-2 ${
                successMsg.includes("失败") || successMsg.includes("错误")
                  ? "text-red-400"
                  : "text-green-400"
              }`}
            >
              {successMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 mt-3 bg-white text-black px-6 py-2.5 rounded-full font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
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
          <p className="text-white/40 text-sm">
            登录后参与讨论
          </p>
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
          {topLevelComments.map((comment) => {
            const childReplies = replies.filter(
              (r) => r.parent_id === comment.id
            );

            return (
              <div key={comment.id}>
                <div className="flex gap-3">
                  <Link
                    href={`/users/${comment.user_id}`}
                    className="flex-shrink-0 hover:opacity-80 transition-opacity"
                  >
                    <UserAvatar
                      url={comment.author_avatar_url}
                      name={comment.author_name}
                      size={40}
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/users/${comment.user_id}`}
                        className="font-medium text-white text-sm hover:text-orange-400 transition-colors"
                      >
                        {comment.author_name}
                      </Link>
                      <span className="text-xs text-white/30">
                        {new Date(comment.created_at).toLocaleDateString(
                          "zh-CN"
                        )}
                      </span>
                    </div>
                    <p className="text-white/60 text-sm leading-relaxed">
                      {comment.content}
                    </p>
                    {loggedIn && (
                      <button
                        onClick={() =>
                          setReplyTo(
                            replyTo === comment.id ? null : comment.id
                          )
                        }
                        className="flex items-center gap-1 mt-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
                      >
                        <Reply size={12} />
                        回复
                      </button>
                    )}
                  </div>
                </div>

                {/* 回复表单 */}
                {replyTo === comment.id && (
                  <div className="ml-13 mt-3">
                    <form
                      onSubmit={handleReplySubmit((data) =>
                        onReplySubmit(data, comment.id)
                      )}
                      className="flex gap-2"
                    >
                      <input
                        {...registerReply("content")}
                        placeholder={`回复 ${comment.author_name}...`}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-3 py-2 bg-white/10 text-white/60 text-sm rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                      >
                        {submitting ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}
                      </button>
                    </form>
                    {replyErrors.content && (
                      <p className="text-red-400 text-xs mt-1">
                        {replyErrors.content.message}
                      </p>
                    )}
                  </div>
                )}

                {/* 子回复 */}
                {childReplies.length > 0 && (
                  <div className="ml-13 mt-3 space-y-3">
                    {childReplies.map((reply) => (
                      <div key={reply.id} className="flex gap-2.5">
                        <Link
                          href={`/users/${reply.user_id}`}
                          className="flex-shrink-0 hover:opacity-80 transition-opacity"
                        >
                          <UserAvatar
                            url={reply.author_avatar_url}
                            name={reply.author_name}
                            size={28}
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Link
                              href={`/users/${reply.user_id}`}
                              className="font-medium text-white text-xs hover:text-orange-400 transition-colors"
                            >
                              {reply.author_name}
                            </Link>
                            <span className="text-[10px] text-white/30">
                              {new Date(
                                reply.created_at
                              ).toLocaleDateString("zh-CN")}
                            </span>
                          </div>
                          <p className="text-white/50 text-xs leading-relaxed">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
