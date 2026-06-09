import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantStyles = {
  primary: "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-dark active:scale-[0.98]",
  secondary: "bg-primary-light text-primary hover:bg-indigo-100 active:scale-[0.98]",
  ghost: "bg-transparent text-gray-600 hover:bg-gray-100 active:scale-[0.97]",
  danger: "bg-red-500 text-white hover:bg-red-600 active:scale-[0.98]",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs rounded-xl",
  md: "px-4 py-2.5 text-sm rounded-2xl",
  lg: "px-5 py-3.5 text-sm rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "font-semibold transition-all duration-150 flex items-center justify-center gap-2 select-none",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
