"use client";

import { useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Upload, X, Loader2 } from "lucide-react";
import type { CloudinaryUploadWidgetResults } from "next-cloudinary";

interface CloudinaryUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export function CloudinaryUpload({ value, onChange }: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false);

  function handleUpload(result: CloudinaryUploadWidgetResults) {
    if (result.event === "success" && result.info && typeof result.info === "object" && "secure_url" in result.info) {
      onChange(result.info.secure_url as string);
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
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
        <CldUploadWidget
          uploadPreset="travel-web-uploads"
          onUpload={(result) => handleUpload(result)}
          onOpen={() => setUploading(false)}
        >
          {({ open }) => (
            <button
              type="button"
              onClick={() => {
                setUploading(true);
                open();
              }}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-white/20 hover:border-white/40 bg-white/[0.02] hover:bg-white/[0.04] text-white/50 hover:text-white/70 transition-all disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Upload size={18} />
              )}
              {uploading ? "上传中..." : "上传封面图"}
            </button>
          )}
        </CldUploadWidget>
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
