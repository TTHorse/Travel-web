import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ hover = true, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white/5 border border-white/10 overflow-hidden",
        hover && "transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
