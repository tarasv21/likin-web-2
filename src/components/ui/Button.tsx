import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowUpRight } from "./Icons";

type Variant = "primary" | "secondary" | "ghost" | "inverse" | "ink";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-teal text-obsidian border border-teal hover:bg-mint hover:border-mint active:bg-teal-mid",
  secondary: "bg-transparent text-cloud border border-outline hover:bg-graphite hover:border-steel",
  ghost: "bg-transparent text-cloud border border-transparent hover:text-teal",
  inverse: "bg-cloud text-obsidian border border-cloud hover:bg-ice",
  ink: "bg-ink text-cloud border border-ink hover:bg-graphite",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-[0.9375rem]",
  md: "h-12 px-5 text-base",
  lg: "h-14 px-7 text-[1.0625rem]",
};

type Common = {
  variant?: Variant;
  size?: Size;
  arrow?: "right" | "up-right" | "none";
  className?: string;
  children: ReactNode;
  full?: boolean;
};

type AsLink = Common & { href: string; external?: boolean } & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">;
type AsButton = Common & { href?: undefined } & Omit<ComponentProps<"button">, "className" | "children">;

export type ButtonProps = AsLink | AsButton;

const baseClass =
  "group/btn inline-flex items-center justify-center gap-2 rounded-button font-medium tracking-[-0.01em] whitespace-nowrap transition-[background-color,border-color,color,transform] duration-(--dur-fast) ease-(--ease-out) select-none active:scale-[0.985] disabled:opacity-50 disabled:pointer-events-none";

function Arrow({ kind }: { kind: NonNullable<Common["arrow"]> }) {
  if (kind === "none") return null;
  const Icon = kind === "right" ? ArrowRight : ArrowUpRight;
  return (
    <Icon
      size={18}
      className={cn(
        "shrink-0 transition-transform duration-(--dur-fast) ease-(--ease-out)",
        kind === "right" ? "group-hover/btn:translate-x-0.5" : "group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5",
      )}
    />
  );
}

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", arrow = "right", className, children, full } = props;
  const cls = cn(baseClass, variants[variant], variant === "ghost" ? sizes[size].replace(/px-\d+/, "px-2") : sizes[size], full && "w-full", className);

  if ("href" in props && props.href !== undefined) {
    const { href, external, variant: _v, size: _s, arrow: _a, className: _c, children: _ch, full: _f, ...rest } = props;
    void _v; void _s; void _a; void _c; void _ch; void _f;
    if (external) {
      return (
        <a href={href} className={cls} target="_blank" rel="noopener noreferrer" {...(rest as ComponentProps<"a">)}>
          <span>{children}</span>
          <Arrow kind={arrow === "right" ? "up-right" : arrow} />
        </a>
      );
    }
    return (
      <Link href={href} className={cls} {...rest}>
        <span>{children}</span>
        <Arrow kind={arrow} />
      </Link>
    );
  }
  const { variant: _v, size: _s, arrow: _a, className: _c, children: _ch, full: _f, href: _h, ...rest } = props as AsButton;
  void _v; void _s; void _a; void _c; void _ch; void _f; void _h;
  return (
    <button type="button" className={cls} {...rest}>
      <span>{children}</span>
      <Arrow kind={arrow} />
    </button>
  );
}

/** Text link with an arrow that responds on hover. */
export function TextLink({ href, children, className, external, muted }: { href: string; children: ReactNode; className?: string; external?: boolean; muted?: boolean }) {
  const cls = cn("group/tl inline-flex items-center gap-1.5 font-medium transition-colors duration-(--dur-fast)", muted ? "text-steel hover:text-cloud" : "text-cloud hover:text-teal", className);
  const Icon = external ? ArrowUpRight : ArrowRight;
  const icon = <Icon size={16} className={cn("transition-transform duration-(--dur-fast)", external ? "group-hover/tl:translate-x-0.5 group-hover/tl:-translate-y-0.5" : "group-hover/tl:translate-x-0.5")} />;
  if (external)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children} {icon}
      </a>
    );
  return (
    <Link href={href} className={cls}>
      {children} {icon}
    </Link>
  );
}
