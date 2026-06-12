"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, MapPin } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { TripSummary } from "@/types/trip";

export function TripCard({ trip }: { trip: TripSummary }) {
  const coverUrl =
    trip.cover_image ||
    trip.photos?.[0]?.url ||
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -8 }}
    >
      <Link href={`/trips/${trip.slug}`} className="block group">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-white/5">
          <Image
            src={coverUrl}
            alt={trip.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* 标签 */}
          {trip.tags && trip.tags.length > 0 && (
            <div className="absolute top-3 left-3 flex gap-2">
              {trip.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="bg-black/40 backdrop-blur-sm text-white/80 text-xs px-2.5 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 底部信息 */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h2 className="text-xl font-bold text-white">{trip.title}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-white/70">
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {trip.destination}
              </span>
              {trip.start_date && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {formatDate(trip.start_date, "yyyy.MM.dd")}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
