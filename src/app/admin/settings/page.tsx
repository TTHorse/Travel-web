"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, KeyRound, CheckCircle, User, Upload } from "lucide-react";
import Script from "next/script";

export default function AdminSettingsPage() {
  // ---- 个人资料状态 ----
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);

  // ---- 密码修改状态 ----
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  // Cloudinary upload widget
  const widgetRef = useRef<unknown>(null);

  const openUploadWidget = useCallback(() => {
    const cloudinary = (window as unknown as Record<string, unknown>)
      .cloudinary as Record<string, unknown> | undefined;
    if (!cloudinary) return;

    if (!widgetRef.current) {
      widgetRef.current = (cloudinary.createUploadWidget as Function)(
        {
          cloudName: "ncgzlyq5",
          uploadPreset: "travel-web-uploads",
          maxFiles: 1,
          sources: ["local", "url", "camera"],
          cropping: true,
          croppingAspectRatio: 1,
          showAdvancedOptions: false,
          styles: {
            palette: {
              window: "#171717",
              sourceBg: "#262626",
              windowBorder: "#404040",
              tabIcon: "#a3a3a3",
              inactiveTabIcon: "#525252",
              menuIcons: "#a3a3a3",
              link: "#fb923c",
              action: "#fb923c",
              inProgress: "#fb923c",
              complete: "#4ade80",
              error: "#f87171",
              textDark: "#ffffff",
              textLight: "#a3a3a3",
            },
          },
        },
        (_error: unknown, result: Record<string, unknown>) => {
          if (result?.event === "success" && result?.info) {
            const info = result.info as Record<string, unknown>;
            if (info.secure_url) {
              setAvatarUrl(info.secure_url as string);
            }
          }
        }
      );
    }

    (widgetRef.current as Record<string, () => void>).open();
  }, []);

  // 加载当前 profile
  useEffect(() => {
    fetch("/api/profile")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then((data) => {
        setDisplayName(data.profile?.display_name ?? "");
        setAvatarUrl(data.profile?.avatar_url ?? "");
      })
      .catch(() => setProfileError("加载个人资料失败"))
      .finally(() => setProfileLoading(false));
  }, []);

  // ---- 保存个人资料 ----
  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess(false);

    if (!displayName.trim()) {
      setProfileError("昵称不能为空");
      return;
    }

    setProfileSaving(true);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: displayName.trim(),
        avatar_url: avatarUrl || null,
      }),
    });

    const data = await res.json();
    setProfileSaving(false);

    if (res.ok && data.profile) {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } else {
      setProfileError(data.error ?? "保存失败，请稍后重试");
    }
  }

  // ---- 修改密码 ----
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);

    if (newPassword !== confirmPassword) {
      setPwError("两次输入的密码不一致");
      return;
    }

    if (newPassword.length < 6) {
      setPwError("新密码长度至少 6 位");
      return;
    }

    setPwLoading(true);

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();
    setPwLoading(false);

    if (res.ok && data.success) {
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPwError(data.error ?? "修改失败，请稍后重试");
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12 space-y-10">
      <Script
        src="https://upload-widget.cloudinary.com/global/all.js"
        strategy="afterInteractive"
      />
      <div>
        <h1 className="text-2xl font-bold mb-2">设置</h1>
        <p className="text-white/40 text-sm">管理个人资料与账户安全</p>
      </div>

      {/* ============================== 个人资料 ============================== */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
        <h2 className="text-lg font-medium mb-6 flex items-center gap-2">
          <User size={20} />
          个人资料
        </h2>

        {profileLoading ? (
          <div className="flex items-center gap-2 text-white/30">
            <Loader2 size={18} className="animate-spin" />
            加载中...
          </div>
        ) : (
          <form onSubmit={handleProfileSave} className="space-y-5">
            {/* 头像 */}
            <div>
              <label className="block text-sm text-white/50 mb-2">头像</label>
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <div className="relative group">
                    <img
                      src={avatarUrl}
                      alt="头像预览"
                      className="w-16 h-16 rounded-full object-cover border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => setAvatarUrl("")}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="移除头像"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/5">
                    <User size={28} className="text-white/30" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => openUploadWidget()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-white/20 hover:border-white/40 bg-white/[0.02] hover:bg-white/[0.04] text-white/50 hover:text-white/70 text-sm transition-all"
                >
                  <Upload size={14} />
                  {avatarUrl ? "更换" : "上传"}
                </button>
              </div>
            </div>

            {/* 昵称 */}
            <div>
              <label className="block text-sm text-white/50 mb-1.5">
                昵称
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="输入昵称"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>

            {profileError && (
              <p className="text-red-400 text-sm">{profileError}</p>
            )}

            {profileSuccess && (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2.5 text-green-400 text-sm">
                <CheckCircle size={16} />
                个人资料已保存
              </div>
            )}

            <button
              type="submit"
              disabled={profileSaving}
              className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {profileSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : null}
              {profileSaving ? "保存中..." : "保存"}
            </button>
          </form>
        )}
      </div>

      {/* ============================== 修改密码 ============================== */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
        <h2 className="text-lg font-medium mb-6 flex items-center gap-2">
          <KeyRound size={20} />
          修改密码
        </h2>

        {pwSuccess && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 mb-6 text-green-400 text-sm">
            <CheckCircle size={16} />
            密码修改成功
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/50 mb-1.5">
              当前密码
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-white/50 mb-1.5">新密码</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="至少 6 位"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-white/50 mb-1.5">
              确认新密码
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {pwError && <p className="text-red-400 text-sm">{pwError}</p>}

          <button
            type="submit"
            disabled={pwLoading}
            className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {pwLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <KeyRound size={18} />
            )}
            {pwLoading ? "修改中..." : "修改密码"}
          </button>
        </form>
      </div>
    </div>
  );
}
