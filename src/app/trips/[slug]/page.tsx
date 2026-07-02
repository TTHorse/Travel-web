import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { getTripBySlug, getPublishedTrips } from "@/lib/data/trips";
import { MarkdownRenderer } from "@/components/trip/MarkdownRenderer";
import { PhotoGallery } from "@/components/gallery/PhotoGallery";
import { CommentSection } from "@/components/trip/CommentSection";
import { Calendar, MapPin } from "lucide-react";
import { formatDateRange } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const trips = await getPublishedTrips();
    return trips.map((trip) => ({ slug: trip.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const trip = await getTripBySlug(slug);
    if (!trip) return { title: "未找到" };

    return {
      title: trip.title,
      description:
        trip.description || `我在${trip.destination}的旅行记录`,
      openGraph: {
        images: trip.cover_image ? [trip.cover_image] : [],
      },
    };
  } catch {
    return { title: "旅行详情" };
  }
}

export const revalidate = 86400;

export default async function TripDetailPage({ params }: Props) {
  const { slug } = await params;

  let trip: Awaited<ReturnType<typeof getTripBySlug>> = null;

  try {
    trip = await getTripBySlug(slug);
  } catch {
    // 数据库未配置
  }

  if (!trip) {
    notFound();
  }

  const coverUrl =
    trip.cover_image ||
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=2400&auto=format&fit=crop";

  return (
    <article>
      {/* 封面大图 */}
      <div className="relative h-[60vh] min-h-[400px] overflow-hidden">
        <Image
          src={coverUrl}
          alt={trip.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            {trip.title}
          </h1>
          <div className="flex flex-wrap gap-4 text-white/70">
            <span className="flex items-center gap-1.5">
              <MapPin size={16} />
              {trip.destination}, {trip.country}
            </span>
            {(trip.start_date || trip.end_date) && (
              <span className="flex items-center gap-1.5">
                <Calendar size={16} />
                {formatDateRange(trip.start_date, trip.end_date)}
              </span>
            )}
          </div>
          {trip.tags && trip.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {trip.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-white/10 backdrop-blur-sm text-white/70 text-xs px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 正文内容 */}
      {trip.content && (
        <div className="max-w-3xl mx-auto px-4 py-12">
          <MarkdownRenderer content={trip.content} />
        </div>
      )}

      {/* 照片画廊 */}
      {trip.photos && trip.photos.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-8">旅行照片</h2>
          <PhotoGallery photos={trip.photos} />
        </section>
      )}

      {/* 评论区 */}
      <section className="max-w-3xl mx-auto px-4 py-12 border-t border-white/10">
        <CommentSection tripId={trip.id} />
      </section>
    </article>
  );
}
