import { cn } from "@/lib/utils";

/** 圆桌意象：俯视一张桌与数席围坐，可作站点徽记（装饰性，由父级提供文案即可） */
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
      <circle cx="24" cy="24" r="20.5" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.18" />
      <circle cx="24" cy="24" r="9.6" fill="currentColor" fillOpacity="0.07" />
      <circle cx="24" cy="24" r="9.6" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.62" />
      <circle cx="24" cy="24" r="4.2" stroke="currentColor" strokeWidth="1" strokeOpacity="0.22" />

      <rect
        x="21.2"
        y="4.7"
        width="5.6"
        height="8"
        rx="2.8"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="0.9"
      />
      <rect
        x="34.95"
        y="10.3"
        width="5.6"
        height="8"
        rx="2.8"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="0.9"
        transform="rotate(60 37.75 14.3)"
      />
      <rect
        x="34.95"
        y="29.7"
        width="5.6"
        height="8"
        rx="2.8"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="0.9"
        transform="rotate(120 37.75 33.7)"
      />
      <rect
        x="21.2"
        y="35.3"
        width="5.6"
        height="8"
        rx="2.8"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="0.9"
      />
      <rect
        x="7.45"
        y="29.7"
        width="5.6"
        height="8"
        rx="2.8"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="0.9"
        transform="rotate(-120 10.25 33.7)"
      />
      <rect
        x="7.45"
        y="10.3"
        width="5.6"
        height="8"
        rx="2.8"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="0.9"
        transform="rotate(-60 10.25 14.3)"
      />

      <path
        d="M20.6 24c1.55 1.45 3.05 2.15 4.5 2.15 1.39 0 2.82-.65 4.3-1.95"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeOpacity="0.22"
      />
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
