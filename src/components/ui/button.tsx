import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-bold tracking-[0.04em] cursor-pointer transition-[box-shadow,transform,background-color,color] duration-150 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-2 border-primary bg-primary uppercase text-primary-foreground shadow-[var(--shadow-ink)] hover:shadow-[var(--shadow-ink-pressed)] focus-visible:shadow-[var(--shadow-ink-pressed),0_0_0_6px_var(--background)]",
        destructive: "border-2 border-destructive bg-destructive uppercase text-destructive-foreground hover:bg-destructive/90",
        outline: "border-2 border-primary bg-transparent text-primary hover:bg-primary/10",
        secondary: "bg-surface text-foreground hover:bg-surface/70",
        ghost: "text-foreground hover:bg-surface",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-11 px-6 py-3",
        sm: "min-h-11 px-4 py-2 text-xs",
        lg: "min-h-12 px-8 py-3",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
