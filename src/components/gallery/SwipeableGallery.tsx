"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface GalleryPhoto {
  src: string;
  alt: string;
  story: string;
  location?: string;
  date?: string;
}

interface SwipeableGalleryProps {
  photos: GalleryPhoto[];
}

export function SwipeableGallery({ photos }: SwipeableGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 = 左滑, 1 = 右滑
  const [fullscreen, setFullscreen] = useState(false);

  const currentPhoto = photos[currentIndex];

  const goTo = useCallback(
    (newIndex: number) => {
      if (newIndex < 0 || newIndex >= photos.length) return;
      setDirection(newIndex > currentIndex ? 1 : -1);
      setCurrentIndex(newIndex);
    },
    [currentIndex, photos.length]
  );

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 80;
      if (info.offset.x < -threshold) {
        goTo(currentIndex + 1);
      } else if (info.offset.x > threshold) {
        goTo(currentIndex - 1);
      }
    },
    [currentIndex, goTo]
  );

  // 键盘左右键
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") goTo(currentIndex - 1);
      if (e.key === "ArrowRight") goTo(currentIndex + 1);
    },
    [currentIndex, goTo]
  );

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.3 },
    }),
  };

  const storyVariants = {
    enter: { opacity: 0, y: 20 },
    center: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay: 0.15 },
    },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  return (
    <>
      {/* 主画廊 */}
      <div
        className="relative w-full select-none"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* 图片区域 */}
        <div className="relative aspect-[4/3] md:aspect-[16/9] overflow-hidden rounded-2xl bg-white/5 group">
          <AnimatePresence custom={direction} mode="popLayout">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
              onClick={() => setFullscreen(true)}
            >
              <Image
                src={currentPhoto.src}
                alt={currentPhoto.alt}
                fill
                className="object-cover pointer-events-none"
                sizes="(max-width: 768px) 100vw, 80vw"
                priority
              />
            </motion.div>
          </AnimatePresence>

          {/* 左右箭头 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goTo(currentIndex - 1);
            }}
            disabled={currentIndex === 0}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goTo(currentIndex + 1);
            }}
            disabled={currentIndex === photos.length - 1}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
          >
            <ChevronRight size={22} />
          </button>

          {/* 页码指示器 */}
          <div className="absolute top-3 right-3 z-10 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-white/70 text-xs">
            {currentIndex + 1} / {photos.length}
          </div>
        </div>

        {/* 圆点指示器 */}
        <div className="flex justify-center gap-2 mt-4">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-white w-6"
                  : "bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`第 ${index + 1} 张`}
            />
          ))}
        </div>
      </div>

      {/* 故事文案区 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`story-${currentIndex}`}
          variants={storyVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="mt-6 bg-white/5 rounded-xl p-6 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-3">
            {currentPhoto.location && (
              <span className="text-white/40 text-xs flex items-center gap-1">
                📍 {currentPhoto.location}
              </span>
            )}
            {currentPhoto.date && (
              <span className="text-white/30 text-xs">
                {currentPhoto.date}
              </span>
            )}
          </div>
          <p className="text-white/70 leading-relaxed text-sm md:text-base">
            {currentPhoto.story}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* 全屏模式 */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={() => setFullscreen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setFullscreen(false);
              if (e.key === "ArrowLeft") goTo(currentIndex - 1);
              if (e.key === "ArrowRight") goTo(currentIndex + 1);
            }}
            tabIndex={0}
          >
            <button
              onClick={() => setFullscreen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
            >
              <X size={22} />
            </button>

            <div className="absolute top-4 left-4 z-10 bg-white/10 rounded-full px-4 py-1.5 text-white/60 text-sm">
              {currentIndex + 1} / {photos.length}
            </div>

            <div className="relative w-full h-full p-8 md:p-16">
              <AnimatePresence custom={direction} mode="popLayout">
                <motion.div
                  key={`full-${currentIndex}`}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.15}
                  onDragEnd={handleDragEnd}
                  className="absolute inset-8 md:inset-16 cursor-grab active:cursor-grabbing"
                >
                  <Image
                    src={currentPhoto.src}
                    alt={currentPhoto.alt}
                    fill
                    className="object-contain pointer-events-none"
                    sizes="100vw"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                goTo(currentIndex - 1);
              }}
              disabled={currentIndex === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={26} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goTo(currentIndex + 1);
              }}
              disabled={currentIndex === photos.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors disabled:opacity-30"
            >
              <ChevronRight size={26} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
