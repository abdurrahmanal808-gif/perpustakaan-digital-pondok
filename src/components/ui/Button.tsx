import type { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  variant?: ButtonVariant;
};

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export function buttonClassName(
  variant: ButtonVariant = "primary",
  className?: string
) {
  return clsx(
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-ink/30 disabled:cursor-not-allowed disabled:opacity-60",
    variant === "primary" && "bg-pondok text-white hover:bg-ink",
    variant === "secondary" &&
      "border border-gold/40 bg-bone text-ink hover:bg-cream",
    variant === "danger" && "bg-red-700 text-white hover:bg-red-800",
    variant === "ghost" && "text-slate-700 hover:bg-cream",
    className
  );
}

export function Button({
  children,
  className,
  icon,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName(variant, className)}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
