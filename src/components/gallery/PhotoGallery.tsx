"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import type { Photo } from "@/types/photo";

interface PhotoGalleryProps {
  photos: Photo[];
  columns?: number;
}

export function PhotoGallery({ photos, columns = 3 }: PhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // 瀑布流分布：短列优先
  function distributeToColumns(items: Photo[], colCount: number): Photo[][] {
    const cols: Photo[][] = Array.from({ length: colCount }, () => []);
    const heights: number[] = Array(colCount).fill(0);

    items.forEach((photo) => {
      // 找到当前最短的列
      const shortestIdx = heights.indexOf(Math.min(...heights));
      cols[shortestIdx].push(photo);
      // 用宽高比估算高度（假设统一宽度）
      heights[shortestIdx] +=
        photo.height / Math.max(photo.width, 1) || 1;
    });

    return cols;
  }

  const distributed = distributeToColumns(photos, columns);

  // 构建 Lightbox slides
  const slides = photos.map((photo) => ({
    src: photo.url,
    width: photo.width,
    height: photo.height,
    alt: photo.caption || "",
  }));

  // 找到 photo 在全局数组中的索引
  const getGlobalIndex = (photo: Photo) =>
    photos.findIndex((p) => p.id === photo.id);

  return (
    <>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {distributed.map((column, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-3">
            {column.map((photo) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                className="relative overflow-hidden rounded-lg cursor-pointer group bg-white/5"
                onClick={() => {
                  setLightboxIndex(getGlobalIndex(photo));
                  setLightboxOpen(true);
                }}
              >
                <div className="relative w-full">
                  <Image
                    src={photo.thumbnail_url || photo.url}
                    alt={photo.caption || "旅行照片"}
                    width={photo.width}
                    height={photo.height}
                    className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
                    sizes={`(max-width: 768px) 50vw, ${100 / columns}vw`}
                  />
                </div>
                {photo.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-sm">{photo.caption}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ))}
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={slides}
      />
    </>
  );
}
