import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

export const GradientText = ({ children, className, as: Tag = "span" }: GradientTextProps) => {
  return (
    <Tag
      className={cn(
        "text-gradient bg-[length:200%_200%] animate-gradient",
        className
      )}
    >
      {children}
    </Tag>
  );
};
