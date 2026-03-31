import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

export const IconFrame = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <span
    className={cn(
      "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/50 text-primary shadow-glow-xs",
      className
    )}
  >
    {children}
  </span>
);

export const BrandMarkIcon = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={cn("h-4 w-4", className)} {...props}>
    <rect x="3" y="3" width="42" height="42" rx="5" stroke="currentColor" strokeWidth="3" />
    <path d="M11 13v24h8V23z" fill="currentColor" />
    <circle cx="32" cy="25" r="7.5" stroke="currentColor" strokeWidth="3" />
    <path d="M37 30l6 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const ArrowNudgeIcon = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", className)} {...props}>
    <path d="M5 12h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const OverviewGlyph = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", className)} {...props}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.9" />
    <rect x="13" y="4" width="7" height="4" rx="1.5" fill="currentColor" opacity="0.55" />
    <rect x="13" y="10" width="7" height="10" rx="1.5" fill="currentColor" opacity="0.85" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.55" />
  </svg>
);

export const TrackerGlyph = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", className)} {...props}>
    <path d="M4 7h7M4 12h5M4 17h8M14 7h6M12 12h8M15 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const ProfileGlyph = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", className)} {...props}>
    <circle cx="12" cy="8.2" r="3.2" fill="currentColor" opacity="0.9" />
    <path d="M5 19.2c1.5-3 4-4.4 7-4.4s5.5 1.4 7 4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const AnalyzerGlyph = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", className)} {...props}>
    <path d="M4.5 16l4.2-4.2 3 2.8 5.8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

export const MailGlyph = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", className)} {...props}>
    <rect x="4" y="6" width="16" height="12" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M6.5 8.2L12 12l5.5-3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SunGlyph = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", className)} {...props}>
    <circle cx="12" cy="12" r="3.2" fill="currentColor" />
    <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18.2 5.8l-1.5 1.5M7.3 16.7l-1.5 1.5M18.2 18.2l-1.5-1.5M7.3 7.3L5.8 5.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export const MoonGlyph = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", className)} {...props}>
    <path d="M14.8 4.2a8 8 0 109 9 7 7 0 01-9-9z" fill="currentColor" />
  </svg>
);

export const StrengthGlyph = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4 text-emerald-400", className)} {...props}>
    <path d="M5.5 12.5l4 4 9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const GapGlyph = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4 text-rose-400", className)} {...props}>
    <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const SuggestionGlyph = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4 text-amber-300", className)} {...props}>
    <path d="M12 4.5a5.5 5.5 0 00-3.8 9.5c.9.9 1.3 1.6 1.4 2.5h4.8c.1-.9.5-1.6 1.4-2.5A5.5 5.5 0 0012 4.5z" stroke="currentColor" strokeWidth="1.6" />
    <path d="M10 19h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const CopyGlyph = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", className)} {...props}>
    <rect x="9" y="8" width="10" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <rect x="5" y="4" width="10" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" opacity="0.7" />
  </svg>
);

export const RefreshGlyph = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", className)} {...props}>
    <path d="M19 7v4h-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 17v-4h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.5 9a6 6 0 019.4-2M16.5 15a6 6 0 01-9.4 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

export const SaveGlyph = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", className)} {...props}>
    <path d="M6 5h10l3 3v11H6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <rect x="8.5" y="5.5" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
    <path d="M9 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const SearchGlyph = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", className)} {...props}>
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

export const PlusGlyph = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", className)} {...props}>
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const SparkGlyph = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", className)} {...props}>
    <path d="M12 4l1.7 4.3L18 10l-4.3 1.7L12 16l-1.7-4.3L6 10l4.3-1.7L12 4z" fill="currentColor" />
    <path d="M18.8 3.6l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7.7-1.7zM4.4 15.6l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6.6-1.4z" fill="currentColor" opacity="0.75" />
  </svg>
);

export const WandGlyph = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", className)} {...props}>
    <path d="M5 19l9.5-9.5 2 2L7 21H5v-2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M14.5 4.5l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6.6-1.5zM19 9l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5.5-1.2z" fill="currentColor" />
  </svg>
);

export const InterviewGlyph = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", className)} {...props}>
    <rect x="4.5" y="5" width="15" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8 19h8M10 15v4M14 15v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const LetterGlyph = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", className)} {...props}>
    <rect x="5" y="4.5" width="14" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8.5 9h7M8.5 12h7M8.5 15h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const TailorGlyph = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", className)} {...props}>
    <path d="M6 7h12M6 12h7M6 17h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="17.5" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);
