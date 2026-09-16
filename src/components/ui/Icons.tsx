import type { SVGProps } from "react";

/** One linear icon family. Stroke 1.6, round caps. No emojis, no mixed libraries. */
type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 18) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
});

export const ArrowRight = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const ArrowUpRight = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);
export const ArrowDown = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
);
export const ArrowLeft = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);
export const Plus = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const Minus = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M5 12h14" />
  </svg>
);
export const Close = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const Menu = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 8h16M4 16h16" />
  </svg>
);
export const Play = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} fill="currentColor" stroke="none">
    <path d="M8 5.5v13l11-6.5z" />
  </svg>
);
export const Pause = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} fill="currentColor" stroke="none">
    <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
  </svg>
);
export const Check = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="m5 12 4.5 4.5L19 7" />
  </svg>
);
export const Spinner = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} className={"animate-spin " + (p.className ?? "")}>
    <path d="M12 3a9 9 0 1 0 9 9" />
  </svg>
);
export const Instagram = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <circle cx="12" cy="12" r="3.8" />
    <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);
export const LinkedIn = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M6.5 9.5v8M6.5 6.4v.1M10.5 17.5v-8M10.5 12.5c0-1.7 1.2-3 2.9-3s3.1 1.3 3.1 3v5" />
  </svg>
);
export const Mail = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);
