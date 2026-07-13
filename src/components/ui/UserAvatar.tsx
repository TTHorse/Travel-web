import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  url?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

export function UserAvatar({
  url,
  name,
  size = 40,
  className,
}: UserAvatarProps) {
  const sizeStyle = { width: size, height: size };

  if (url) {
    return (
      <img
        src={url}
        alt={name ?? "用户头像"}
        width={size}
        height={size}
        className={cn("rounded-full object-cover flex-shrink-0", className)}
        style={sizeStyle}
      />
    );
  }

  // fallback: 首字母 > User 图标
  if (name) {
    return (
      <div
        className={cn(
          "rounded-full bg-white/10 flex items-center justify-center flex-shrink-0",
          className
        )}
        style={sizeStyle}
        aria-hidden="true"
      >
        <span
          className="text-white/40 font-medium select-none"
          style={{ fontSize: size * 0.4 }}
        >
          {name[0].toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-white/10 flex items-center justify-center flex-shrink-0",
        className
      )}
      style={sizeStyle}
      aria-hidden="true"
    >
      <User size={size * 0.55} className="text-white/30" />
    </div>
  );
}
