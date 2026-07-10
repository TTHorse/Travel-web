import { User, Calendar, MapPin, Heart } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { PublicUserProfile } from "@/lib/data/users";

interface UserHeroProps {
  profile: PublicUserProfile;
}

export function UserHero({ profile }: UserHeroProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
      {/* 头像 */}
      <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 ring-2 ring-white/10">
        <User size={36} className="text-white/30" />
      </div>

      {/* 信息 */}
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-white">
          {profile.display_name || "用户"}
        </h1>
        <p className="text-white/40 text-sm mt-1 flex items-center gap-1.5">
          <Calendar size={14} />
          {profile.created_at
            ? `${formatDate(profile.created_at, "yyyy年MM月")} 加入`
            : ""}
        </p>
      </div>

      {/* 统计数据 */}
      <div className="flex gap-6">
        <div className="text-center">
          <div className="flex items-center gap-1 text-white/60">
            <MapPin size={14} />
            <span className="text-2xl font-bold text-white">
              {profile.trip_count}
            </span>
          </div>
          <p className="text-white/30 text-xs mt-0.5">游记</p>
        </div>
        <div className="text-center">
          <div className="flex items-center gap-1 text-white/60">
            <MapPin size={14} />
            <span className="text-2xl font-bold text-white">
              {profile.country_count}
            </span>
          </div>
          <p className="text-white/30 text-xs mt-0.5">国家</p>
        </div>
        <div className="text-center">
          <div className="flex items-center gap-1 text-white/60">
            <Heart size={14} />
            <span className="text-2xl font-bold text-white">
              {profile.favorites_count}
            </span>
          </div>
          <p className="text-white/30 text-xs mt-0.5">收藏</p>
        </div>
      </div>
    </div>
  );
}
