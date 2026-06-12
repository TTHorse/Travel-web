"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const trigger = containerRef.current;
      if (!trigger) return;

      // 左图向上移动
      gsap.to(".hero-left", {
        yPercent: -20,
        ease: "none",
        scrollTrigger: {
          trigger,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // 右图向下移动（错开视差）
      gsap.to(".hero-right", {
        yPercent: 20,
        ease: "none",
        scrollTrigger: {
          trigger,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // 中间内容淡出
      gsap.to(".hero-content", {
        opacity: 0,
        y: 100,
        scrollTrigger: {
          trigger,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="hero-container relative h-screen overflow-hidden bg-black"
    >
      {/* 左图 */}
      <div className="hero-left absolute left-0 top-0 w-1/2 h-full overflow-hidden">
        <Image
          src="/cat-02.jpg"
          alt="旅行记忆"
          fill
          className="object-cover"
          priority
          loading="eager"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-black/45" />
      </div>

      {/* 右图 */}
      <div className="hero-right absolute right-0 top-0 w-1/2 h-full overflow-hidden">
        <Image
          src="/cat-01.png"
          alt="旅行故事"
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-black/45" />
      </div>

      {/* 中间分割线 */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20 z-10 hidden md:block" />

      {/* 中央内容 */}
      <div className="hero-content absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
        <div className="bg-black/40 backdrop-blur-sm rounded-3xl px-8 py-10 md:px-16 md:py-14 max-w-xl">
          <p className="text-white/60 text-sm md:text-base tracking-[0.2em] mb-4 uppercase">
            Explore &middot; Capture &middot; Remember
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tight">
            探索世界
          </h1>
          <p className="text-white/50 text-base md:text-lg font-light leading-relaxed">
            记录每一次旅行，分享每一份感动
          </p>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
        <ChevronDown className="text-white/40" size={32} />
      </div>
    </div>
  );
}
