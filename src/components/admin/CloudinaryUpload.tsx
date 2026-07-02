"use client";

import { useRef, useCallback } from "react";
import { Upload, X } from "lucide-react";
import Script from "next/script";

interface CloudinaryUploadProps {
  value: string;
  onChange: (url: string) => void;
}

// Cloudinary 原生 upload widget — 不依赖 next-cloudinary 的封装
function UploadWidget({ onChange }: { onChange: (url: string) => void }) {
  const widgetRef = useRef<unknown>(null);

  const openWidget = useCallback(() => {
    const w = (window as unknown as Record<string, unknown>).cloudinary as Record<string, unknown> | undefined;
    if (!w) return;

    if (!widgetRef.current) {
      widgetRef.current = (w.createUploadWidget as Function)(
        {
          cloudName: "ncgzlyq5",
          uploadPreset: "travel-web-uploads",
          maxFiles: 1,
          sources: ["local", "url", "camera"],
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
              onChange(info.secure_url as string);
            }
          }
        }
      );
    }

    (widgetRef.current as Record<string, () => void>).open();
  }, [onChange]);

  return (
    <button
      type="button"
      onClick={openWidget}
      className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-white/20 hover:border-white/40 bg-white/[0.02] hover:bg-white/[0.04] text-white/50 hover:text-white/70 transition-all"
    >
      <Upload size={18} />
      上传封面图
    </button>
  );
}

export function CloudinaryUpload({ value, onChange }: CloudinaryUploadProps) {
  return (
    <div className="space-y-2">
      {/* Cloudinary widget 脚本 */}
      <Script
        src="https://upload-widget.cloudinary.com/global/all.js"
        strategy="afterInteractive"
      />

      {value ? (
        <div className="relative inline-block group">
          <img
            src={value}
            alt="封面图预览"
            className="h-32 rounded-lg object-cover border border-white/10"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="移除封面图"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <UploadWidget onChange={onChange} />
      )}

      {/* 手动输入 URL 备选 */}
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="或手动输入图片 URL"
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
      />
    </div>
  );
}
