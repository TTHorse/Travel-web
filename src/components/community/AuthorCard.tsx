import Link from "next/link";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface AuthorCardProps {
  userId: string;
  displayName: string | null;
  avatarUrl?: string | null;
  className?: string;
}

export function AuthorCard({
  userId,
  displayName,
  avatarUrl,
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
      <UserAvatar
        url={avatarUrl}
        name={displayName}
        size={48}
      />
      <div>
        <p className="text-white text-sm font-medium group-hover:text-orange-400 transition-colors">
          {displayName || "用户"}
        </p>
        <p className="text-white/30 text-xs mt-0.5">查看作者主页 →</p>
      </div>
    </Link>
  );
}
