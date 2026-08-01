"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

/* ---------------- Button ---------------- */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger" | "subtle";
  size?: "sm" | "md" | "icon";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const variants: Record<string, string> = {
    primary: "bg-primary text-primary-fg hover:opacity-90 shadow-sm",
    ghost: "hover:bg-surface-2 text-foreground",
    outline: "border border-border bg-surface hover:bg-surface-2",
    danger: "bg-danger text-white hover:opacity-90",
    subtle: "bg-surface-2 text-foreground hover:brightness-95",
  };
  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-sm gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    icon: "h-9 w-9 justify-center",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

/* ---------------- Card ---------------- */
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card", className)} {...props} />;
}

/* ---------------- Badge ---------------- */
export function Badge({
  className,
  color,
  children,
}: {
  className?: string;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
      style={color ? { backgroundColor: `${color}1a`, color } : undefined}
    >
      {color && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </span>
  );
}

/* ---------------- Inputs ---------------- */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring placeholder:text-muted",
        className,
      )}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full rounded-lg border border-border bg-surface p-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring placeholder:text-muted",
        className,
      )}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-foreground", className)}
      {...props}
    />
  );
}

/* ---------------- Modal ---------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className={cn("card my-8 w-full max-w-lg p-5", className)}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{title}</h2>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="close">
              <X size={18} />
            </Button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
