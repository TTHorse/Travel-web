"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, KeyRound, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const router = useRouter();

  // 检查是否有有效的重置 session
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setChecking(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setChecking(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    if (password.length < 6) {
      setError("密码长度至少 6 位");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setError("Supabase 未配置，请检查环境变量");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      // 清除 session，引导用户用新密码登录
      await supabase.auth.signOut();
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-white/30" />
      </div>
    );
  }

  // 无 session — 链接已失效或直接访问
  if (!hasSession && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle size={48} className="text-yellow-400/60" />
          </div>
          <h1 className="text-2xl font-bold mb-4">链接已失效</h1>
          <p className="text-white/60 mb-6">
            密码重置链接已过期或无效。请重新发起密码重置请求。
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full font-medium hover:bg-white/90 transition-colors"
          >
            重新发起密码重置
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-4">
            <KeyRound size={48} className="text-green-400/60" />
          </div>
          <h1 className="text-2xl font-bold mb-4">密码已重置</h1>
          <p className="text-white/60 mb-6">
            密码修改成功。请使用新密码登录。
          </p>
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full font-medium hover:bg-white/90 transition-colors"
          >
            去登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">设置新密码</h1>
        <p className="text-sm text-white/40 text-center mb-8">
          请输入新的登录密码
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="新密码（至少 6 位）"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          <div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="确认新密码"
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
              <KeyRound size={18} />
            )}
            {loading ? "重置中..." : "重置密码"}
          </button>
        </form>
      </div>
    </div>
  );
}
