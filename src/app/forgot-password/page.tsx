"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("请输入邮箱地址");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setError("Supabase 未配置，请检查环境变量");
      setLoading(false);
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/reset-password` }
    );

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-4">
            <Mail size={48} className="text-white/30" />
          </div>
          <h1 className="text-2xl font-bold mb-4">邮件已发送</h1>
          <p className="text-white/60 mb-6">
            密码重置邮件已发送至 <strong>{email}</strong>，请查看邮箱并点击邮件中的链接重置密码。
          </p>
          <Link
            href="/admin/login"
            className="text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            ← 返回登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-1 text-sm text-white/30 hover:text-white/50 transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          返回登录
        </Link>

        <h1 className="text-2xl font-bold text-center mb-2">忘记密码</h1>
        <p className="text-sm text-white/40 text-center mb-8">
          输入注册邮箱，我们将发送密码重置链接
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-white text-black py-2.5 rounded-full font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Mail size={18} />
            )}
            {loading ? "发送中..." : "发送重置邮件"}
          </button>
        </form>
      </div>
    </div>
  );
}
