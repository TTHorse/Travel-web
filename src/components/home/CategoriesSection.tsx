"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

interface Category {
  slug: string;
  title: string;
  subtitle: string;
  image: string;
  photoCount: number;
}

const CATEGORIES: Category[] = [
  {
    slug: "city-walks",
    title: "城市漫步",
    subtitle: "街角巷尾的温柔时光",
    image: "/cat-02.jpg",
    photoCount: 6,
  },
  {
    slug: "nature-escapes",
    title: "山川湖海",
    subtitle: "大自然里的辽阔呼吸",
    image: "/cat-01.png",
    photoCount: 4,
  },
  {
    slug: "food-journeys",
    title: "舌尖旅程",
    subtitle: "每一口都是当地的味道",
    image: "/cat-02.jpg",
    photoCount: 8,
  },
  {
    slug: "sunset-moments",
    title: "落日收藏家",
    subtitle: "收集世界各地的黄昏",
    image: "/cat-01.png",
    photoCount: 5,
  },
];

function CategoryCard({
  category,
  index,
}: {
  category: Category;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 60, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          delay: index * 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top bottom-=80px",
            toggleActions: "play none none none",
          },
        }
      );
    },
    { scope: cardRef }
  );

  return (
    <div ref={cardRef} className="opacity-0">
      <Link
        href={`/categories/${category.slug}`}
        className="block group relative aspect-[3/4] overflow-hidden rounded-2xl bg-white/5"
      >
        <Image
          src={category.image}
          alt={category.title}
          fill
          className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {/* 内容 */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-2xl font-bold text-white mb-1 group-hover:translate-x-1 transition-transform">
            {category.title}
          </h3>
          <p className="text-white/60 text-sm mb-3">{category.subtitle}</p>
          <div className="flex items-center justify-between">
            <span className="text-white/40 text-xs">
              {category.photoCount} 张照片
            </span>
            <span className="flex items-center gap-1 text-white/50 text-xs group-hover:text-white transition-colors">
              浏览 <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export function CategoriesSection() {
  const headingRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".cat-heading",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: headingRef.current,
            start: "top bottom-=100px",
            toggleActions: "play none none none",
          },
        }
      );
    },
    { scope: headingRef }
  );

  return (
    <section className="py-20 md:py-28 px-4">
      <div ref={headingRef} className="max-w-7xl mx-auto">
        {/* 标题区 */}
        <div className="cat-heading opacity-0 text-center mb-14">
          <p className="text-white/40 text-sm tracking-[0.2em] mb-3 uppercase">
            Discover
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">
            旅行分类
          </h2>
          <p className="text-white/40 text-sm md:text-base max-w-md mx-auto">
            按主题探索我的旅行记忆
          </p>
        </div>

        {/* 卡片网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CATEGORIES.map((category, index) => (
            <CategoryCard
              key={category.slug}
              category={category}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
