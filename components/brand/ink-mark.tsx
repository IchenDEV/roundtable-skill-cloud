import { cn } from "@/lib/utils";

/** 水墨意象：远山与留白，可作站点徽记（装饰性，由父级提供文案即可） */
export function InkMark({
  className,
  "aria-hidden": ariaHidden = true,
}: {
  className?: string;
  "aria-hidden"?: boolean;
}) {
  return (
    <svg
      className={cn("shrink-0 text-ink-900", className)}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={ariaHidden}
    >
      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.35" />
      <path
        d="M10 32c6-10 10-14 14-14s8 4 14 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.55"
      />
      <path
        d="M14 34c5-6 9-9 14-9s9 3 14 9"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeOpacity="0.35"
      />
      <circle cx="34" cy="14" r="3.5" fill="currentColor" fillOpacity="0.12" />
    </svg>
  );
}

/** 页脚或分隔用极淡水纹 */
export function InkRipple({ className }: { className?: string }) {
  return (
    <svg
      className={cn("w-full text-ink-900", className)}
      viewBox="0 0 480 24"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M0 14c40-8 80-8 120 0s80 8 120 0 80-8 120 0 80 8 120 0"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeOpacity="0.2"
        strokeLinecap="round"
      />
      <path
        d="M0 18c48-5 96-5 144 0s96 5 144 0 96-5 144 0 96 5 144 0"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeOpacity="0.12"
        strokeLinecap="round"
      />
    </svg>
  );
}
