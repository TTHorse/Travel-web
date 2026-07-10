import Link from "next/link";
import { User, MapPin, Calendar, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthorCardProps {
  userId: string;
  displayName: string | null;
  className?: string;
}

export function AuthorCard({
  userId,
  displayName,
  className,
}: AuthorCardProps) {
  return (
    <Link
      href={`/users/${userId}`}
      className={cn(
        "flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition-all group",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/15 transition-colors">
        <User size={22} className="text-white/40" />
      </div>
      <div>
        <p className="text-white text-sm font-medium group-hover:text-orange-400 transition-colors">
          {displayName || "用户"}
        </p>
        <p className="text-white/30 text-xs mt-0.5">查看作者主页 →</p>
      </div>
    </Link>
  );
}
