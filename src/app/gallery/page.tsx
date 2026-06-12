import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "图片画廊",
  description: "浏览所有旅行照片",
};

export default function GalleryPage() {
  return (
    <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">图片画廊</h1>
      <p className="text-white/50 mb-8">每一张照片，都是旅途的见证</p>

      <div className="text-center py-20">
        <p className="text-white/30 text-lg">画廊功能即将上线</p>
        <p className="text-white/15 text-sm mt-2">
          照片将通过旅行记录页面中的照片组件展示
        </p>
      </div>
    </div>
  );
}
