import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400/50 disabled:opacity-50 disabled:cursor-not-allowed",
        {
          "bg-white text-black hover:bg-white/90": variant === "primary",
          "bg-white/10 text-white hover:bg-white/20": variant === "secondary",
          "text-white/60 hover:text-white hover:bg-white/5": variant === "ghost",
        },
        {
          "px-3 py-1.5 text-sm": size === "sm",
          "px-6 py-2 text-sm": size === "md",
          "px-8 py-3 text-base": size === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
